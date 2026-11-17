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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
    Calendar,
    Download,
    FileBarChart,
    FileText,
    Filter,
    Paperclip,
    Printer,
} from 'lucide-react';

interface ReportsIndexProps extends PageProps {
    report: {
        type: 'daily' | 'weekly' | 'monthly';
        formatted_date?: string;
        formatted_period?: string;
        formatted_month?: string;
        total_activities: number;
        total_tasks_affected?: number;
        completed_count?: number;
        in_progress_count?: number;
        blocked_count?: number;
        active_count?: number;
        activities: Array<{
            id: number;
            activity_date: string;
            summary: string;
            work_done: string;
            result?: string;
            blocker?: string;
            next_action?: string;
            progress_percent: number;
            status: string;
            user?: { name: string };
            task: {
                id: number;
                task_code: string;
                title: string;
                category?: { name: string };
            };
            evidences?: Array<{ id: number; original_name: string }>;
        }>;
        tasks?: Array<{
            id: number;
            task_code: string;
            title: string;
            category?: { name: string };
        }>;
        categories?: Array<{
            id: number;
            name: string;
            tasks_count: number;
        }>;
    };
    filters: {
        type: 'daily' | 'weekly' | 'monthly';
        date: string;
        start_date: string;
        end_date: string;
        year: number;
        month: number;
    };
}

export default function ReportsIndex({ auth, report, filters }: ReportsIndexProps) {
    const [currentTab, setCurrentTab] = useState(filters.type);
    const [date, setDate] = useState(filters.date);
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [year, setYear] = useState(filters.year.toString());
    const [month, setMonth] = useState(filters.month.toString());

    const handleTabChange = (val: string) => {
        setCurrentTab(val as any);
        router.get(
            route('reports.index'),
            { type: val, date, start_date: startDate, end_date: endDate, year, month },
            { preserveState: true }
        );
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('reports.index'),
            { type: currentTab, date, start_date: startDate, end_date: endDate, year, month },
            { preserveState: true }
        );
    };

    // Build export PDF url
    const exportPdfUrl = route('reports.export', {
        type: currentTab,
        date,
        start_date: startDate,
        end_date: endDate,
        year,
        month,
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2 text-xs">
                    <span className="text-muted-foreground">DevOps</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold text-foreground">Laporan & Analytics</span>
                </div>
            }
        >
            <Head title="Laporan & Analytics - DevOps Work Tracker" />

            {/* Page Header Section with Dedicated Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
                        <FileBarChart className="w-6 h-6 text-primary" />
                        <span>Laporan & Analitik DevOps</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Rekap pekerjaan operasional, progres lintas hari, dan ekspor snapshot dokumen PDF resmi
                    </p>
                </div>

                <a href={exportPdfUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto shrink-0">
                    <Button size="default" className="w-full sm:w-auto space-x-2 shadow-sm font-semibold">
                        <Download className="w-4 h-4" />
                        <span>Export Laporan (PDF)</span>
                    </Button>
                </a>
            </div>

            {/* Filter and Tab Selection */}
            <Card className="shadow-sm border-border/80">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <div className="overflow-x-auto pb-1 max-w-full -mx-1 px-1">
                            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
                                <TabsList className="w-max">
                                    <TabsTrigger value="daily">Laporan Harian (Daily)</TabsTrigger>
                                    <TabsTrigger value="weekly">Laporan Mingguan (Weekly)</TabsTrigger>
                                    <TabsTrigger value="monthly">Laporan Bulanan (Monthly)</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-md self-start sm:self-auto">
                            Zona Waktu: <strong>Asia/Jakarta</strong> (WIB)
                        </div>
                    </div>

                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
                        {currentTab === 'daily' && (
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium">Pilih Tanggal:</span>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-8 text-xs w-40"
                                    required
                                />
                            </div>
                        )}

                        {currentTab === 'weekly' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium">Rentang Minggu:</span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-8 text-xs w-36"
                                    required
                                />
                                <span className="text-xs text-muted-foreground">s/d</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 text-xs w-36"
                                    required
                                />
                            </div>
                        )}

                        {currentTab === 'monthly' && (
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium">Bulan & Tahun:</span>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                >
                                    <option value="1">Januari</option>
                                    <option value="2">Februari</option>
                                    <option value="3">Maret</option>
                                    <option value="4">April</option>
                                    <option value="5">Mei</option>
                                    <option value="6">Juni</option>
                                    <option value="7">Juli</option>
                                    <option value="8">Agustus</option>
                                    <option value="9">September</option>
                                    <option value="10">Oktober</option>
                                    <option value="11">November</option>
                                    <option value="12">Desember</option>
                                </select>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="h-8 text-xs w-24"
                                    min={2020}
                                    max={2035}
                                    required
                                />
                            </div>
                        )}

                        <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                            <Filter className="w-3.5 h-3.5 mr-1" />
                            Tampilkan Data
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Report Header & Overview Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="shadow-sm border-border/80">
                    <CardHeader className="p-4 pb-1">
                        <CardDescription className="text-xs font-medium">Total Aktivitas</CardDescription>
                        <CardTitle className="text-2xl font-bold">{report.total_activities}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                        {report.formatted_date || report.formatted_period || report.formatted_month}
                    </CardContent>
                </Card>

                {report.total_tasks_affected !== undefined && (
                    <Card className="shadow-sm border-border/80">
                        <CardHeader className="p-4 pb-1">
                            <CardDescription className="text-xs font-medium">Task Terkait</CardDescription>
                            <CardTitle className="text-2xl font-bold text-primary">
                                {report.total_tasks_affected}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                            Pekerjaan aktif
                        </CardContent>
                    </Card>
                )}

                {report.completed_count !== undefined && (
                    <Card className="shadow-sm border-border/80">
                        <CardHeader className="p-4 pb-1">
                            <CardDescription className="text-xs font-medium">Pekerjaan Selesai</CardDescription>
                            <CardTitle className="text-2xl font-bold text-emerald-600">
                                {report.completed_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                            Target terselesaikan
                        </CardContent>
                    </Card>
                )}

                {report.blocked_count !== undefined && (
                    <Card className="shadow-sm border-border/80">
                        <CardHeader className="p-4 pb-1">
                            <CardDescription className="text-xs font-medium">Mengalami Kendala</CardDescription>
                            <CardTitle className="text-2xl font-bold text-red-600">
                                {report.blocked_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                            Status Blocked
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Activities Table */}
            <Card className="shadow-sm border-border/80">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold">Log Aktivitas Periode Ini</CardTitle>
                        <CardDescription className="text-xs">
                            Rincian teknis pekerjaan, hasil, kendala, dan rencana tindakan lanjutan
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table className="min-w-[850px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-28">Tanggal</TableHead>
                                <TableHead className="w-40">Task</TableHead>
                                <TableHead>Ringkasan & Tindakan Teknis</TableHead>
                                <TableHead className="w-64">Hasil / Kendala</TableHead>
                                <TableHead className="w-28">Status</TableHead>
                                <TableHead className="w-20 text-right">Progress</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.activities && report.activities.length > 0 ? (
                                report.activities.map((act) => (
                                    <TableRow key={act.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(act.activity_date)}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={route('tasks.show', act.task.id)}
                                                className="font-mono text-xs font-bold text-primary hover:underline block"
                                            >
                                                {act.task.task_code}
                                            </Link>
                                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                                                {act.task.title}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-xs text-foreground">{act.summary}</div>
                                            <div className="text-[11px] text-muted-foreground whitespace-pre-line mt-0.5 line-clamp-2">
                                                {act.work_done}
                                            </div>
                                            {act.evidences && act.evidences.length > 0 && (
                                                <div className="flex items-center space-x-1 mt-1 text-[10px] text-primary font-medium">
                                                    <Paperclip className="w-3 h-3" />
                                                    <span>{act.evidences.length} evidence terlampir</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {act.result && (
                                                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                                    <span className="font-semibold">Hasil: </span>
                                                    {act.result}
                                                </div>
                                            )}
                                            {act.blocker && (
                                                <div className="text-[11px] text-red-600 font-medium mt-0.5">
                                                    <span className="font-semibold">Blocker: </span>
                                                    {act.blocker}
                                                </div>
                                            )}
                                            {act.next_action && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    <span className="font-medium">Next: </span>
                                                    {act.next_action}
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
                                        <TableCell className="text-right font-semibold text-xs">
                                            {act.progress_percent}%
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                                        Tidak ada aktivitas tercatat untuk periode ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
