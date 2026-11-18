import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Evidence, PageProps, Task, TaskUpdate } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { DatePicker } from '@/Components/ui/date-picker';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Archive,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Edit3,
    FileText,
    Paperclip,
    Plus,
    Server,
    Shield,
    Trash2,
    UploadCloud,
    User,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface TasksShowProps extends PageProps {
    task: Task;
}

export default function TasksShow({ auth, task }: TasksShowProps) {
    const user = auth.user;
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<TaskUpdate | null>(null);
    const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
    const [archiveTaskOpen, setArchiveTaskOpen] = useState(false);
    const [deletingUpdate, setDeletingUpdate] = useState<TaskUpdate | null>(null);
    const [deletingEvidence, setDeletingEvidence] = useState<Evidence | null>(null);

    // Form for Daily Activity Update
    const today = new Date().toISOString().split('T')[0];
    const updateForm = useForm({
        activity_date: today,
        summary: '',
        work_done: '',
        result: '',
        blocker: '',
        next_action: '',
        progress_percent: task.progress_percent,
        status: task.status,
        evidence_file: null as File | null,
        evidence_caption: '',
    });

    // Form for Standalone Evidence Upload
    const evidenceForm = useForm({
        task_id: task.id,
        task_update_id: '',
        file: null as File | null,
        caption: '',
    });

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.post(route('tasks.updates.store', task.id), {
            onSuccess: () => {
                setUpdateDialogOpen(false);
                updateForm.reset();
            },
        });
    };

    const handleEvidenceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        evidenceForm.post(route('evidences.store'), {
            onSuccess: () => {
                setEvidenceDialogOpen(false);
                evidenceForm.reset();
            },
        });
    };

    const handleConfirmArchiveTask = () => {
        router.delete(route('tasks.destroy', task.id));
    };

    const handleConfirmDeleteUpdate = () => {
        if (deletingUpdate) {
            router.delete(route('tasks.updates.destroy', [task.id, deletingUpdate.id]));
        }
    };

    const handleConfirmDeleteEvidence = () => {
        if (deletingEvidence) {
            router.delete(route('evidences.destroy', deletingEvidence.id));
        }
    };

    const getStatusBadgeVariant = (st: string) => {
        switch (st) {
            case 'completed': return 'success';
            case 'in_progress': return 'info';
            case 'blocked': return 'destructive';
            case 'cancelled': return 'outline';
            default: return 'secondary';
        }
    };

    const getPriorityBadgeVariant = (pr: string) => {
        switch (pr) {
            case 'critical': return 'destructive';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'secondary';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Link href={route('tasks.index')}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-primary">{task.task_code}</span>
                            <Badge variant={getStatusBadgeVariant(task.status)} className="text-[10px]">
                                {task.status}
                            </Badge>
                        </div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">{task.title}</h2>
                    </div>
                </div>
            }
        >
            <Head title={`${task.task_code} - ${task.title}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column: Timeline & Evidences (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Timeline Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center space-x-2">
                                    <Activity className="w-4 h-4 text-primary" />
                                    <span>Histori Progres Harian (Activity Timeline)</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Histori tidak menimpa catatan lama. Setiap pembaruan tersimpan kronologis.
                                </CardDescription>
                            </div>

                            {user?.is_admin && (
                                <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="h-8 text-xs space-x-1.5 shadow-sm">
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Catat Aktivitas / Progres</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Catat Aktivitas / Progres Pekerjaan</DialogTitle>
                                            <DialogDescription className="text-xs">
                                                Catat aktivitas harian atau pekerjaan lampau (minggu kemarin). Data linimasa dan laporan (Daily/Weekly/Monthly) akan disesuaikan otomatis dengan tanggal aktivitas yang dipilih.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                                            {/* Date, Status & Progress */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Tanggal Aktivitas</Label>
                                                    <DatePicker
                                                        value={updateForm.data.activity_date}
                                                        onChange={(val) =>
                                                            updateForm.setData('activity_date', val)
                                                        }
                                                        size="sm"
                                                        placeholder="Pilih tanggal aktivitas"
                                                        required
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Bisa pilih tanggal lampau
                                                    </p>
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs">Status Baru</Label>
                                                    <select
                                                        value={updateForm.data.status}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.value as any;
                                                            updateForm.setData('status', newStatus);
                                                            if (newStatus === 'completed') {
                                                                updateForm.setData('progress_percent', 100);
                                                            } else if (newStatus === 'backlog') {
                                                                updateForm.setData('progress_percent', 0);
                                                            } else if (updateForm.data.progress_percent === 0 || updateForm.data.progress_percent === 100) {
                                                                updateForm.setData('progress_percent', 50);
                                                            }
                                                        }}
                                                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                                        required
                                                    >
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="blocked">Blocked</option>
                                                        <option value="completed">Completed (100%)</option>
                                                        <option value="backlog">Backlog (0%)</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Progress: {updateForm.data.progress_percent}%
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={updateForm.data.progress_percent}
                                                        onChange={(e) =>
                                                            updateForm.setData(
                                                                'progress_percent',
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="h-8 text-xs"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div className="space-y-1">
                                                <Label className="text-xs">Ringkasan Aktivitas (Summary) *</Label>
                                                <Input
                                                    placeholder="Contoh: Menjalankan failover test pada PostgreSQL replica"
                                                    value={updateForm.data.summary}
                                                    onChange={(e) => updateForm.setData('summary', e.target.value)}
                                                    className="h-8 text-xs"
                                                    required
                                                />
                                            </div>

                                            {/* Work Done */}
                                            <div className="space-y-1">
                                                <Label className="text-xs">Tindakan Teknis (Work Done) *</Label>
                                                <Textarea
                                                    placeholder="Tuliskan command yang dijalankan, konfigurasi file yang dimodifikasi, atau pengecekan service..."
                                                    rows={3}
                                                    value={updateForm.data.work_done}
                                                    onChange={(e) => updateForm.setData('work_done', e.target.value)}
                                                    className="text-xs"
                                                    required
                                                />
                                            </div>

                                            {/* Result & Blocker */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Hasil Pekerjaan (Result)</Label>
                                                    <Textarea
                                                        placeholder="Contoh: Lag replikasi kembali normal < 10ms"
                                                        rows={2}
                                                        value={updateForm.data.result}
                                                        onChange={(e) => updateForm.setData('result', e.target.value)}
                                                        className="text-xs"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs text-red-600 dark:text-red-400">
                                                        Kendala / Blocker (Jika ada)
                                                    </Label>
                                                    <Textarea
                                                        placeholder="Contoh: Menunggu approval firewall port 5432 dari tim network"
                                                        rows={2}
                                                        value={updateForm.data.blocker}
                                                        onChange={(e) => updateForm.setData('blocker', e.target.value)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* Next Action */}
                                            <div className="space-y-1">
                                                <Label className="text-xs">Rencana Tindak Lanjut (Next Action)</Label>
                                                <Input
                                                    placeholder="Langkah yang akan dikerjakan pada hari berikutnya..."
                                                    value={updateForm.data.next_action}
                                                    onChange={(e) => updateForm.setData('next_action', e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </div>

                                            {/* Optional Evidence Attachment */}
                                            <div className="space-y-2 pt-2 border-t border-border">
                                                <Label className="text-xs font-semibold">
                                                    Lampirkan Bukti Teknis (Evidence) - Opsional
                                                </Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Input
                                                        type="file"
                                                        onChange={(e) =>
                                                            updateForm.setData(
                                                                'evidence_file',
                                                                e.target.files ? e.target.files[0] : null
                                                            )
                                                        }
                                                        className="h-8 text-xs"
                                                    />
                                                    <Input
                                                        placeholder="Keterangan lampiran..."
                                                        value={updateForm.data.evidence_caption}
                                                        onChange={(e) =>
                                                            updateForm.setData('evidence_caption', e.target.value)
                                                        }
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Format: Gambar (PNG, JPG, WebP, GIF - otomatis dikompresi ke WebP) & Dokumen (PDF, TXT, LOG) maks 10 MB.
                                                </p>
                                            </div>

                                            <DialogFooter className="pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setUpdateDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" size="sm" disabled={updateForm.processing}>
                                                    Simpan Update Harian
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {task.updates && task.updates.length > 0 ? (
                                <div className="relative border-l border-border ml-3 space-y-6 pl-6 py-2">
                                    {task.updates.map((update, idx) => (
                                        <div key={update.id} className="relative group">
                                            {/* Node icon */}
                                            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>

                                            <div className="rounded-lg border border-border bg-card p-4 shadow-2xs space-y-3">
                                                {/* Header update */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="font-semibold text-xs text-foreground">
                                                            {formatDate(update.activity_date)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">&bull;</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Oleh {update.user?.name || 'DevOps'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={getStatusBadgeVariant(update.status)}
                                                            className="text-[10px]"
                                                        >
                                                            {update.status}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {update.progress_percent}%
                                                        </Badge>

                                                        {user?.is_admin && (
                                                            <div className="flex items-center space-x-1 pl-1.5 border-l border-border">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                                    title="Edit histori pengerjaan"
                                                                    onClick={() => setEditingUpdate(update)}
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                    <span className="sr-only">Edit Histori</span>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                                    title="Hapus catatan histori (Permanen)"
                                                                    onClick={() => setDeletingUpdate(update)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span className="sr-only">Hapus Histori</span>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Summary */}
                                                <div className="font-semibold text-xs text-foreground">
                                                    {update.summary}
                                                </div>

                                                {/* Work Done */}
                                                <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                                    {update.work_done}
                                                </div>

                                                {/* Result & Blocker highlight */}
                                                {(update.result || update.blocker) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                                                        {update.result && (
                                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                                                                <span className="font-semibold text-[11px] text-emerald-800 dark:text-emerald-300 block">
                                                                    Hasil:
                                                                </span>
                                                                <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                                                                    {update.result}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {update.blocker && (
                                                            <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900/30">
                                                                <span className="font-semibold text-[11px] text-red-800 dark:text-red-300 block">
                                                                    Kendala:
                                                                </span>
                                                                <span className="text-red-700 dark:text-red-400 text-[11px]">
                                                                    {update.blocker}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Next action */}
                                                {update.next_action && (
                                                    <div className="text-[11px] text-muted-foreground pt-1">
                                                        <span className="font-medium text-foreground">Rencana Selanjutnya: </span>
                                                        {update.next_action}
                                                    </div>
                                                )}

                                                {/* Attached Evidences */}
                                                {update.evidences && update.evidences.length > 0 && (
                                                    <div className="pt-2 flex flex-wrap gap-2">
                                                        {update.evidences.map((ev) => (
                                                            <div
                                                                key={ev.id}
                                                                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-muted text-xs hover:bg-muted/80 transition-colors"
                                                            >
                                                                <a
                                                                    href={route('evidences.download', ev.id)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center space-x-1 text-foreground hover:text-primary transition-colors"
                                                                >
                                                                    <Paperclip className="w-3 h-3 text-primary" />
                                                                    <span className="truncate max-w-[150px]">
                                                                        {ev.original_name}
                                                                    </span>
                                                                    <Download className="w-3 h-3 text-muted-foreground ml-1" />
                                                                </a>
                                                                {user?.is_admin && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeletingEvidence(ev)}
                                                                        className="text-muted-foreground hover:text-destructive ml-1 p-0.5"
                                                                        title="Hapus file lampiran (Permanen)"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-xs text-muted-foreground">
                                    Belum ada catatan daily activity update. Klik "Tambah Update Harian" untuk memulai.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Evidence Files List Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center space-x-2">
                                    <Paperclip className="w-4 h-4 text-primary" />
                                    <span>Bukti Teknis & Dokumen (Evidences)</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    File disimpan di private storage. Hanya pengguna terotentikasi yang dapat mengunduh.
                                </CardDescription>
                            </div>

                            {user?.is_admin && (
                                <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 text-xs space-x-1.5">
                                            <UploadCloud className="w-3.5 h-3.5" />
                                            <span>Unggah File</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Unggah Evidence Teknis</DialogTitle>
                                            <DialogDescription className="text-xs">
                                                Unggah log, screenshot konfigurasi, diagram, atau laporan PDF
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={handleEvidenceSubmit} className="space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Pilih File *</Label>
                                                <Input
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.log,.md,.csv"
                                                    onChange={(e) =>
                                                        evidenceForm.setData(
                                                            'file',
                                                            e.target.files ? e.target.files[0] : null
                                                        )
                                                    }
                                                    className="text-xs"
                                                    required
                                                />
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Gambar (PNG, JPG, WebP, GIF) otomatis dioptimasi & dikonversi ke WebP. Dokumen (PDF, TXT, LOG) disimpan sesuai format asli (Maks 10 MB).
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Keterangan / Caption</Label>
                                                <Input
                                                    placeholder="Contoh: Log output memory leak investigasi"
                                                    value={evidenceForm.data.caption}
                                                    onChange={(e) => evidenceForm.setData('caption', e.target.value)}
                                                    className="text-xs"
                                                />
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEvidenceDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" size="sm" disabled={evidenceForm.processing}>
                                                    Unggah Sekarang
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            {task.evidences && task.evidences.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {task.evidences.map((ev) => (
                                        <div
                                            key={ev.id}
                                            className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-semibold text-foreground truncate">
                                                        {ev.original_name}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground flex items-center space-x-2">
                                                        <span>{Math.round(ev.file_size / 1024)} KB</span>
                                                        <span>&bull;</span>
                                                        <span>{ev.mime_type}</span>
                                                        {ev.created_at && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span>{formatDateTime(ev.created_at)}</span>
                                                            </>
                                                        )}
                                                        {ev.caption && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span className="italic">{ev.caption}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <a
                                                    href={route('evidences.download', ev.id)}
                                                    className="inline-flex items-center space-x-1"
                                                >
                                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Unduh
                                                    </Button>
                                                </a>
                                                {user?.is_admin && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-destructive hover:bg-destructive/10"
                                                        title="Hapus file lampiran (Permanen)"
                                                        onClick={() => setDeletingEvidence(ev)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    Belum ada evidence terlampir untuk task ini.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column: Metadata & Infrastructure Assets (1 col) */}
                <div className="space-y-6">
                    {/* Metadata Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Informasi Pekerjaan</CardTitle>
                            {user?.is_admin && (
                                <div className="flex items-center space-x-1">
                                    <Link href={route('tasks.edit', task.id)}>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                        title="Arsipkan Pekerjaan (Soft Delete)"
                                        onClick={() => setArchiveTaskOpen(true)}
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3.5 text-xs">
                            {/* Status & Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-muted-foreground">Status / Progress</span>
                                    <span className="font-semibold">{task.progress_percent}%</span>
                                </div>
                                <Progress value={task.progress_percent} className="h-2 mb-1.5" />
                                <Badge variant={getStatusBadgeVariant(task.status)} className="text-[10px]">
                                    {task.status}
                                </Badge>
                            </div>

                            {/* Category */}
                            <div className="flex justify-between border-t border-border pt-2.5">
                                <span className="text-muted-foreground">Kategori:</span>
                                <span className="font-medium text-foreground">{task.category?.name || '-'}</span>
                            </div>

                            {/* Priority */}
                            <div className="flex justify-between border-t border-border pt-2.5">
                                <span className="text-muted-foreground">Prioritas:</span>
                                <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-[10px]">
                                    {task.priority}
                                </Badge>
                            </div>

                            {/* Dates */}
                            <div className="flex justify-between border-t border-border pt-2.5">
                                <span className="text-muted-foreground">Tanggal Mulai:</span>
                                <span className="font-medium text-foreground">{formatDate(task.start_date)}</span>
                            </div>

                            <div className="flex justify-between border-t border-border pt-2.5">
                                <span className="text-muted-foreground">Target Selesai:</span>
                                <span className="font-medium text-foreground">{task.due_date ? formatDate(task.due_date) : '-'}</span>
                            </div>

                            {task.completed_at && (
                                <div className="flex justify-between border-t border-border pt-2.5">
                                    <span className="text-muted-foreground">Selesai Pada:</span>
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                        {formatDateTime(task.completed_at)}
                                    </span>
                                </div>
                            )}

                            {/* Project */}
                            {task.project && (
                                <div className="flex justify-between border-t border-border pt-2.5">
                                    <span className="text-muted-foreground">Project:</span>
                                    <span className="font-medium">{task.project.name}</span>
                                </div>
                            )}

                            {/* Creator */}
                            <div className="flex justify-between border-t border-border pt-2.5">
                                <span className="text-muted-foreground">Dibuat Oleh:</span>
                                <span className="font-medium">{task.creator?.name || 'Admin'}</span>
                            </div>

                            {/* Description block */}
                            <div className="border-t border-border pt-2.5 space-y-1">
                                <span className="text-muted-foreground font-medium">Deskripsi:</span>
                                <p className="text-foreground leading-relaxed whitespace-pre-line bg-muted/30 p-2.5 rounded-md">
                                    {task.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Infrastructure Assets Attached Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                                <Server className="w-4 h-4 text-primary" />
                                <span>Aset Infrastruktur Terkait</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Mesin / Database / Platform yang terhubung ke task ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {task.assets && task.assets.length > 0 ? (
                                <div className="space-y-2">
                                    {task.assets.map((asset) => (
                                        <Link
                                            key={asset.id}
                                            href={route('infrastructure.show', asset.id)}
                                            className="block p-2.5 rounded border border-border hover:bg-muted/50 transition-colors text-xs"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-foreground">{asset.name}</span>
                                                <Badge
                                                    variant={
                                                        asset.environment === 'production'
                                                            ? 'destructive'
                                                            : asset.environment === 'staging'
                                                            ? 'warning'
                                                            : 'info'
                                                    }
                                                    className="text-[9px]"
                                                >
                                                    {asset.environment}
                                                </Badge>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                {asset.ip_address || asset.hostname || asset.asset_type}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    Tidak ada aset infrastruktur yang ditautkan ke task ini.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {editingUpdate && (
                <EditTaskUpdateDialog
                    open={!!editingUpdate}
                    update={editingUpdate}
                    task={task}
                    onClose={() => setEditingUpdate(null)}
                />
            )}

            {/* Archive Task Confirmation Dialog (Soft Delete) */}
            <ConfirmDialog
                open={archiveTaskOpen}
                onClose={() => setArchiveTaskOpen(false)}
                onConfirm={handleConfirmArchiveTask}
                title={`Arsipkan Pekerjaan: ${task.task_code}?`}
                variant="archive"
                badgeText="Arsipkan (Soft Delete)"
                description={
                    <span>
                        Pekerjaan <strong>{task.task_code} - {task.title}</strong> akan <strong>diarsipkan</strong> dan disembunyikan dari daftar pekerjaan aktif. Seluruh catatan linimasa histori pengerjaan, aset terkait, dan berkas lampiran <strong>tetap tersimpan secara aman</strong> di database untuk kebutuhan audit dan laporan.
                    </span>
                }
                confirmText="Ya, Arsipkan Pekerjaan"
            />

            {/* Delete Activity Update Confirmation Dialog (Hard Delete) */}
            <ConfirmDialog
                open={!!deletingUpdate}
                onClose={() => setDeletingUpdate(null)}
                onConfirm={handleConfirmDeleteUpdate}
                title="Hapus Catatan Histori Pengerjaan?"
                variant="destructive"
                badgeText="Hapus Permanen"
                description={
                    <span>
                        Catatan aktivitas tanggal <strong>{deletingUpdate ? formatDate(deletingUpdate.activity_date) : ''}</strong> akan <strong>dihapus secara permanen</strong> dari sistem beserta lampirannya. Status dan persentase progres pekerjaan akan disinkronkan ulang secara otomatis berdasarkan catatan kronologis sebelumnya.
                    </span>
                }
                confirmText="Ya, Hapus Permanen"
            />

            {/* Delete Evidence File Confirmation Dialog (Hard Delete) */}
            <ConfirmDialog
                open={!!deletingEvidence}
                onClose={() => setDeletingEvidence(null)}
                onConfirm={handleConfirmDeleteEvidence}
                title={`Hapus File Bukti Teknis: ${deletingEvidence?.original_name}?`}
                variant="destructive"
                badgeText="Hapus Permanen"
                description={
                    <span>
                        File berkas <strong>{deletingEvidence?.original_name}</strong> akan <strong>dihapus secara permanen</strong> dari media penyimpanan server private. Tindakan ini tidak dapat dibatalkan.
                    </span>
                }
                confirmText="Ya, Hapus File Permanen"
            />
        </AuthenticatedLayout>
    );
}

function EditTaskUpdateDialog({
    task,
    update,
    open,
    onClose,
}: {
    task: Task;
    update: TaskUpdate;
    open: boolean;
    onClose: () => void;
}) {
    const formattedDate = update.activity_date
        ? typeof update.activity_date === 'string' && update.activity_date.includes('T')
            ? update.activity_date.split('T')[0]
            : String(update.activity_date)
        : '';

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        activity_date: formattedDate,
        summary: update.summary || '',
        work_done: update.work_done || '',
        result: update.result || '',
        blocker: update.blocker || '',
        next_action: update.next_action || '',
        progress_percent: update.progress_percent,
        status: update.status,
        evidence_file: null as File | null,
        evidence_caption: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tasks.updates.update', [task.id, update.id]), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Histori / Catatan Pekerjaan</DialogTitle>
                    <DialogDescription className="text-xs">
                        Ubah tanggal pengerjaan, ringkasan, tindakan teknis, atau penyesuaian progres. Linimasa dan laporan akan disinkronkan ulang secara otomatis.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date, Status & Progress */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Tanggal Aktivitas</Label>
                            <DatePicker
                                value={data.activity_date}
                                onChange={(val) => setData('activity_date', val)}
                                size="sm"
                                placeholder="Pilih tanggal aktivitas"
                                required
                            />
                            {errors.activity_date && (
                                <p className="text-[10px] text-destructive">{errors.activity_date}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Status</Label>
                            <select
                                value={data.status}
                                onChange={(e) => {
                                    const newStatus = e.target.value as any;
                                    setData('status', newStatus);
                                    if (newStatus === 'completed') {
                                        setData('progress_percent', 100);
                                    } else if (newStatus === 'backlog') {
                                        setData('progress_percent', 0);
                                    } else if (data.progress_percent === 0 || data.progress_percent === 100) {
                                        setData('progress_percent', 50);
                                    }
                                }}
                                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                required
                            >
                                <option value="in_progress">In Progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="completed">Completed (100%)</option>
                                <option value="backlog">Backlog (0%)</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {errors.status && (
                                <p className="text-[10px] text-destructive">{errors.status}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">
                                Progress: {data.progress_percent}%
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={data.progress_percent}
                                onChange={(e) =>
                                    setData(
                                        'progress_percent',
                                        parseInt(e.target.value) || 0
                                    )
                                }
                                className="h-8 text-xs"
                                required
                            />
                            {errors.progress_percent && (
                                <p className="text-[10px] text-destructive">{errors.progress_percent}</p>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1">
                        <Label className="text-xs">Ringkasan Aktivitas (Summary) *</Label>
                        <Input
                            placeholder="Contoh: Menjalankan failover test pada PostgreSQL replica"
                            value={data.summary}
                            onChange={(e) => setData('summary', e.target.value)}
                            className="h-8 text-xs"
                            required
                        />
                        {errors.summary && (
                            <p className="text-[10px] text-destructive">{errors.summary}</p>
                        )}
                    </div>

                    {/* Work Done */}
                    <div className="space-y-1">
                        <Label className="text-xs">Tindakan Teknis (Work Done) *</Label>
                        <Textarea
                            placeholder="Tuliskan command yang dijalankan, konfigurasi file yang dimodifikasi, atau pengecekan service..."
                            rows={3}
                            value={data.work_done}
                            onChange={(e) => setData('work_done', e.target.value)}
                            className="text-xs"
                            required
                        />
                        {errors.work_done && (
                            <p className="text-[10px] text-destructive">{errors.work_done}</p>
                        )}
                    </div>

                    {/* Result & Blocker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Hasil Pekerjaan (Result)</Label>
                            <Textarea
                                placeholder="Contoh: Lag replikasi kembali normal < 10ms"
                                rows={2}
                                value={data.result}
                                onChange={(e) => setData('result', e.target.value)}
                                className="text-xs"
                            />
                            {errors.result && (
                                <p className="text-[10px] text-destructive">{errors.result}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-red-600 dark:text-red-400">
                                Kendala / Blocker (Jika ada)
                            </Label>
                            <Textarea
                                placeholder="Contoh: Menunggu approval firewall port 5432 dari tim network"
                                rows={2}
                                value={data.blocker}
                                onChange={(e) => setData('blocker', e.target.value)}
                                className="text-xs"
                            />
                            {errors.blocker && (
                                <p className="text-[10px] text-destructive">{errors.blocker}</p>
                            )}
                        </div>
                    </div>

                    {/* Next Action */}
                    <div className="space-y-1">
                        <Label className="text-xs">Rencana Tindak Lanjut (Next Action)</Label>
                        <Input
                            placeholder="Langkah yang akan dikerjakan pada hari berikutnya..."
                            value={data.next_action}
                            onChange={(e) => setData('next_action', e.target.value)}
                            className="h-8 text-xs"
                        />
                        {errors.next_action && (
                            <p className="text-[10px] text-destructive">{errors.next_action}</p>
                        )}
                    </div>

                    {/* Optional Evidence Attachment */}
                    <div className="space-y-2 pt-2 border-t border-border">
                        <Label className="text-xs font-semibold">
                            Tambah Lampiran Bukti Teknis (Opsional)
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                                type="file"
                                onChange={(e) =>
                                    setData(
                                        'evidence_file',
                                        e.target.files ? e.target.files[0] : null
                                    )
                                }
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Keterangan lampiran..."
                                value={data.evidence_caption}
                                onChange={(e) =>
                                    setData('evidence_caption', e.target.value)
                                }
                                className="h-8 text-xs"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Format: Gambar (PNG, JPG, WebP, GIF - otomatis dikompresi) & Dokumen (PDF, TXT, LOG) maks 10 MB.
                        </p>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
