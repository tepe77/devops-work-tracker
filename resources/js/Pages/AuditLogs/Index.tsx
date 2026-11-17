import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AuditLog, PageProps } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Shield,
    Filter,
    RotateCcw,
    Search,
    Eye,
    CheckCircle2,
    Clock,
    FileText,
    Activity,
    Layers,
    UserCheck,
    Database,
    FolderKanban,
    Copy,
    Check,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface AuditLogsIndexProps extends PageProps {
    logs: {
        data: AuditLog[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
    };
    availableEvents?: string[];
    filters: {
        event?: string;
        search?: string;
    };
}

function getEventBadge(event: string) {
    if (event.includes('deleted')) {
        return (
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-mono text-[11px] font-semibold">
                {event}
            </Badge>
        );
    }
    if (event.includes('created')) {
        return (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                {event}
            </Badge>
        );
    }
    if (event.includes('imported')) {
        return (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-mono text-[11px] font-semibold">
                {event}
            </Badge>
        );
    }
    if (event.includes('progress_changed')) {
        return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-mono text-[11px] font-semibold">
                {event}
            </Badge>
        );
    }
    if (event.includes('evidence')) {
        return (
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 font-mono text-[11px] font-semibold">
                {event}
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-mono text-[11px] font-semibold">
            {event}
        </Badge>
    );
}

function getEntityIcon(type: string) {
    const cleanType = type.split('\\').pop() || '';
    switch (cleanType) {
        case 'Task':
            return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
        case 'TaskUpdate':
            return <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
        case 'InfrastructureAsset':
            return <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
        case 'Project':
            return <FolderKanban className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
        case 'User':
            return <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
        default:
            return <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
}

export default function AuditLogsIndex({ auth, logs, availableEvents = [], filters }: AuditLogsIndexProps) {
    const [event, setEvent] = useState(filters.event || '');
    const [search, setSearch] = useState(filters.search || '');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [copied, setCopied] = useState(false);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('audit-logs.index'),
            { event: event || undefined, search: search || undefined },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setEvent('');
        setSearch('');
        router.get(route('audit-logs.index'), {}, { preserveState: true });
    };

    const copyJson = (data: any) => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Standard baseline events list merged with dynamic available events
    const baselineEvents = [
        'task_created',
        'task_updated',
        'task_deleted',
        'task_update_created',
        'task_progress_changed',
        'asset_created',
        'asset_updated',
        'asset_deleted',
        'asset_imported',
        'project_created',
        'project_updated',
        'category_created',
        'category_updated',
        'evidence_uploaded',
        'evidence_deleted',
        'user_created',
        'user_updated',
        'user_deleted',
    ];

    const allEvents = Array.from(new Set([...baselineEvents, ...availableEvents])).sort();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Audit Logs (Jejak Rekam Mutasi Data)
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Pencatatan append-only terhadap perubahan task, aset, proyek, evidence, dan pengguna
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Audit Logs - DevOps Work Tracker" />

            <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="shadow-xs">
                        <CardContent className="p-3.5">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Total Log Mutasi
                            </div>
                            <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                                {logs.total}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                Seluruh histori sistem
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardContent className="p-3.5">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Filter Event Aktif
                            </div>
                            <div className="text-sm font-bold text-foreground mt-1 truncate">
                                {filters.event ? filters.event : 'Semua Event'}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                {allEvents.length} tipe event terdaftar
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardContent className="p-3.5">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Log Halaman Ini
                            </div>
                            <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                                {logs.data.length}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                Halaman {logs.current_page} dari {logs.last_page || 1}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardContent className="p-3.5">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Integritas Data
                            </div>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Append-Only Aktif</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                Immutable audit trail
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Box */}
                <Card className="shadow-xs">
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari user, ID, entitas, atau kata kunci payload..."
                                        className="h-9 text-xs pl-8 bg-background"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <select
                                        value={event}
                                        onChange={(e) => setEvent(e.target.value)}
                                        className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus:ring-1 focus:ring-primary min-w-[170px]"
                                    >
                                        <option value="">Semua Tipe Event</option>
                                        <optgroup label="Task & Progres">
                                            <option value="task_created">task_created</option>
                                            <option value="task_updated">task_updated</option>
                                            <option value="task_deleted">task_deleted</option>
                                            <option value="task_update_created">task_update_created</option>
                                            <option value="task_progress_changed">task_progress_changed</option>
                                        </optgroup>
                                        <optgroup label="Aset Infrastruktur">
                                            <option value="asset_created">asset_created</option>
                                            <option value="asset_updated">asset_updated</option>
                                            <option value="asset_deleted">asset_deleted</option>
                                            <option value="asset_imported">asset_imported</option>
                                        </optgroup>
                                        <optgroup label="Proyek & Kategori">
                                            <option value="project_created">project_created</option>
                                            <option value="project_updated">project_updated</option>
                                            <option value="category_created">category_created</option>
                                            <option value="category_updated">category_updated</option>
                                        </optgroup>
                                        <optgroup label="Evidence & User">
                                            <option value="evidence_uploaded">evidence_uploaded</option>
                                            <option value="evidence_deleted">evidence_deleted</option>
                                            <option value="user_created">user_created</option>
                                            <option value="user_updated">user_updated</option>
                                            <option value="user_deleted">user_deleted</option>
                                        </optgroup>
                                    </select>

                                    <Button type="submit" size="sm" className="h-9 text-xs shrink-0">
                                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                                        Terapkan
                                    </Button>

                                    {(event || search) && (
                                        <Button
                                            type="button"
                                            onClick={handleReset}
                                            variant="outline"
                                            size="sm"
                                            className="h-9 text-xs space-x-1 shrink-0"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Reset</span>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground self-start lg:self-auto shrink-0">
                                Menampilkan {logs.from || 0} - {logs.to || 0} dari {logs.total} log
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Audit Logs Table */}
                <Card className="shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="min-w-[850px]">
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-44 font-semibold text-xs">Waktu Mutasi</TableHead>
                                        <TableHead className="w-48 font-semibold text-xs">Tipe Event</TableHead>
                                        <TableHead className="w-40 font-semibold text-xs">Aktor (Pengguna)</TableHead>
                                        <TableHead className="w-44 font-semibold text-xs">Target Entitas</TableHead>
                                        <TableHead className="font-semibold text-xs">Ringkasan Perubahan</TableHead>
                                        <TableHead className="w-24 text-right font-semibold text-xs">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length > 0 ? (
                                        logs.data.map((log) => {
                                            const entityName = log.auditable_type.split('\\').pop();
                                            return (
                                                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        <div className="font-mono text-[11px] text-foreground">
                                                            {formatDateTime(log.created_at)}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">WIB / UTC+7</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getEventBadge(log.event)}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="font-semibold text-foreground">
                                                            {log.user?.name || (
                                                                <span className="text-muted-foreground italic font-normal">
                                                                    System / Seeder
                                                                </span>
                                                            )}
                                                        </div>
                                                        {log.user?.email && (
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                                                                {log.user.email}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-1.5 font-mono text-xs text-muted-foreground">
                                                            {getEntityIcon(log.auditable_type)}
                                                            <span className="font-semibold text-foreground">
                                                                {entityName}
                                                            </span>
                                                            <span className="text-primary font-bold">#{log.auditable_id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-[11px] space-y-1">
                                                            {log.new_values && (
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase">
                                                                        Baru:
                                                                    </span>
                                                                    {Object.entries(log.new_values)
                                                                        .slice(0, 3)
                                                                        .map(([key, val]) => (
                                                                            <span
                                                                                key={key}
                                                                                className="inline-block bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground"
                                                                            >
                                                                                <strong className="text-foreground">{key}</strong>: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                            </span>
                                                                        ))}
                                                                    {Object.keys(log.new_values).length > 3 && (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            +{Object.keys(log.new_values).length - 3} lainnya
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {log.old_values && (
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <span className="text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase">
                                                                        Lama:
                                                                    </span>
                                                                    {Object.entries(log.old_values)
                                                                        .slice(0, 2)
                                                                        .map(([key, val]) => (
                                                                            <span
                                                                                key={key}
                                                                                className="inline-block bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground line-through"
                                                                            >
                                                                                <strong className="text-foreground">{key}</strong>: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                            </span>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedLog(log)}
                                                            className="h-7 px-2 text-[11px] space-x-1"
                                                        >
                                                            <Eye className="w-3 h-3 text-primary" />
                                                            <span>Detail</span>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Shield className="w-8 h-8 text-muted-foreground/40" />
                                                    <span className="font-medium text-foreground">Tidak ada audit log yang sesuai kriteria.</span>
                                                    <span className="text-[11px]">Coba reset filter atau kata kunci pencarian Anda.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {logs.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-muted-foreground">
                            Halaman {logs.current_page} dari {logs.last_page} ({logs.total} total mutasi)
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-1">
                            {logs.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                            : !link.url
                                            ? 'text-muted-foreground opacity-40 cursor-not-allowed pointer-events-none'
                                            : 'bg-card border border-border text-foreground hover:bg-muted'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Log Modal / Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-5 pb-3 border-b border-border bg-card">
                        <div className="flex items-center space-x-2">
                            {selectedLog && getEventBadge(selectedLog.event)}
                            <DialogTitle className="text-base font-bold text-foreground">
                                Detail Mutasi Audit Log #{selectedLog?.id}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Dicatat pada {selectedLog && formatDateTime(selectedLog.created_at)} WIB
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Metadata Header Box */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-muted/40 p-3 rounded-lg border border-border text-xs">
                                <div>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Aktor / Pengguna</span>
                                    <span className="font-bold text-foreground">{selectedLog.user?.name || 'System / Automated'}</span>
                                    {selectedLog.user?.email && (
                                        <span className="text-[10px] text-muted-foreground block truncate">{selectedLog.user.email}</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Tipe Entitas</span>
                                    <span className="font-mono text-foreground font-semibold">
                                        {selectedLog.auditable_type.split('\\').pop()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">ID Entitas</span>
                                    <span className="font-mono text-primary font-bold">#{selectedLog.auditable_id}</span>
                                </div>
                            </div>

                            {/* Tabs for Data Payload Inspection */}
                            <Tabs defaultValue="formatted" className="w-full">
                                <div className="flex items-center justify-between pb-2 border-b border-border">
                                    <TabsList className="h-8">
                                        <TabsTrigger value="formatted" className="text-xs">
                                            Daftar Perubahan
                                        </TabsTrigger>
                                        <TabsTrigger value="raw" className="text-xs">
                                            Raw JSON
                                        </TabsTrigger>
                                    </TabsList>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyJson({
                                            event: selectedLog.event,
                                            auditable_type: selectedLog.auditable_type,
                                            auditable_id: selectedLog.auditable_id,
                                            old_values: selectedLog.old_values,
                                            new_values: selectedLog.new_values,
                                            metadata: selectedLog.metadata,
                                            created_at: selectedLog.created_at,
                                        })}
                                        className="h-7 text-xs space-x-1"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                                    </Button>
                                </div>

                                <TabsContent value="formatted" className="space-y-4 pt-3">
                                    {/* New Values */}
                                    {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center space-x-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Nilai Baru (New Values)</span>
                                            </div>
                                            <div className="border border-border rounded-md overflow-hidden bg-background">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-muted/50 border-b border-border">
                                                        <tr>
                                                            <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground w-1/3">Kunci (Key)</th>
                                                            <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Nilai (Value)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border font-mono text-[11px]">
                                                        {Object.entries(selectedLog.new_values).map(([k, v]) => (
                                                            <tr key={k} className="hover:bg-muted/20">
                                                                <td className="px-3 py-1.5 font-bold text-foreground">{k}</td>
                                                                <td className="px-3 py-1.5 text-muted-foreground break-all">
                                                                    {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Old Values */}
                                    {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center space-x-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Nilai Sebelumnya (Old Values)</span>
                                            </div>
                                            <div className="border border-border rounded-md overflow-hidden bg-background">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-muted/50 border-b border-border">
                                                        <tr>
                                                            <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground w-1/3">Kunci (Key)</th>
                                                            <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Nilai Sebelumnya</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border font-mono text-[11px]">
                                                        {Object.entries(selectedLog.old_values).map(([k, v]) => (
                                                            <tr key={k} className="hover:bg-muted/20">
                                                                <td className="px-3 py-1.5 font-bold text-foreground">{k}</td>
                                                                <td className="px-3 py-1.5 text-muted-foreground break-all line-through">
                                                                    {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                                Metadata & Konteks Tambahan
                                            </div>
                                            <pre className="p-2.5 rounded-md bg-muted/50 text-[11px] font-mono border border-border overflow-x-auto text-muted-foreground">
                                                {JSON.stringify(selectedLog.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="raw" className="pt-3">
                                    <pre className="p-3 rounded-md bg-muted/60 text-[11px] font-mono border border-border overflow-x-auto max-h-72 text-muted-foreground">
                                        {JSON.stringify(selectedLog, null, 2)}
                                    </pre>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
