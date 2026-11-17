<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInfrastructureAssetRequest;
use App\Http\Requests\UpdateInfrastructureAssetRequest;
use App\Models\InfrastructureAsset;
use App\Services\AssetImportService;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InfrastructureAssetController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService,
        protected AssetImportService $assetImportService
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', InfrastructureAsset::class);

        $query = InfrastructureAsset::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('hostname', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%");
            });
        }

        if ($env = $request->query('environment')) {
            $query->where('environment', $env);
        }

        if ($type = $request->query('asset_type')) {
            $query->where('asset_type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $assets = $query->withCount('tasks')->orderBy('name', 'asc')->paginate(15)->withQueryString();

        return Inertia::render('Infrastructure/Index', [
            'assets' => $assets,
            'filters' => $request->only(['search', 'environment', 'asset_type', 'status']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', InfrastructureAsset::class);

        return Inertia::render('Infrastructure/Create');
    }

    public function store(StoreInfrastructureAssetRequest $request): RedirectResponse
    {
        $asset = InfrastructureAsset::create($request->validated());

        $this->auditLogService->log(
            event: 'asset_created',
            model: $asset,
            newValues: $asset->only(['name', 'asset_type', 'environment', 'status']),
            userId: $request->user()->id
        );

        return redirect()->route('infrastructure.show', $asset)->with('success', "Aset {$asset->name} berhasil ditambahkan.");
    }

    public function show(InfrastructureAsset $infrastructure): Response
    {
        $this->authorize('view', $infrastructure);

        $infrastructure->load(['tasks.category', 'tasks.creator']);

        return Inertia::render('Infrastructure/Show', [
            'asset' => $infrastructure,
        ]);
    }

    public function edit(InfrastructureAsset $infrastructure): Response
    {
        $this->authorize('update', $infrastructure);

        return Inertia::render('Infrastructure/Edit', [
            'asset' => $infrastructure,
        ]);
    }

    public function update(UpdateInfrastructureAssetRequest $request, InfrastructureAsset $infrastructure): RedirectResponse
    {
        $oldValues = $infrastructure->only(['name', 'asset_type', 'environment', 'hostname', 'ip_address', 'status']);
        $infrastructure->update($request->validated());

        $this->auditLogService->log(
            event: 'asset_updated',
            model: $infrastructure,
            oldValues: $oldValues,
            newValues: $infrastructure->only(array_keys($oldValues)),
            userId: $request->user()->id
        );

        return redirect()->route('infrastructure.show', $infrastructure)->with('success', "Aset {$infrastructure->name} berhasil diperbarui.");
    }

    public function destroy(Request $request, InfrastructureAsset $infrastructure): RedirectResponse
    {
        $this->authorize('delete', $infrastructure);

        $this->auditLogService->log(
            event: 'asset_deleted',
            model: $infrastructure,
            oldValues: ['name' => $infrastructure->name],
            userId: $request->user()->id
        );

        $infrastructure->delete();

        return redirect()->route('infrastructure.index')->with('success', "Aset {$infrastructure->name} berhasil diarsipkan.");
    }

    /**
     * Import infrastructure assets from CSV or Spreadsheet file.
     */
    public function import(Request $request): RedirectResponse
    {
        $this->authorize('create', InfrastructureAsset::class);

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:csv,txt,xlsx,xls'],
        ], [
            'file.required' => 'Silakan pilih file spreadsheet atau CSV terlebih dahulu.',
            'file.max' => 'Ukuran file tidak boleh melebihi 10 MB.',
            'file.mimes' => 'Format file harus berupa CSV (.csv) atau Excel (.xlsx, .xls).',
        ]);

        $result = $this->assetImportService->import($request->file('file'), $request->user());

        if (!empty($result['errors']) && $result['imported_count'] === 0 && $result['updated_count'] === 0) {
            return back()->with('error', 'Gagal mengimpor aset: ' . implode(' ', $result['errors']));
        }

        $message = "Proses import selesai: {$result['imported_count']} aset baru ditambahkan";
        if ($result['updated_count'] > 0) {
            $message .= ", {$result['updated_count']} aset diperbarui";
        }
        if ($result['skipped_count'] > 0) {
            $message .= ", {$result['skipped_count']} baris dilewati";
        }
        $message .= '.';

        return redirect()->route('infrastructure.index')->with('success', $message);
    }

    /**
     * Download sample CSV template for import.
     */
    public function template(): StreamedResponse
    {
        $this->authorize('create', InfrastructureAsset::class);

        $csv = $this->assetImportService->generateCsvTemplate();

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, 'template-aset-infrastruktur.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
