import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Task, TaskUpdate } from '@/types';
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
    const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

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

    const handleDeleteTask = () => {
        if (confirm(`Apakah Anda yakin ingin mengarsipkan task ${task.task_code}?`)) {
            router.delete(route('tasks.destroy', task.id));
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
                                            <span>Tambah Update Harian</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Catat Daily Activity Update</DialogTitle>
                                            <DialogDescription className="text-xs">
                                                Update akan dicatat ke linimasa dan status task {task.task_code} akan
                                                diperbarui secara otomatis.
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
                                                            <a
                                                                key={ev.id}
                                                                href={route('evidences.download', ev.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-muted text-xs hover:bg-muted/80 transition-colors"
                                                            >
                                                                <Paperclip className="w-3 h-3 text-primary" />
                                                                <span className="truncate max-w-[150px]">
                                                                    {ev.original_name}
                                                                </span>
                                                                <Download className="w-3 h-3 text-muted-foreground ml-1" />
                                                            </a>
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
                                                        onClick={() => {
                                                            if (confirm('Hapus file evidence ini?')) {
                                                                router.delete(route('evidences.destroy', ev.id));
                                                            }
                                                        }}
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
                                        className="h-7 w-7 p-0 text-destructive"
                                        onClick={handleDeleteTask}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
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
        </AuthenticatedLayout>
    );
}
