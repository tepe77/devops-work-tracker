<?php

namespace Tests\Feature;

use App\Enums\AssetEnvironment;
use App\Enums\AssetStatus;
use App\Enums\AssetType;
use App\Enums\UserRole;
use App\Models\InfrastructureAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use ZipArchive;

class AssetImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);

        $this->viewer = User::factory()->create([
            'role' => UserRole::Viewer,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_download_csv_template(): void
    {
        $response = $this->actingAs($this->admin)->get('/infrastructure/template');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('name,asset_type,environment', $response->streamedContent());
    }

    public function test_viewer_cannot_download_template_or_import(): void
    {
        $this->actingAs($this->viewer)->get('/infrastructure/template')->assertForbidden();
        $this->actingAs($this->viewer)->post('/infrastructure/import', [])->assertForbidden();
    }

    public function test_guest_cannot_access_import_or_template(): void
    {
        $this->get('/infrastructure/template')->assertRedirect('/login');
        $this->post('/infrastructure/import', [])->assertRedirect('/login');
    }

    public function test_admin_can_import_assets_via_csv(): void
    {
        $csvContent = <<<CSV
name,asset_type,environment,ip_address,hostname,operating_system,purpose,status,description
app-prod-01,virtual_machine,production,10.10.1.50,app01.internal,Ubuntu 24.04,API Gateway,active,Laravel monolith host
db-replica-01,database,production,10.10.2.20,dbreplica.internal,Debian 12,PostgreSQL Replica,active,Read-only replica node
k8s-master-01,container_host,staging,10.20.1.10,k8s-m01.internal,Ubuntu 22.04,K8s Control Plane,active,Staging cluster control plane
CSV;

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/infrastructure/import', [
            'file' => $file,
        ]);

        $response->assertRedirect('/infrastructure');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('infrastructure_assets', [
            'name' => 'app-prod-01',
            'asset_type' => AssetType::VirtualMachine->value,
            'environment' => AssetEnvironment::Production->value,
            'ip_address' => '10.10.1.50',
            'status' => AssetStatus::Active->value,
        ]);

        $this->assertDatabaseHas('infrastructure_assets', [
            'name' => 'db-replica-01',
            'asset_type' => AssetType::Database->value,
            'ip_address' => '10.10.2.20',
        ]);

        $this->assertDatabaseHas('infrastructure_assets', [
            'name' => 'k8s-master-01',
            'asset_type' => AssetType::ContainerHost->value,
            'environment' => AssetEnvironment::Staging->value,
        ]);
    }

    public function test_csv_import_upserts_existing_assets_and_handles_indonesian_headers(): void
    {
        // Pre-create an existing asset
        InfrastructureAsset::create([
            'name' => 'existing-vm-01',
            'asset_type' => AssetType::VirtualMachine->value,
            'environment' => AssetEnvironment::Development->value,
            'ip_address' => '10.0.0.1',
            'status' => AssetStatus::Maintenance->value,
        ]);

        // CSV using Indonesian headers: nama, tipe, lingkungan, alamat_ip, status
        $csvContent = <<<CSV
nama;tipe;lingkungan;alamat_ip;status;keterangan
existing-vm-01;Virtual Machine;Production;10.10.1.99;Active;Updated via spreadsheet
new-server-02;Physical Server;Production;10.10.1.100;Active;New bare metal server
;Database;Production;10.10.1.101;Active;Row with empty name should be skipped
CSV;

        $file = UploadedFile::fake()->createWithContent('assets_semicolon.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/infrastructure/import', [
            'file' => $file,
        ]);

        $response->assertRedirect('/infrastructure');
        $response->assertSessionHas('success');

        // Existing asset updated to Production & IP 10.10.1.99 & Active
        $this->assertDatabaseHas('infrastructure_assets', [
            'name' => 'existing-vm-01',
            'environment' => AssetEnvironment::Production->value,
            'ip_address' => '10.10.1.99',
            'status' => AssetStatus::Active->value,
            'description' => 'Updated via spreadsheet',
        ]);

        // New asset created
        $this->assertDatabaseHas('infrastructure_assets', [
            'name' => 'new-server-02',
            'asset_type' => AssetType::PhysicalServer->value,
        ]);

        // Total count should be 2
        $this->assertEquals(2, InfrastructureAsset::count());
    }

    public function test_admin_can_import_assets_via_xlsx(): void
    {
        $tempPath = sys_get_temp_dir() . '/test_import_' . uniqid() . '.xlsx';
        $zip = new ZipArchive();
        $zip->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $sharedStringsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6">
            <si><t>name</t></si>
            <si><t>asset_type</t></si>
            <si><t>environment</t></si>
            <si><t>storage-s3-01</t></si>
            <si><t>storage</t></si>
            <si><t>production</t></si>
        </sst>';
        $zip->addFromString('xl/sharedStrings.xml', $sharedStringsXml);

        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
            <sheetData>
                <row r="1">
                    <c r="A1" t="s"><v>0</v></c>
                    <c r="B1" t="s"><v>1</v></c>
                    <c r="C1" t="s"><v>2</v></c>
                </row>
                <row r="2">
                    <c r="A2" t="s"><v>3</v></c>
                    <c r="B2" t="s"><v>4</v></c>
                    <c r="C2" t="s"><v>5</v></c>
                </row>
            </sheetData>
        </worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
        $zip->close();

        $uploadedFile = new UploadedFile(
            $tempPath,
            'assets.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $response = $this->actingAs($this->admin)->post('/infrastructure/import', [
            'file' => $uploadedFile,
        ]);

        $response->assertRedirect('/infrastructure');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('infrastructure_assets', [
            'name' => 'storage-s3-01',
            'asset_type' => AssetType::Storage->value,
            'environment' => AssetEnvironment::Production->value,
        ]);

        @unlink($tempPath);
    }
}
