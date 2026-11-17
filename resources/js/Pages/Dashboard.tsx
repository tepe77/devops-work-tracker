import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
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
import { DatePicker } from '@/Components/ui/date-picker';
import { Progress } from '@/Components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    Layers,
    PlusCircle,
    RotateCcw,
    Server,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from 'chart.js';
import { formatDate } from '@/lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps extends PageProps {
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
        categories: Array<{
            id: number;
            name: string;
            slug: string;
            tasks_count: number;
        }>;
        priorities: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        recent_activities: Array<{
            id: number;
            activity_date: string;
            summary: string;
            work_done: string;
            result?: string;
            blocker?: string;
            progress_percent: number;
            status: string;
            user: { name: string };
            task: {
                id: number;
                task_code: string;
                title: string;
                category?: { name: string };
            };
        }>;
        due_soon_tasks: Array<{
            id: number;
            task_code: string;
            title: string;
            due_date: string;
            priority: string;
            category?: { name: string };
        }>;
        filters: {
            start_date?: string;
            end_date?: string;
        };
    };
}

export default function Dashboard({ auth, metrics }: DashboardProps) {
    const summary = metrics.summary;
    const user = auth.user;
    const [startDate, setStartDate] = useState(metrics.filters.start_date || '');
    const [endDate, setEndDate] = useState(metrics.filters.end_date || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('dashboard'), { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        router.get(route('dashboard'), {}, { preserveState: true });
    };

    // Derived metrics for UI indicators
    const completionRate = summary.total_tasks > 0 
        ? Math.round((summary.completed / summary.total_tasks) * 100) 
        : 0;

    const inProgressRate = summary.total_tasks > 0 
        ? Math.round((summary.in_progress / summary.total_tasks) * 100) 
        : 0;

    // Chart Data for Status Doughnut
    const statusChartData = {
        labels: ['Completed', 'In Progress', 'Blocked', 'Backlog'],
        datasets: [
            {
                data: [summary.completed, summary.in_progress, summary.blocked, summary.backlog],
                backgroundColor: [
                    '#10b981', // emerald-500
                    '#0284c7', // sky-600
                    '#ef4444', // red-500
                    '#64748b', // slate-500
                ],
                hoverBackgroundColor: [
                    '#059669',
                    '#0369a1',
                    '#dc2626',
                    '#475569',
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    // Chart Data for Categories Bar
    const topCategories = metrics.categories.slice(0, 6);
    const categoryChartData = {
        labels: topCategories.map((c) => c.name),
        datasets: [
            {
                label: 'Jumlah Task',
                data: topCategories.map((c) => c.tasks_count),
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                hoverBackgroundColor: '#2563eb',
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard - DevOps Work Tracker" />

            {/* Overdue Warning Alert */}
            {summary.overdue > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900/40 dark:bg-red-950/30 shadow-xs flex items-start space-x-3 transition-all">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-sm text-red-900 dark:text-red-200">
                            Perhatian: Terdapat {summary.overdue} Pekerjaan Melewati Batas Waktu (Overdue)
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                            Segera periksa kendala teknis atau sesuaikan target penyelesaian bersama tim management.
                        </p>
                    </div>
                    <Link href={route('tasks.index')}>
                        <Button size="sm" variant="destructive" className="text-xs h-8 shadow-xs">
                            Lihat Task
                        </Button>
                    </Link>
                </div>
            )}

            {/* Date Range Filter Card */}
            <Card className="shadow-xs border-border/80">
                <CardContent className="p-3.5">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground w-full sm:w-auto">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <Filter className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-foreground">Filter Rentang Tanggal Aktivitas:</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <span className="text-[11px] text-muted-foreground font-medium shrink-0">Dari:</span>
                                <DatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    size="sm"
                                    placeholder="Tanggal awal"
                                    className="flex-1 sm:w-36"
                                />
                            </div>
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <span className="text-[11px] text-muted-foreground font-medium shrink-0">Sampai:</span>
                                <DatePicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    size="sm"
                                    placeholder="Tanggal akhir"
                                    min={startDate || undefined}
                                    className="flex-1 sm:w-36"
                                />
                            </div>
                            <div className="flex items-center space-x-2 w-full sm:w-auto pt-1 sm:pt-0">
                                <Button type="submit" size="sm" variant="default" className="h-8 text-xs shadow-xs px-3.5 flex-1 sm:flex-initial">
                                    Terapkan
                                </Button>
                                {(startDate || endDate) && (
                                    <Button
                                        type="button"
                                        onClick={handleReset}
                                        size="sm"
                                        variant="outline"
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

            {/* Premium Shadcn KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Total Task */}
                <Card className="relative overflow-hidden border border-border/80 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all duration-200 group bg-linear-to-br from-card via-card to-blue-50/40 dark:to-blue-950/20">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Total Task</span>
                            <div className="p-2 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 group-hover:scale-105 transition-transform">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold tracking-tight text-foreground">
                                {summary.total_tasks}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                Terdaftar
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2">
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Aktif berjalan:</span>
                            <span className="font-semibold text-foreground">{summary.in_progress + summary.blocked}</span>
                        </div>
                        <Progress value={summary.total_tasks > 0 ? 100 : 0} className="h-1 bg-blue-100 dark:bg-blue-950" indicatorClassName="bg-blue-600" />
                    </CardContent>
                </Card>

                {/* 2. Completed */}
                <Card className="relative overflow-hidden border border-border/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 group bg-linear-to-br from-card via-card to-emerald-50/40 dark:to-emerald-950/20">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Completed</span>
                            <div className="p-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-105 transition-transform">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {summary.completed}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                {completionRate}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2">
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Rasio selesai:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{summary.completed}/{summary.total_tasks}</span>
                        </div>
                        <Progress value={completionRate} className="h-1 bg-emerald-100 dark:bg-emerald-950" indicatorClassName="bg-emerald-500" />
                    </CardContent>
                </Card>

                {/* 3. In Progress */}
                <Card className="relative overflow-hidden border border-border/80 shadow-xs hover:shadow-md hover:border-sky-500/40 transition-all duration-200 group bg-linear-to-br from-card via-card to-sky-50/40 dark:to-sky-950/20">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">In Progress</span>
                            <div className="p-2 rounded-xl bg-sky-100/80 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20 group-hover:scale-105 transition-transform">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold tracking-tight text-sky-600 dark:text-sky-400">
                                {summary.in_progress}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                                {inProgressRate}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2">
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Sedang dikerjakan:</span>
                            <span className="font-semibold text-sky-600 dark:text-sky-400">Aktif</span>
                        </div>
                        <Progress value={inProgressRate} className="h-1 bg-sky-100 dark:bg-sky-950" indicatorClassName="bg-sky-500" />
                    </CardContent>
                </Card>

                {/* 4. Blocked */}
                <Card className={`relative overflow-hidden border shadow-xs hover:shadow-md transition-all duration-200 group bg-linear-to-br from-card via-card ${
                    summary.blocked > 0 
                        ? 'border-red-300 dark:border-red-900/60 to-red-50/50 dark:to-red-950/30' 
                        : 'border-border/80 to-slate-50/30 dark:to-slate-900/20'
                }`}>
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Blocked</span>
                            <div className={`p-2 rounded-xl ring-1 group-hover:scale-105 transition-transform ${
                                summary.blocked > 0
                                    ? 'bg-red-100/80 dark:bg-red-900/40 text-red-600 dark:text-red-400 ring-red-500/30'
                                    : 'bg-muted text-muted-foreground ring-border'
                            }`}>
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className={`text-3xl font-extrabold tracking-tight ${
                                summary.blocked > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                            }`}>
                                {summary.blocked}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                summary.blocked > 0
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {summary.blocked > 0 ? 'Perlu Solusi' : 'Nol Kendala'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2">
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Kendala teknis:</span>
                            <span className={summary.blocked > 0 ? 'font-semibold text-red-600' : 'text-muted-foreground'}>
                                {summary.blocked > 0 ? 'Pending action' : 'Clear'}
                            </span>
                        </div>
                        <Progress 
                            value={summary.total_tasks > 0 ? (summary.blocked / summary.total_tasks) * 100 : 0} 
                            className="h-1 bg-red-100 dark:bg-red-950" 
                            indicatorClassName="bg-red-500" 
                        />
                    </CardContent>
                </Card>

                {/* 5. Backlog */}
                <Card className="relative overflow-hidden border border-border/80 shadow-xs hover:shadow-md hover:border-slate-400/40 transition-all duration-200 group bg-linear-to-br from-card via-card to-slate-100/50 dark:to-slate-900/30">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Backlog</span>
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-400/20 group-hover:scale-105 transition-transform">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold tracking-tight text-slate-700 dark:text-slate-300">
                                {summary.backlog}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                0% Progres
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2">
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Status:</span>
                            <span className="font-semibold text-foreground">Antrian kerja</span>
                        </div>
                        <Progress 
                            value={summary.total_tasks > 0 ? (summary.backlog / summary.total_tasks) * 100 : 0} 
                            className="h-1 bg-slate-100 dark:bg-slate-800" 
                            indicatorClassName="bg-slate-400" 
                        />
                    </CardContent>
                </Card>

                {/* 6. Infra Assets */}
                <Card className="relative overflow-hidden border border-border/80 shadow-xs hover:shadow-md hover:border-purple-500/40 transition-all duration-200 group bg-linear-to-br from-card via-card to-purple-50/40 dark:to-purple-950/20">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Infra Assets</span>
                            <div className="p-2 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 group-hover:scale-105 transition-transform">
                                <Server className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
                                {summary.active_assets}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                Aktif
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2">
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Pemeliharaan:</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">{summary.maintenance_assets} Aset</span>
                        </div>
                        <Progress 
                            value={summary.active_assets > 0 ? ((summary.active_assets - summary.maintenance_assets) / summary.active_assets) * 100 : 0} 
                            className="h-1 bg-purple-100 dark:bg-purple-950" 
                            indicatorClassName="bg-purple-500" 
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Doughnut Chart */}
                <Card className="shadow-xs border-border/80">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Distribusi Status Pekerjaan
                            </CardTitle>
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <CardDescription className="text-xs">
                            Komposisi task berdasarkan status operasional terkini
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 pt-2">
                        {summary.total_tasks > 0 ? (
                            <div className="w-60 h-60 relative flex items-center justify-center">
                                <Doughnut
                                    data={statusChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '72%',
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    boxWidth: 10,
                                                    boxHeight: 10,
                                                    usePointStyle: true,
                                                    pointStyle: 'circle',
                                                    font: { size: 11, family: 'inherit' },
                                                    padding: 14,
                                                },
                                            },
                                        },
                                    }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                    <span className="text-3xl font-extrabold text-foreground">{summary.total_tasks}</span>
                                    <span className="text-[11px] text-muted-foreground font-medium">Total Task</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground">
                                Belum ada data pekerjaan yang tersimpan.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Categories Bar Chart */}
                <Card className="shadow-xs border-border/80 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-foreground">
                                    Distribusi per Kategori DevOps
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Volume beban kerja pada klaster kategori infrastruktur utama
                                </CardDescription>
                            </div>
                            <Link href={route('reports.index')}>
                                <Button variant="ghost" size="sm" className="text-xs h-7 space-x-1 text-primary hover:text-primary">
                                    <span>Laporan Detail</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        {topCategories.length > 0 ? (
                            <div className="h-60">
                                <Bar
                                    data={categoryChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                titleFont: { size: 12 },
                                                bodyFont: { size: 12 },
                                                padding: 10,
                                                cornerRadius: 8,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: { color: 'rgba(203, 213, 225, 0.3)' },
                                                ticks: { stepSize: 1, font: { size: 10 } },
                                            },
                                            x: {
                                                grid: { display: false },
                                                ticks: { font: { size: 10 } },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground">
                                Belum ada data kategori.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Recent Activities & Tasks Due Soon */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities (2 cols) */}
                <Card className="shadow-xs border-border/80 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold text-foreground">
                                Aktivitas & Progres Harian Terbaru
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Log histori update pekerjaan teknis yang baru saja dicatat oleh DevOps engineer
                            </CardDescription>
                        </div>
                        <Link href={route('tasks.index')}>
                            <Button variant="outline" size="sm" className="text-xs h-8 shadow-2xs">
                                Semua Task
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table className="min-w-[650px]">
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="w-32">Tanggal</TableHead>
                                    <TableHead className="w-40">Task</TableHead>
                                    <TableHead>Aktivitas & Tindakan Teknis</TableHead>
                                    <TableHead className="w-28">Status</TableHead>
                                    <TableHead className="w-24 text-right">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {metrics.recent_activities.length > 0 ? (
                                    metrics.recent_activities.map((act) => (
                                        <TableRow key={act.id} className="hover:bg-muted/40 transition-colors">
                                            <TableCell className="text-xs text-muted-foreground font-medium">
                                                {formatDate(act.activity_date)}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={route('tasks.show', act.task.id)}
                                                    className="font-mono text-xs font-semibold text-primary hover:underline block"
                                                >
                                                    {act.task.task_code}
                                                </Link>
                                                <span className="text-[11px] text-muted-foreground line-clamp-1">
                                                    {act.task.title}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-semibold text-foreground">{act.summary}</div>
                                                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                    {act.work_done}
                                                </div>
                                                {act.blocker && (
                                                    <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 flex items-center space-x-1 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/30 line-clamp-1">
                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                        <span>Kendala: {act.blocker}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        act.status === 'completed'
                                                            ? 'success'
                                                            : act.status === 'in_progress'
                                                            ? 'info'
                                                            : act.status === 'blocked'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {act.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="font-bold text-xs">{act.progress_percent}%</span>
                                                    <Progress value={act.progress_percent} className="h-1.5 w-16" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                                            Belum ada aktivitas tercatat pada rentang waktu ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Tasks Due Soon / Overdue List (1 col) */}
                <Card className="shadow-xs border-border/80">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Target Deadline
                            </CardTitle>
                            <div className="p-1.5 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <CardDescription className="text-xs">
                            Pekerjaan dengan batas waktu dalam 7 hari ke depan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {metrics.due_soon_tasks.length > 0 ? (
                            metrics.due_soon_tasks.map((task) => (
                                <Link
                                    key={task.id}
                                    href={route('tasks.show', task.id)}
                                    className="block p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/50 hover:border-primary/40 transition-all shadow-2xs group"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                                            {task.task_code}
                                        </span>
                                        <Badge
                                            variant={task.priority === 'critical' ? 'destructive' : 'warning'}
                                            className="text-[10px]"
                                        >
                                            {task.priority}
                                        </Badge>
                                    </div>
                                    <div className="text-xs font-semibold text-foreground line-clamp-1 mb-2">
                                        {task.title}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                                        <span className="flex items-center space-x-1 font-medium">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            <span>Target: {formatDate(task.due_date)}</span>
                                        </span>
                                        <span className="truncate max-w-[100px]">{task.category?.name}</span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground space-y-1">
                                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
                                <p className="font-medium text-foreground">Tidak Ada Deadline Mendesak</p>
                                <p className="text-[11px]">Semua pekerjaan operasional berjalan sesuai jadwal.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
