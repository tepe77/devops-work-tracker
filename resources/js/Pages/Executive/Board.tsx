import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Evidence, PageProps, Task } from '@/types';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Progress } from '@/Components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    HardDrive,
    Image as ImageIcon,
    Layers,
    LogIn,
    Maximize2,
    Paperclip,
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
    todayPulse: {
        date_formatted: string;
        activities_count: number;
        completed_count: number;
        blocked_count: number;
    };
    filters: {
        period?: string;
        sort_by?: string;
        status: string;
        category_id: string;
        search: string;
    };
    currentTime: string;
}

export default function ExecutiveBoard({
    auth,
    metrics,
    todayPulse,
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
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || 'all');
    const [selectedSort, setSelectedSort] = useState(filters.sort_by || 'latest_activity');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [previewImage, setPreviewImage] = useState<Evidence | null>(null);

    const completionRate = summary.total_tasks > 0
        ? Math.round((summary.completed / summary.total_tasks) * 100)
        : 0;

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.get(
            route('executive.board'),
            {
                period: newPeriod,
                sort_by: selectedSort,
                search,
                category_id: selectedCategory,
                status: selectedStatus,
            },
            { preserveState: true }
        );
    };

    const handleSortChange = (newSort: string) => {
        setSelectedSort(newSort);
        router.get(
            route('executive.board'),
            {
                period: selectedPeriod,
                sort_by: newSort,
                search,
                category_id: selectedCategory,
                status: selectedStatus,
            },
            { preserveState: true }
        );
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('executive.board'),
            {
                period: selectedPeriod,
                sort_by: selectedSort,
                search,
                category_id: selectedCategory,
                status: selectedStatus,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedStatus('');
        setSelectedPeriod('all');
        setSelectedSort('latest_activity');
        router.get(route('executive.board'), {}, { preserveState: true });
    };

    const getActivityBadge = (dateStr?: string) => {
        if (!dateStr) return null;
        const actDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const todayStr = new Date().toISOString().split('T')[0];

        if (actDate === todayStr) {
            return (
                <Badge variant="success" className="text-[10px] space-x-1 font-semibold bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Update Hari Ini</span>
                </Badge>
            );
        }

        const act = new Date(actDate);
        const today = new Date(todayStr);
        const diffTime = today.getTime() - act.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

        if (diffDays === 1) {
            return (
                <Badge variant="secondary" className="text-[10px] font-medium">
                    Kemarin
                </Badge>
            );
        } else if (diffDays > 1 && diffDays <= 7) {
            return (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {diffDays} hari lalu
                </Badge>
            );
        }
        return null;
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
                {/* Smart Hybrid Executive Control Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
                    {/* Period Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Periode:</span>
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                            onClick={() => handlePeriodChange('all')}
                            className="h-7 text-xs px-2.5"
                        >
                            Semua Aktif
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                            onClick={() => handlePeriodChange('today')}
                            className={`h-7 text-xs px-2.5 space-x-1.5 ${
                                selectedPeriod === 'today'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hari Ini</span>
                            {todayPulse.activities_count > 0 && (
                                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    selectedPeriod === 'today'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                }`}>
                                    {todayPulse.activities_count}
                                </span>
                            )}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={selectedPeriod === 'this_week' ? 'default' : 'outline'}
                            onClick={() => handlePeriodChange('this_week')}
                            className="h-7 text-xs px-2.5"
                        >
                            Minggu Ini
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={selectedPeriod === 'this_month' ? 'default' : 'outline'}
                            onClick={() => handlePeriodChange('this_month')}
                            className="h-7 text-xs px-2.5"
                        >
                            Bulan Ini
                        </Button>
                    </div>

                    {/* Sorting & Refresh */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground font-medium hidden md:inline">Urutkan:</span>
                        <select
                            value={selectedSort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="h-7 rounded-md border border-input bg-background px-2 text-xs shadow-2xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="latest_activity">Aktivitas Terkini (Default)</option>
                            <option value="due_date">Deadline Terdekat</option>
                            <option value="priority">Prioritas Tertinggi</option>
                            <option value="created_at">Baru Dibuat</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs space-x-1 shadow-2xs bg-background"
                            onClick={() => router.reload()}
                            title="Segarkan data secara live"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden sm:inline">Segarkan</span>
                        </Button>
                    </div>
                </div>

                {/* Today's Operational Pulse Bar */}
                <div className="rounded-xl border border-border/80 bg-linear-to-r from-card via-card to-emerald-50/40 dark:to-emerald-950/20 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Radio className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                    Denyut Operasional Hari Ini
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                    &bull; {todayPulse.date_formatted}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center space-x-1 text-xs text-muted-foreground">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{todayPulse.activities_count}</span>
                                    <span>Aktivitas Tercatat</span>
                                </span>
                                <span className="text-muted-foreground/40">&bull;</span>
                                <span className="inline-flex items-center space-x-1 text-xs text-muted-foreground">
                                    <span className="font-bold text-sky-600 dark:text-sky-400">{todayPulse.completed_count}</span>
                                    <span>Tuntas Hari Ini</span>
                                </span>
                                <span className="text-muted-foreground/40">&bull;</span>
                                <span className="inline-flex items-center space-x-1 text-xs text-muted-foreground">
                                    <span className="font-bold text-red-600 dark:text-red-400">{todayPulse.blocked_count}</span>
                                    <span>Kendala Aktif</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    {selectedPeriod !== 'today' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePeriodChange('today')}
                            className="h-7 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 space-x-1 self-start sm:self-auto shrink-0"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Fokus Hari Ini</span>
                        </Button>
                    )}
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
                                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                                        <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                                                            {t.task_code}
                                                        </span>
                                                        {getActivityBadge(latestUpdate?.activity_date)}
                                                    </div>
                                                    <div className="flex items-center space-x-1.5 shrink-0">
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
                            <div className="text-center py-12 text-xs text-muted-foreground bg-card rounded-xl border border-dashed border-border p-6 space-y-3">
                                <Activity className="w-8 h-8 mx-auto text-muted-foreground/40" />
                                <p className="font-medium text-foreground">
                                    Tidak ada pekerjaan yang berstatus In Progress {selectedPeriod !== 'all' ? 'pada periode yang dipilih' : 'saat ini'}.
                                </p>
                                {selectedPeriod !== 'all' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePeriodChange('all')}
                                        className="h-7 text-xs"
                                    >
                                        Tampilkan Semua Pekerjaan Aktif
                                    </Button>
                                )}
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
                                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                            {t.task_code}
                                                        </span>
                                                        {getActivityBadge(latestUpdate?.activity_date)}
                                                        {getPriorityBadge(t.priority)}
                                                    </div>
                                                    <Badge variant="destructive" className="text-[10px] shrink-0">
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
                                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                            {t.task_code}
                                                        </span>
                                                        {getActivityBadge(t.completed_at || latestUpdate?.activity_date)}
                                                    </div>
                                                    <Badge variant="success" className="text-[10px] shrink-0">
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
                            <div className="text-center py-12 text-xs text-muted-foreground bg-card rounded-xl border border-dashed border-border p-6 space-y-3">
                                <CheckCircle2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
                                <p className="font-medium text-foreground">
                                    Belum ada pekerjaan yang selesai {selectedPeriod !== 'all' ? 'pada periode yang dipilih' : 'saat ini'}.
                                </p>
                                {selectedPeriod !== 'all' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePeriodChange('all')}
                                        className="h-7 text-xs"
                                    >
                                        Tampilkan Semua Periode
                                    </Button>
                                )}
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
                                            <TableHead className="w-36">Aktivitas Terakhir</TableHead>
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
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <span className="text-xs text-muted-foreground font-medium block">
                                                                {t.updates?.[0]?.activity_date ? formatDate(t.updates[0].activity_date) : '-'}
                                                            </span>
                                                            {getActivityBadge(t.updates?.[0]?.activity_date)}
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
                                                <TableCell colSpan={9} className="text-center py-12 text-xs text-muted-foreground">
                                                    Tidak ada pekerjaan yang cocok dengan pencarian atau periode ini.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Pagination Links */}
                        {tasks.links && tasks.links.length > 3 && (
                            <div className="flex justify-center items-center space-x-1 pt-2">
                                {tasks.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : link.url
                                                    ? 'text-muted-foreground hover:bg-muted'
                                                    : 'text-muted-foreground/40 cursor-not-allowed pointer-events-none'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Read-Only Task Details Modal for Atasan */}
                <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                    <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
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

                                    {/* Task-Level Attachments / Screenshots */}
                                    {(() => {
                                        const taskLevelEvidences = selectedTask.evidences?.filter((ev) => !ev.task_update_id) || [];
                                        if (taskLevelEvidences.length === 0) return null;
                                        return (
                                            <div className="space-y-2 pt-2 border-t border-border/60">
                                                <span className="font-semibold text-foreground flex items-center space-x-1.5">
                                                    <Paperclip className="w-3.5 h-3.5 text-primary" />
                                                    <span>Lampiran Utama Pekerjaan ({taskLevelEvidences.length}):</span>
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {taskLevelEvidences.map((ev) => {
                                                        const isImg = ev.mime_type?.startsWith('image/');
                                                        if (isImg) {
                                                            return (
                                                                <div
                                                                    key={ev.id}
                                                                    onClick={() => setPreviewImage(ev)}
                                                                    className="group relative flex flex-col rounded-md border border-border/80 bg-background/60 p-2 hover:bg-accent/40 transition-colors cursor-pointer overflow-hidden shadow-2xs"
                                                                >
                                                                    <div className="relative w-full h-28 rounded overflow-hidden bg-muted/50 mb-1.5 border border-border/40 flex items-center justify-center">
                                                                        <img
                                                                            src={route('evidences.download', ev.id) + '?inline=1'}
                                                                            alt={ev.caption || ev.original_name}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                            loading="lazy"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-white">
                                                                            <Maximize2 className="w-4 h-4" />
                                                                            <span className="text-[11px] font-medium">Klik Perbesar</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-[11px] truncate">
                                                                        <span className="font-medium text-foreground truncate">{ev.original_name}</span>
                                                                        <span className="text-[10px] text-muted-foreground ml-1 shrink-0">{Math.round(ev.file_size / 1024)} KB</span>
                                                                    </div>
                                                                    {ev.caption && (
                                                                        <p className="text-[10px] text-muted-foreground italic truncate mt-0.5">{ev.caption}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={ev.id}
                                                                className="flex items-center justify-between rounded-md border border-border/80 bg-background/60 p-2.5 text-xs shadow-2xs"
                                                            >
                                                                <div className="flex items-center space-x-2 truncate">
                                                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                                                    <div className="truncate">
                                                                        <p className="font-medium text-foreground truncate text-[11px]">{ev.original_name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {Math.round(ev.file_size / 1024)} KB &bull; {ev.caption || 'Dokumen'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={route('evidences.download', ev.id)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center space-x-1"
                                                                    title="Unduh file"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-medium">Unduh</span>
                                                                </a>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

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
                                                        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs space-y-2">
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

                                                            {/* Evidences / Screenshots for this update */}
                                                            {u.evidences && u.evidences.length > 0 && (
                                                                <div className="pt-2.5 mt-2 border-t border-border/60 space-y-1.5">
                                                                    <span className="text-[11px] font-semibold text-foreground flex items-center space-x-1.5">
                                                                        <Paperclip className="w-3 h-3 text-primary" />
                                                                        <span>Bukti / Screenshot Terlampir ({u.evidences.length}):</span>
                                                                    </span>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                                        {u.evidences.map((ev) => {
                                                                            const isImg = ev.mime_type?.startsWith('image/');
                                                                            if (isImg) {
                                                                                return (
                                                                                    <div
                                                                                        key={ev.id}
                                                                                        onClick={() => setPreviewImage(ev)}
                                                                                        className="group relative flex flex-col rounded-md border border-border/80 bg-background/60 p-2 hover:bg-accent/40 transition-colors cursor-pointer overflow-hidden shadow-2xs"
                                                                                    >
                                                                                        <div className="relative w-full h-28 rounded overflow-hidden bg-muted/50 mb-1.5 border border-border/40 flex items-center justify-center">
                                                                                            <img
                                                                                                src={route('evidences.download', ev.id) + '?inline=1'}
                                                                                                alt={ev.caption || ev.original_name}
                                                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                                                loading="lazy"
                                                                                            />
                                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-white">
                                                                                                <Maximize2 className="w-4 h-4" />
                                                                                                <span className="text-[11px] font-medium">Klik Perbesar</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-between text-[11px] truncate">
                                                                                            <span className="font-medium text-foreground truncate">{ev.original_name}</span>
                                                                                            <span className="text-[10px] text-muted-foreground ml-1 shrink-0">{Math.round(ev.file_size / 1024)} KB</span>
                                                                                        </div>
                                                                                        {ev.caption && (
                                                                                            <p className="text-[10px] text-muted-foreground italic truncate mt-0.5">{ev.caption}</p>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <div
                                                                                    key={ev.id}
                                                                                    className="flex items-center justify-between rounded-md border border-border/80 bg-background/60 p-2.5 text-xs shadow-2xs"
                                                                                >
                                                                                    <div className="flex items-center space-x-2 truncate">
                                                                                        <FileText className="w-4 h-4 text-primary shrink-0" />
                                                                                        <div className="truncate">
                                                                                            <p className="font-medium text-foreground truncate text-[11px]">{ev.original_name}</p>
                                                                                            <p className="text-[10px] text-muted-foreground">
                                                                                                {Math.round(ev.file_size / 1024)} KB &bull; {ev.caption || 'Dokumen'}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <a
                                                                                        href={route('evidences.download', ev.id)}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center space-x-1"
                                                                                        title="Unduh file"
                                                                                    >
                                                                                        <Download className="w-3.5 h-3.5" />
                                                                                        <span className="text-[10px] font-medium">Unduh</span>
                                                                                    </a>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
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

                {/* Image Preview Lightbox Modal */}
                <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                    <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
                        {previewImage && (
                            <div className="space-y-4">
                                <DialogHeader>
                                    <div className="flex items-center space-x-2 text-primary">
                                        <ImageIcon className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Preview Screenshot / Gambar</span>
                                    </div>
                                    <DialogTitle className="text-base font-bold text-foreground">
                                        {previewImage.original_name}
                                    </DialogTitle>
                                    {previewImage.caption && (
                                        <DialogDescription className="text-xs text-muted-foreground italic">
                                            "{previewImage.caption}"
                                        </DialogDescription>
                                    )}
                                </DialogHeader>

                                <div className="relative rounded-lg overflow-hidden bg-black/95 flex items-center justify-center min-h-[220px] max-h-[65vh] p-2 border border-border">
                                    <img
                                        src={route('evidences.download', previewImage.id) + '?inline=1'}
                                        alt={previewImage.caption || previewImage.original_name}
                                        className="max-h-[62vh] max-w-full object-contain rounded"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border">
                                    <div className="flex items-center space-x-3 text-[11px]">
                                        <span>Ukuran: <strong>{Math.round(previewImage.file_size / 1024)} KB</strong></span>
                                        <span>&bull;</span>
                                        <span>Format: <strong>{previewImage.mime_type}</strong></span>
                                        {previewImage.created_at && (
                                            <>
                                                <span>&bull;</span>
                                                <span>{formatDateTime(previewImage.created_at)}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <a
                                            href={route('evidences.download', previewImage.id) + '?inline=1'}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Button size="sm" variant="outline" className="h-8 text-xs space-x-1.5">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Buka Penuh</span>
                                            </Button>
                                        </a>
                                        <a
                                            href={route('evidences.download', previewImage.id)}
                                            download
                                        >
                                            <Button size="sm" variant="default" className="h-8 text-xs space-x-1.5">
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Unduh File</span>
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
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
