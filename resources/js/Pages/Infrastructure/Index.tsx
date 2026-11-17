import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { InfrastructureAsset, PageProps } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatDateTime, formatDate } from '@/lib/utils';
import {
    PlusCircle,
    Search,
    Filter,
    RotateCcw,
    Server,
    ExternalLink,
    HardDrive,
    Network,
    Cpu,
    Boxes,
    UploadCloud,
    Download,
    FileSpreadsheet,
    FileText,
    Info,
} from 'lucide-react';

interface InfrastructureIndexProps extends PageProps {
    assets: {
        data: InfrastructureAsset[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        environment?: string;
        asset_type?: string;
        status?: string;
    };
}

export default function InfrastructureIndex({ auth, assets, filters }: InfrastructureIndexProps) {
    const user = auth.user;
    const [search, setSearch] = useState(filters.search || '');
    const [environment, setEnvironment] = useState(filters.environment || '');
    const [assetType, setAssetType] = useState(filters.asset_type || '');
    const [status, setStatus] = useState(filters.status || '');
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    // Form for importing spreadsheet/CSV
    const importForm = useForm({
        file: null as File | null,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('infrastructure.index'),
            { search, environment, asset_type: assetType, status },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setEnvironment('');
        setAssetType('');
        setStatus('');
        router.get(route('infrastructure.index'), {}, { preserveState: true });
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importForm.data.file) return;

        importForm.post(route('infrastructure.import'), {
            onSuccess: () => {
                setImportDialogOpen(false);
                importForm.reset();
            },
        });
    };

    const getEnvBadgeVariant = (env: string) => {
        switch (env) {
            case 'production': return 'destructive';
            case 'staging': return 'warning';
            case 'development': return 'info';
            case 'disaster_recovery': return 'purple';
            default: return 'secondary';
        }
    };

    const getStatusBadgeVariant = (st: string) => {
        switch (st) {
            case 'active': return 'success';
            case 'maintenance': return 'warning';
            default: return 'outline';
        }
    };

    const getAssetIcon = (type: string) => {
        switch (type) {
            case 'database': return <HardDrive className="w-4 h-4 text-blue-500" />;
            case 'network': return <Network className="w-4 h-4 text-amber-500" />;
            case 'container_host': return <Cpu className="w-4 h-4 text-purple-500" />;
            default: return <Server className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2 text-xs">
                    <span className="text-muted-foreground">DevOps</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold text-foreground">Infrastruktur Assets</span>
                </div>
            }
        >
            <Head title="Infrastruktur Assets - DevOps Work Tracker" />

            {/* Page Header Section with Dedicated Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
                        <Boxes className="w-6 h-6 text-primary" />
                        <span>Inventaris Aset Infrastruktur</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Katalog VM, server fisik, cluster database, container host, dan network resources
                    </p>
                </div>

                {user?.is_admin && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => setImportDialogOpen(true)}
                            className="w-full sm:w-auto space-x-2 shadow-xs bg-card"
                        >
                            <UploadCloud className="w-4 h-4 text-primary" />
                            <span>Import CSV / Spreadsheet</span>
                        </Button>

                        <Link href={route('infrastructure.create')} className="w-full sm:w-auto">
                            <Button size="default" className="w-full sm:w-auto space-x-2 shadow-sm font-semibold">
                                <PlusCircle className="w-4 h-4" />
                                <span>Tambah Aset Baru</span>
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Filter Card */}
            <Card className="shadow-sm border-border/80">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama, hostname, IP..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>

                            <select
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Semua Environment</option>
                                <option value="production">Production</option>
                                <option value="staging">Staging</option>
                                <option value="development">Development</option>
                                <option value="disaster_recovery">Disaster Recovery (DR)</option>
                                <option value="other">Other</option>
                            </select>

                            <select
                                value={assetType}
                                onChange={(e) => setAssetType(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Semua Tipe Aset</option>
                                <option value="virtual_machine">Virtual Machine</option>
                                <option value="physical_server">Physical Server</option>
                                <option value="database">Database</option>
                                <option value="container_host">Container Host / K8s</option>
                                <option value="application_service">Application Service</option>
                                <option value="network">Network / Firewall</option>
                                <option value="storage">Storage / S3 / NAS</option>
                                <option value="other">Lainnya</option>
                            </select>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Semua Status</option>
                                <option value="active">Active (Aktif)</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="retired">Retired (Dinonaktifkan)</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">
                                Ditemukan <strong>{assets.total}</strong> aset infrastruktur
                            </span>
                            <div className="flex items-center space-x-2">
                                <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                                    <Filter className="w-3.5 h-3.5 mr-1" />
                                    Filter
                                </Button>
                                {(search || environment || assetType || status) && (
                                    <Button
                                        type="button"
                                        onClick={handleReset}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs space-x-1"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Assets Table */}
            <Card className="shadow-sm border-border/80">
                <CardContent className="p-0">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-56">Nama Aset / Mesin</TableHead>
                                <TableHead className="w-32">Environment</TableHead>
                                <TableHead className="w-40">Tipe</TableHead>
                                <TableHead className="w-44">IP / Hostname</TableHead>
                                <TableHead>Sistem Operasi</TableHead>
                                <TableHead className="w-28">Status</TableHead>
                                <TableHead className="w-24 text-center">Terkait Task</TableHead>
                                <TableHead className="w-16 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.data.length > 0 ? (
                                assets.data.map((asset) => (
                                    <TableRow key={asset.id} className="hover:bg-muted/40 transition-colors">
                                        <TableCell>
                                            <Link
                                                href={route('infrastructure.show', asset.id)}
                                                className="font-semibold text-xs text-foreground hover:text-primary flex items-center space-x-2"
                                            >
                                                {getAssetIcon(asset.asset_type)}
                                                <span>{asset.name}</span>
                                            </Link>
                                            {asset.purpose && (
                                                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                    {asset.purpose}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getEnvBadgeVariant(asset.environment)} className="text-[10px]">
                                                {asset.environment}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground capitalize">
                                            {asset.asset_type.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {asset.ip_address || asset.hostname || '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {asset.operating_system || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(asset.status)} className="text-[10px]">
                                                {asset.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-xs">
                                            {asset.tasks_count || 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('infrastructure.show', asset.id)}>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                                        Tidak ada aset infrastruktur yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Links if more than 1 page */}
            {assets.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <div>
                        Menampilkan halaman <strong>{assets.current_page}</strong> dari <strong>{assets.last_page}</strong>
                    </div>
                    <div className="flex items-center space-x-1">
                        {assets.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveState
                                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground font-semibold'
                                        : link.url
                                        ? 'hover:bg-muted text-foreground'
                                        : 'text-muted-foreground opacity-50 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Dialog Import CSV / Spreadsheet */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2 text-base font-bold">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            <span>Import Aset dari Spreadsheet (CSV / Excel)</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Unggah berkas spreadsheet yang berisi daftar aset infrastruktur Anda. Data akan otomatis dipetakan dan di-upsert (dibuat atau diperbarui jika nama sudah ada).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
                        {/* File Selector */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Pilih Berkas Spreadsheet (.csv, .xlsx, .xls) *</Label>
                            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                                <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <input
                                    type="file"
                                    id="import_file"
                                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            importForm.setData('file', e.target.files[0]);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="import_file"
                                    className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-2xs"
                                >
                                    <span>Pilih File dari Komputer</span>
                                </label>
                                <p className="text-[11px] text-muted-foreground mt-2">
                                    {importForm.data.file ? (
                                        <span className="font-semibold text-primary">
                                            {importForm.data.file.name} ({(importForm.data.file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    ) : (
                                        'Mendukung format CSV, Excel (.xlsx, .xls) hingga 10 MB'
                                    )}
                                </p>
                            </div>
                            {importForm.errors.file && (
                                <p className="text-xs text-destructive font-medium">{importForm.errors.file}</p>
                            )}
                        </div>

                        {/* Template Download & Guide Callout */}
                        <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 p-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-blue-950 dark:text-blue-200 flex items-center space-x-1.5">
                                    <Info className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Gunakan Template Contoh</span>
                                </span>
                                <a
                                    href={route('infrastructure.template')}
                                    className="inline-flex items-center space-x-1 text-primary hover:underline font-semibold"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh Template CSV</span>
                                </a>
                            </div>
                            <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                                Format kolom yang dikenali: <strong>name</strong> (wajib), <strong>asset_type</strong>, <strong>environment</strong>, <strong>ip_address</strong>, <strong>hostname</strong>, <strong>operating_system</strong>, <strong>purpose</strong>, <strong>status</strong>, <strong>description</strong>. Header juga otomatis mengenali istilah Indonesia (misal: <em>nama</em>, <em>tipe</em>, <em>lingkungan</em>, <em>ip</em>, <em>status</em>).
                            </p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setImportDialogOpen(false);
                                    importForm.reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={importForm.processing || !importForm.data.file}
                                className="space-x-1.5 shadow-sm"
                            >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>{importForm.processing ? 'Sedang Mengimpor...' : 'Mulai Import Aset'}</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
