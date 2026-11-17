import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, Task } from '@/types';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    Filter,
    HardDrive,
    Layers,
    LogIn,
    Radio,
    RotateCcw,
    Search,
    Server,
    Shield,
    Sparkles,
    UserCircle,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface ExecutiveBoardProps extends PageProps {
    metrics: {
        summary: {
            total_tasks: number;
            completed: number;
            in_progress: number;
            blocked: number;
            backlog: number;
            cancelled: number;
            overdue: number;
            active_assets: number;
            maintenance_assets: number;
        };
        categories: Array<{ id: number; name: string; tasks_count: number }>;
    };
    inProgressTasks: Task[];
    blockedTasks: Task[];
    recentlyCompleted: Task[];
    tasks: {
        data: Task[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    categories: Array<{ id: number; name: string }>;
    filters: {
        status: string;
        category_id: string;
        search: string;
    };
    currentTime: string;
}

export default function ExecutiveBoard({
    auth,
    metrics,
    inProgressTasks,
    blockedTasks,
    recentlyCompleted,
    tasks,
    categories,
    filters,
    currentTime,
}: ExecutiveBoardProps) {
    const summary = metrics.summary;
    const user = auth.user;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const completionRate = summary.total_tasks > 0
        ? Math.round((summary.completed / summary.total_tasks) * 100)
        : 0;

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('executive.board'),
            { search, category_id: selectedCategory, status: selectedStatus },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedStatus('');
        router.get(route('executive.board'), {}, { preserveState: true });
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'critical':
                return <Badge variant="destructive" className="text-[10px]">Critical</Badge>;
            case 'high':
                return <Badge variant="warning" className="text-[10px]">High</Badge>;
            case 'medium':
                return <Badge variant="info" className="text-[10px]">Medium</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case 'completed':
                return <Badge variant="success" className="text-[10px]">Completed</Badge>;
            case 'in_progress':
                return <Badge variant="info" className="text-[10px]">In Progress</Badge>;
            case 'blocked':
                return <Badge variant="destructive" className="text-[10px]">Blocked</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col">
            <Head title="Executive Work Board - DevOps Monitor" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
                <div className="max-w-[1700px] mx-auto px-3.5 sm:px-8 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 flex items-center justify-center p-1 border border-blue-500/20 shadow-xs shrink-0">
                            <ApplicationLogo className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground truncate block">
                                    DevOps Executive Board
                                </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground block -mt-0.5 truncate max-w-[160px] sm:max-w-none">
                                Monitoring Status & Progres &bull; {currentTime}
                            </span>
                        </div>
                    </div>

                    {/* Actions / User Status */}
                    <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        {user ? (
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs font-semibold text-foreground">{user.name}</div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                                        {user.role}
                                    </span>
                                </div>
                                <Link href={route('dashboard')}>
                                    <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 sm:px-3 space-x-1.5 bg-background shadow-xs">
                                        <Layers className="w-3.5 h-3.5 text-primary" />
                                        <span className="hidden sm:inline">Dashboard Internal</span>
                                        <span className="sm:hidden">Internal</span>
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Link href={route('login')}>
                                <Button size="sm" className="text-xs h-8 px-2.5 sm:px-3 space-x-1.5 shadow-sm">
                                    <LogIn className="w-3.5 h-3.5" />
                                    <span><span className="hidden sm:inline">Login Tim </span>DevOps</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-[1700px] w-full mx-auto px-3.5 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Notice banner for atasan */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                            <Eye className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm text-blue-950 dark:text-blue-200">
                                Selamat Datang di DevOps Executive Board
                            </div>
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                Halaman ini dirancang khusus agar Anda dapat memantau apa yang sedang dikerjakan, progres pengerjaan, serta kendala teknis secara langsung.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-medium">Auto-Sync Data</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs space-x-1 bg-white dark:bg-slate-900"
                            onClick={() => router.reload()}
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Segarkan</span>
                        </Button>
                    </div>
                </div>

                {/* Overdue Warning Alert if any */}
                {summary.overdue > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/30 p-4 shadow-2xs flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-xs">
                            <span className="font-semibold text-red-900 dark:text-red-200 block">
                                Peringatan Deadline: {summary.overdue} Pekerjaan Melewati Batas Waktu
                            </span>
                            <span className="text-red-700 dark:text-red-300">
                                Tim DevOps membutuhkan koordinasi atau penyesuaian timeline untuk task terkait.
                            </span>
                        </div>
                    </div>
                )}

                {/* Executive KPI Metric Cards (5 Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* 1. In Progress */}
                    <Card className="relative overflow-hidden border border-border/80 shadow-xs bg-linear-to-br from-card via-card to-sky-50/40 dark:to-sky-950/20">
                        <CardHeader className="p-4 pb-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">Sedang Berjalan</span>
                                <div className="p-2 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                                    <Activity className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                                <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">
                                    {summary.in_progress}
                                </span>
                                <Badge variant="info" className="text-[10px]">Aktif</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-[11px] text-muted-foreground">Pekerjaan teknis yang sedang ditangani</div>
                        </CardContent>
                    </Card>

                    {/* 2. Blocked */}
                    <Card className={`relative overflow-hidden border shadow-xs bg-linear-to-br from-card via-card ${
                        summary.blocked > 0
                            ? 'border-red-300 dark:border-red-900/60 to-red-50/50 dark:to-red-950/30'
                            : 'border-border/80 to-slate-50/30 dark:to-slate-900/20'
                    }`}>
                        <CardHeader className="p-4 pb-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">Kendala (Blocked)</span>
                                <div className={`p-2 rounded-xl ${
                                    summary.blocked > 0
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                                <span className={`text-3xl font-extrabold ${
                                    summary.blocked > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                                }`}>
                                    {summary.blocked}
                                </span>
                                <Badge variant={summary.blocked > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                                    {summary.blocked > 0 ? 'Perlu Solusi' : 'Nol Kendala'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-[11px] text-muted-foreground">
                                {summary.blocked > 0 ? 'Menunggu approval / vendor' : 'Semua berjalan lancar'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Completed */}
                    <Card className="relative overflow-hidden border border-border/80 shadow-xs bg-linear-to-br from-card via-card to-emerald-50/40 dark:to-emerald-950/20">
                        <CardHeader className="p-4 pb-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">Selesai (Completed)</span>
                                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {summary.completed}
                                </span>
                                <Badge variant="success" className="text-[10px]">
                                    {completionRate}% Rasio
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-[11px] text-muted-foreground">{summary.completed} dari {summary.total_tasks} task tuntas</div>
                        </CardContent>
                    </Card>

                    {/* 4. Backlog */}
                    <Card className="relative overflow-hidden border border-border/80 shadow-xs bg-linear-to-br from-card via-card to-slate-100/50 dark:to-slate-900/30">
                        <CardHeader className="p-4 pb-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">Antrian (Backlog)</span>
                                <div className="p-2 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                                <span className="text-3xl font-extrabold text-slate-700 dark:text-slate-300">
                                    {summary.backlog}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">Belum Mulai</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-[11px] text-muted-foreground">Rencana prioritas berikutnya</div>
                        </CardContent>
                    </Card>

                    {/* 5. Infra Assets */}
                    <Card className="relative overflow-hidden border border-border/80 shadow-xs bg-linear-to-br from-card via-card to-purple-50/40 dark:to-purple-950/20 col-span-2 sm:col-span-1">
                        <CardHeader className="p-4 pb-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">Mesin & Server</span>
                                <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                                    <Server className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                                <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                                    {summary.active_assets}
                                </span>
                                <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-[11px] text-muted-foreground">Server, VM & DB terpelihara</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section for Clear Executive Focus */}
                <Tabs defaultValue="in_progress" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                        <div className="overflow-x-auto pb-1 max-w-full -mx-1 px-1">
                            <TabsList className="bg-muted/80 p-1 w-max">
                                <TabsTrigger value="in_progress" className="space-x-1.5 text-xs">
                                    <Activity className="w-3.5 h-3.5 text-sky-600" />
                                    <span>Sedang Dikerjakan ({inProgressTasks.length})</span>
                                </TabsTrigger>
                                <TabsTrigger value="blocked" className="space-x-1.5 text-xs">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                    <span>Kendala / Blocker ({blockedTasks.length})</span>
                                </TabsTrigger>
                                <TabsTrigger value="completed" className="space-x-1.5 text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Baru Selesai ({recentlyCompleted.length})</span>
                                </TabsTrigger>
                                <TabsTrigger value="all_tasks" className="space-x-1.5 text-xs">
                                    <Layers className="w-3.5 h-3.5 text-primary" />
                                    <span>Semua Task ({tasks.total})</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center space-x-1">
                            <span>Klik pada pekerjaan untuk melihat rincian histori harian</span>
                        </div>
                    </div>

                    {/* Tab 1: Sedang Dikerjakan (In Progress) */}
                    <TabsContent value="in_progress" className="space-y-4">
                        {inProgressTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {inProgressTasks.map((t) => {
                                    const latestUpdate = t.updates?.[0];
                                    return (
                                        <Card
                                            key={t.id}
                                            onClick={() => setSelectedTask(t)}
                                            className="border border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between bg-card"
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                                                        {t.task_code}
                                                    </span>
                                                    <div className="flex items-center space-x-1.5">
                                                        {getPriorityBadge(t.priority)}
                                                        <Badge variant="outline" className="text-[10px] font-mono">
                                                            {t.progress_percent}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-sm font-semibold text-foreground line-clamp-1">
                                                    {t.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {t.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="p-4 pt-1 space-y-3">
                                                {/* Progress Bar */}
                                                <div className="space-y-1">
                                                    <Progress value={t.progress_percent} className="h-1.5" />
                                                </div>

                                                {/* Latest update note */}
                                                {latestUpdate && (
                                                    <div className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1 border border-border/40">
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                                                            <span>Aktivitas Terakhir:</span>
                                                            <span>{formatDate(latestUpdate.activity_date)}</span>
                                                        </div>
                                                        <div className="font-medium text-foreground text-xs line-clamp-1">
                                                            {latestUpdate.summary}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground line-clamp-2">
                                                            {latestUpdate.work_done}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Footer Info */}
                                                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        <span>Target: {t.due_date ? formatDate(t.due_date) : 'Fleksibel'}</span>
                                                    </div>
                                                    <span className="font-medium text-primary flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                                                        <span>Detail</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground">
                                Tidak ada pekerjaan yang berstatus In Progress saat ini.
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab 2: Kendala Teknis (Blocked) */}
                    <TabsContent value="blocked" className="space-y-4">
                        {blockedTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {blockedTasks.map((t) => {
                                    const latestUpdate = t.updates?.[0];
                                    return (
                                        <Card
                                            key={t.id}
                                            onClick={() => setSelectedTask(t)}
                                            className="border-2 border-red-300 dark:border-red-900/60 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-card"
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                            {t.task_code}
                                                        </span>
                                                        {getPriorityBadge(t.priority)}
                                                    </div>
                                                    <Badge variant="destructive" className="text-[10px]">
                                                        TERKENDALA
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-sm font-semibold text-foreground">
                                                    {t.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-1 space-y-3">
                                                {/* Blocker Callout */}
                                                <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 border border-red-200 dark:border-red-900/40 space-y-1">
                                                    <div className="flex items-center space-x-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                                        <span>Rincian Kendala / Blocker:</span>
                                                    </div>
                                                    <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed font-medium">
                                                        {latestUpdate?.blocker || 'Belum ada penjelasan kendala tertulis.'}
                                                    </p>
                                                    {latestUpdate?.next_action && (
                                                        <div className="pt-1.5 text-[11px] text-red-700 dark:text-red-300 border-t border-red-200/60 dark:border-red-900/40">
                                                            <span className="font-semibold">Rencana Tindak Lanjut: </span>
                                                            {latestUpdate.next_action}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                                                    <span>Kategori: {t.category?.name}</span>
                                                    <span className="text-primary font-medium flex items-center space-x-1">
                                                        <span>Lihat Riwayat &bull;</span>
                                                        <span>{formatDate(latestUpdate?.activity_date)}</span>
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-xs text-muted-foreground bg-card rounded-xl border border-dashed border-border space-y-2">
                                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                                <div className="font-semibold text-sm text-foreground">Zero Technical Blocker</div>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                    Saat ini tidak ada pekerjaan operasional yang terhambat kendala teknis. Seluruh proses berjalan normal.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab 3: Baru Selesai (Recently Completed) */}
                    <TabsContent value="completed" className="space-y-4">
                        {recentlyCompleted.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentlyCompleted.map((t) => {
                                    const latestUpdate = t.updates?.[0];
                                    return (
                                        <Card
                                            key={t.id}
                                            onClick={() => setSelectedTask(t)}
                                            className="border border-border/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group bg-card"
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {t.task_code}
                                                    </span>
                                                    <Badge variant="success" className="text-[10px]">
                                                        100% SELESAI
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-sm font-semibold text-foreground line-clamp-1">
                                                    {t.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-1 space-y-2.5">
                                                {latestUpdate?.result ? (
                                                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-xs border border-emerald-200 dark:border-emerald-900/30">
                                                        <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] block">
                                                            Hasil Akhir:
                                                        </span>
                                                        <p className="text-emerald-700 dark:text-emerald-400 text-xs line-clamp-2 mt-0.5">
                                                            {latestUpdate.result}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {t.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                                                    <span>Selesai: {t.completed_at ? formatDateTime(t.completed_at) : '-'}</span>
                                                    <span className="text-primary font-medium">Buka Timeline</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground">
                                Belum ada pekerjaan yang selesai.
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab 4: Semua Pekerjaan (Interactive Table with Filter) */}
                    <TabsContent value="all_tasks" className="space-y-4">
                        {/* Search & Filter Bar */}
                        <Card className="shadow-xs border-border/80">
                            <CardContent className="p-3.5">
                                <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
                                    <div className="relative flex-1 w-full">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari kode task, judul pekerjaan, atau kata kunci..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="h-8 pl-9 text-xs"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs"
                                        >
                                            <option value="">Semua Kategori</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="completed">Completed</option>
                                            <option value="backlog">Backlog</option>
                                        </select>

                                        <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                                            <Filter className="w-3.5 h-3.5 mr-1" />
                                            Filter
                                        </Button>

                                        {(search || selectedCategory || selectedStatus) && (
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
                                </form>
                            </CardContent>
                        </Card>

                        {/* Tasks Table */}
                        <Card className="shadow-xs border-border/80">
                            <CardContent className="p-0">
                                <Table className="min-w-[750px]">
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="w-32">Kode Task</TableHead>
                                            <TableHead>Judul Pekerjaan</TableHead>
                                            <TableHead className="w-36">Kategori</TableHead>
                                            <TableHead className="w-24">Prioritas</TableHead>
                                            <TableHead className="w-28">Status</TableHead>
                                            <TableHead className="w-28">Progress</TableHead>
                                            <TableHead className="w-28">Target Selesai</TableHead>
                                            <TableHead className="w-20 text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.data.length > 0 ? (
                                            tasks.data.map((t) => (
                                                <TableRow
                                                    key={t.id}
                                                    onClick={() => setSelectedTask(t)}
                                                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                                                >
                                                    <TableCell className="font-mono text-xs font-bold text-primary">
                                                        {t.task_code}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-semibold text-foreground line-clamp-1">
                                                            {t.title}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                            {t.description}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {t.category?.name || '-'}
                                                    </TableCell>
                                                    <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                                                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-semibold block">{t.progress_percent}%</span>
                                                            <Progress value={t.progress_percent} className="h-1.5 w-20" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground font-medium">
                                                        {t.due_date ? formatDate(t.due_date) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTask(t);
                                                            }}
                                                        >
                                                            Rincian
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                                                    Tidak ada pekerjaan yang cocok dengan pencarian.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Read-Only Task Details Modal for Atasan */}
                <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                    <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
                        {selectedTask && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-mono text-xs font-bold text-primary">
                                            {selectedTask.task_code}
                                        </span>
                                        {getStatusBadge(selectedTask.status)}
                                        {getPriorityBadge(selectedTask.priority)}
                                    </div>
                                    <DialogTitle className="text-lg font-bold">
                                        {selectedTask.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Kategori: {selectedTask.category?.name || '-'} &bull; Dibuat oleh tim DevOps
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 pt-2 text-xs">
                                    {/* Progress meter */}
                                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium">Kemajuan Pekerjaan</span>
                                            <span className="font-bold text-foreground">{selectedTask.progress_percent}%</span>
                                        </div>
                                        <Progress value={selectedTask.progress_percent} className="h-2" />
                                        <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                                            <span>Mulai: {formatDate(selectedTask.start_date)}</span>
                                            <span>Target: {selectedTask.due_date ? formatDate(selectedTask.due_date) : '-'}</span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <span className="font-semibold text-foreground block mb-1">Deskripsi Tugas:</span>
                                        <p className="text-muted-foreground bg-muted/20 p-2.5 rounded border border-border/40 whitespace-pre-line leading-relaxed">
                                            {selectedTask.description}
                                        </p>
                                    </div>

                                    {/* Related Assets */}
                                    {selectedTask.assets && selectedTask.assets.length > 0 && (
                                        <div>
                                            <span className="font-semibold text-foreground block mb-1">Aset Infrastruktur Terkait:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTask.assets.map((a) => (
                                                    <div
                                                        key={a.id}
                                                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-muted text-xs border border-border/60"
                                                    >
                                                        <Server className="w-3 h-3 text-primary" />
                                                        <span className="font-medium text-foreground">{a.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">({a.environment})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Daily Activity Timeline */}
                                    <div>
                                        <span className="font-semibold text-foreground block mb-2">
                                            Histori Progres Harian ({selectedTask.updates?.length || 0} Update):
                                        </span>
                                        {selectedTask.updates && selectedTask.updates.length > 0 ? (
                                            <div className="relative border-l border-border ml-2 space-y-4 pl-4 py-1">
                                                {selectedTask.updates.map((u) => (
                                                    <div key={u.id} className="relative group">
                                                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                                                        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-foreground">
                                                                    {formatDate(u.activity_date)}
                                                                </span>
                                                                <div className="flex items-center space-x-1.5">
                                                                    {getStatusBadge(u.status)}
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        {u.progress_percent}%
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="font-medium text-foreground text-xs">
                                                                {u.summary}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground whitespace-pre-line leading-relaxed">
                                                                {u.work_done}
                                                            </div>
                                                            {u.result && (
                                                                <div className="rounded bg-emerald-50 dark:bg-emerald-950/20 p-2 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                                                                    <span className="font-semibold">Hasil: </span>
                                                                    {u.result}
                                                                </div>
                                                            )}
                                                            {u.blocker && (
                                                                <div className="rounded bg-red-50 dark:bg-red-950/20 p-2 text-[11px] text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                                                                    <span className="font-semibold">Kendala: </span>
                                                                    {u.blocker}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded border border-dashed border-border text-xs">
                                                Belum ada catatan aktivitas harian untuk pekerjaan ini.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card/60 py-4 mt-auto">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                    <div className="flex items-center space-x-2">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span>DevOps Work Tracker &bull; Executive Monitoring Dashboard</span>
                    </div>
                    <div>
                        <span>Sistem Operasional Resmi &bull; Read-Only Executive Mode</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
