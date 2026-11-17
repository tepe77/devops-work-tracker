<?php

namespace App\Services;

use App\Enums\AssetEnvironment;
use App\Enums\AssetStatus;
use App\Enums\AssetType;
use App\Models\InfrastructureAsset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use SimpleXMLElement;
use ZipArchive;

class AssetImportService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Import infrastructure assets from an uploaded spreadsheet file (CSV or XLSX).
     */
    public function import(UploadedFile $file, User $user): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        $rows = [];
        if ($extension === 'xlsx') {
            $rows = $this->parseXlsx($path);
        } else {
            // Default to CSV / TSV / text
            $rows = $this->parseCsv($path);
        }

        if (empty($rows)) {
            return [
                'imported_count' => 0,
                'updated_count' => 0,
                'skipped_count' => 0,
                'errors' => ['File spreadsheet kosong atau tidak berisi baris data.'],
            ];
        }

        // The first row is headers
        $rawHeaders = array_shift($rows);
        $headerMap = $this->mapHeaders($rawHeaders);

        if (!isset($headerMap['name'])) {
            return [
                'imported_count' => 0,
                'updated_count' => 0,
                'skipped_count' => 0,
                'errors' => ['Kolom nama aset ("name" atau "nama") tidak ditemukan pada baris header file Anda.'],
            ];
        }

        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // header is row 1

                // Extract fields based on mapped column indices
                $name = isset($headerMap['name']) ? trim($row[$headerMap['name']] ?? '') : '';
                if ($name === '') {
                    $skippedCount++;
                    $errors[] = "Baris {$rowNumber}: Nama aset kosong, baris dilewati.";
                    continue;
                }

                $rawType = isset($headerMap['asset_type']) ? trim($row[$headerMap['asset_type']] ?? '') : '';
                $rawEnv = isset($headerMap['environment']) ? trim($row[$headerMap['environment']] ?? '') : '';
                $rawStatus = isset($headerMap['status']) ? trim($row[$headerMap['status']] ?? '') : '';

                $hostname = isset($headerMap['hostname']) ? trim($row[$headerMap['hostname']] ?? '') : null;
                $ipAddress = isset($headerMap['ip_address']) ? trim($row[$headerMap['ip_address']] ?? '') : null;
                $os = isset($headerMap['operating_system']) ? trim($row[$headerMap['operating_system']] ?? '') : null;
                $purpose = isset($headerMap['purpose']) ? trim($row[$headerMap['purpose']] ?? '') : null;
                $description = isset($headerMap['description']) ? trim($row[$headerMap['description']] ?? '') : null;

                $assetType = $this->normalizeAssetType($rawType);
                $environment = $this->normalizeEnvironment($rawEnv);
                $status = $this->normalizeStatus($rawStatus);

                $payload = [
                    'name' => $name,
                    'asset_type' => $assetType,
                    'environment' => $environment,
                    'status' => $status,
                    'hostname' => $hostname ?: null,
                    'ip_address' => $ipAddress ?: null,
                    'operating_system' => $os ?: null,
                    'purpose' => $purpose ?: null,
                    'description' => $description ?: null,
                ];

                // Upsert asset by name
                $existing = InfrastructureAsset::withTrashed()->where('name', $name)->first();

                if ($existing) {
                    if ($existing->trashed()) {
                        $existing->restore();
                    }
                    $oldValues = $existing->only(array_keys($payload));
                    $existing->update($payload);
                    $updatedCount++;

                    $this->auditLogService->log(
                        event: 'asset_updated',
                        model: $existing,
                        oldValues: $oldValues,
                        newValues: $payload,
                        userId: $user->id,
                        metadata: ['source' => 'spreadsheet_import']
                    );
                } else {
                    $newAsset = InfrastructureAsset::create($payload);
                    $importedCount++;

                    $this->auditLogService->log(
                        event: 'asset_created',
                        model: $newAsset,
                        newValues: $payload,
                        userId: $user->id,
                        metadata: ['source' => 'spreadsheet_import']
                    );
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return [
                'imported_count' => 0,
                'updated_count' => 0,
                'skipped_count' => 0,
                'errors' => ['Terjadi kesalahan saat memproses data: ' . $e->getMessage()],
            ];
        }

        return [
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'skipped_count' => $skippedCount,
            'errors' => $errors,
        ];
    }

    /**
     * Parse CSV / TSV file with auto delimiter detection.
     */
    public function parseCsv(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');
        if (!$handle) {
            return [];
        }

        // Read first line to detect delimiter (, or ; or \t)
        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            return [];
        }

        // Strip UTF-8 BOM if present
        $bom = pack('H*', 'EFBBBF');
        $firstLine = preg_replace("/^{$bom}/", '', $firstLine);

        $delimiter = ',';
        $semicolonCount = substr_count($firstLine, ';');
        $commaCount = substr_count($firstLine, ',');
        $tabCount = substr_count($firstLine, "\t");

        if ($semicolonCount > $commaCount && $semicolonCount > $tabCount) {
            $delimiter = ';';
        } elseif ($tabCount > $commaCount && $tabCount > $semicolonCount) {
            $delimiter = "\t";
        }

        // Rewind and parse
        rewind($handle);

        $isFirst = true;
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($isFirst) {
                // Strip BOM on first column if present
                if (isset($data[0])) {
                    $data[0] = preg_replace("/^{$bom}/", '', $data[0]);
                }
                $isFirst = false;
            }

            // Trim cell values
            $trimmed = array_map(fn($val) => is_string($val) ? trim($val) : '', $data);

            // Skip empty rows
            if (empty(array_filter($trimmed, fn($v) => $v !== ''))) {
                continue;
            }

            $rows[] = $trimmed;
        }

        fclose($handle);
        return $rows;
    }

    /**
     * Parse XLSX workbook using standard PHP ZipArchive + SimpleXML.
     */
    public function parseXlsx(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            return $this->parseCsv($path); // fallback
        }

        // 1. Shared Strings
        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml) {
            $xml = @simplexml_load_string($sharedStringsXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Locate first worksheet
        $sheetXmlContent = $zip->getFromName('xl/worksheets/sheet1.xml');
        if (!$sheetXmlContent) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);
                if (str_starts_with($filename, 'xl/worksheets/sheet') && str_ends_with($filename, '.xml')) {
                    $sheetXmlContent = $zip->getFromIndex($i);
                    break;
                }
            }
        }
        $zip->close();

        if (!$sheetXmlContent) {
            return [];
        }

        $sheetXml = @simplexml_load_string($sheetXmlContent);
        if (!$sheetXml || !isset($sheetXml->sheetData->row)) {
            return [];
        }

        $rows = [];
        foreach ($sheetXml->sheetData->row as $row) {
            $rowData = [];
            foreach ($row->c as $cell) {
                $type = (string) $cell['t'];
                $val = '';
                if ($type === 's') {
                    $index = (int) $cell->v;
                    $val = $sharedStrings[$index] ?? '';
                } elseif ($type === 'inlineStr' && isset($cell->is->t)) {
                    $val = (string) $cell->is->t;
                } elseif (isset($cell->v)) {
                    $val = (string) $cell->v;
                }
                $rowData[] = trim($val);
            }

            if (!empty(array_filter($rowData, fn($v) => $v !== ''))) {
                $rows[] = $rowData;
            }
        }

        return $rows;
    }

    /**
     * Map header names into standard model fields.
     */
    protected function mapHeaders(array $rawHeaders): array
    {
        $map = [];

        foreach ($rawHeaders as $index => $header) {
            $normalized = strtolower(trim(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace([' ', '-'], '_', $header))));

            // Name
            if (in_array($normalized, ['name', 'nama', 'nama_aset', 'asset_name', 'server_name', 'host', 'server'], true)) {
                $map['name'] = $index;
            }
            // Asset Type
            elseif (in_array($normalized, ['asset_type', 'tipe', 'tipe_aset', 'jenis', 'jenis_aset', 'type'], true)) {
                $map['asset_type'] = $index;
            }
            // Environment
            elseif (in_array($normalized, ['environment', 'env', 'lingkungan', 'tier'], true)) {
                $map['environment'] = $index;
            }
            // Hostname
            elseif (in_array($normalized, ['hostname', 'host_name', 'fqdn', 'domain'], true)) {
                $map['hostname'] = $index;
            }
            // IP Address
            elseif (in_array($normalized, ['ip_address', 'ip', 'ip_addr', 'alamat_ip'], true)) {
                $map['ip_address'] = $index;
            }
            // Operating System
            elseif (in_array($normalized, ['operating_system', 'os', 'sistem_operasi', 'distro'], true)) {
                $map['operating_system'] = $index;
            }
            // Purpose
            elseif (in_array($normalized, ['purpose', 'fungsi', 'peruntukan', 'kegunaan', 'role'], true)) {
                $map['purpose'] = $index;
            }
            // Status
            elseif (in_array($normalized, ['status', 'keadaan', 'kondisi'], true)) {
                $map['status'] = $index;
            }
            // Description
            elseif (in_array($normalized, ['description', 'deskripsi', 'keterangan', 'notes', 'catatan'], true)) {
                $map['description'] = $index;
            }
        }

        return $map;
    }

    /**
     * Normalize asset type string into a valid enum value.
     */
    protected function normalizeAssetType(string $val): string
    {
        $clean = strtolower(trim($val));

        return match (true) {
            str_contains($clean, 'vm') || str_contains($clean, 'virtual') || str_contains($clean, 'vps') => AssetType::VirtualMachine->value,
            str_contains($clean, 'physical') || str_contains($clean, 'fisik') || str_contains($clean, 'bare') => AssetType::PhysicalServer->value,
            str_contains($clean, 'data') || str_contains($clean, 'db') || str_contains($clean, 'sql') || str_contains($clean, 'redis') => AssetType::Database->value,
            str_contains($clean, 'k8s') || str_contains($clean, 'kube') || str_contains($clean, 'docker') || str_contains($clean, 'container') => AssetType::ContainerHost->value,
            str_contains($clean, 'app') || str_contains($clean, 'service') || str_contains($clean, 'aplikasi') => AssetType::ApplicationService->value,
            str_contains($clean, 'net') || str_contains($clean, 'router') || str_contains($clean, 'firewall') || str_contains($clean, 'lb') || str_contains($clean, 'switch') => AssetType::Network->value,
            str_contains($clean, 'storage') || str_contains($clean, 's3') || str_contains($clean, 'nas') || str_contains($clean, 'san') => AssetType::Storage->value,
            default => AssetType::VirtualMachine->value,
        };
    }

    /**
     * Normalize environment string into a valid enum value.
     */
    protected function normalizeEnvironment(string $val): string
    {
        $clean = strtolower(trim($val));

        return match (true) {
            str_contains($clean, 'prod') => AssetEnvironment::Production->value,
            str_contains($clean, 'stag') || str_contains($clean, 'uat') || str_contains($clean, 'pre') => AssetEnvironment::Staging->value,
            str_contains($clean, 'dev') || str_contains($clean, 'test') || str_contains($clean, 'uji') => AssetEnvironment::Development->value,
            str_contains($clean, 'dr') || str_contains($clean, 'disaster') || str_contains($clean, 'recovery') || str_contains($clean, 'backup') => AssetEnvironment::DisasterRecovery->value,
            default => AssetEnvironment::Production->value,
        };
    }

    /**
     * Normalize status string into a valid enum value.
     */
    protected function normalizeStatus(string $val): string
    {
        $clean = strtolower(trim($val));

        return match (true) {
            str_contains($clean, 'maint') || str_contains($clean, 'pelihara') => AssetStatus::Maintenance->value,
            str_contains($clean, 'retir') || str_contains($clean, 'nonaktif') || str_contains($clean, 'off') || str_contains($clean, 'mati') => AssetStatus::Retired->value,
            default => AssetStatus::Active->value,
        };
    }

    /**
     * Generate sample CSV template content.
     */
    public function generateCsvTemplate(): string
    {
        $headers = [
            'name',
            'asset_type',
            'environment',
            'ip_address',
            'hostname',
            'operating_system',
            'purpose',
            'status',
            'description',
        ];

        $sampleRows = [
            [
                'web-prod-01',
                'virtual_machine',
                'production',
                '10.10.1.10',
                'web-01.internal',
                'Ubuntu 24.04 LTS',
                'Production Web Gateway',
                'active',
                'Server Nginx reverse proxy utama',
            ],
            [
                'db-master-01',
                'database',
                'production',
                '10.10.2.15',
                'db-master.internal',
                'Debian 12',
                'PostgreSQL Primary DB',
                'active',
                'Database cluster produksi utama',
            ],
            [
                'k8s-worker-01',
                'container_host',
                'staging',
                '10.20.1.21',
                'k8s-w01.staging.internal',
                'Ubuntu 22.04 LTS',
                'Staging Kubernetes Node',
                'active',
                'Worker node klaster staging',
            ],
            [
                'storage-backup-01',
                'storage',
                'disaster_recovery',
                '10.30.1.50',
                'nas-backup.internal',
                'TrueNAS CORE',
                'Disaster Recovery Backup Storage',
                'active',
                'Penyimpanan cadangan cold storage harian',
            ],
        ];

        $output = fopen('php://temp', 'r+');
        fputcsv($output, $headers);
        foreach ($sampleRows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }
}
