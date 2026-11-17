import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category, InfrastructureAsset, PageProps, Task } from '@/types';
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
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
    PlusCircle,
    Search,
    Filter,
    RotateCcw,
    Calendar,
    Server,
    ExternalLink,
    CheckSquare,
} from 'lucide-react';

interface TasksIndexProps extends PageProps {
    tasks: {
        data: Task[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
        current_page: number;
        last_page: number;
    };
    categories: Category[];
    assets: InfrastructureAsset[];
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        category_id?: string;
        asset_id?: string;
    };
}

export default function TasksIndex({ auth, tasks, categories, assets, filters }: TasksIndexProps) {
    const user = auth.user;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [priority, setPriority] = useState(filters.priority || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [assetId, setAssetId] = useState(filters.asset_id || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('tasks.index'),
            { search, status, priority, category_id: categoryId, asset_id: assetId },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setCategoryId('');
        setAssetId('');
        router.get(route('tasks.index'), {}, { preserveState: true });
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
                <div className="flex items-center space-x-2 text-xs">
                    <span className="text-muted-foreground">DevOps</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold text-foreground">Tasks & Pekerjaan</span>
                </div>
            }
        >
            <Head title="Tasks - DevOps Work Tracker" />

            {/* Page Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
                        <CheckSquare className="w-6 h-6 text-primary" />
                        <span>Daftar Pekerjaan DevOps</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola tiket pekerjaan, investigasi teknis, dan maintenance server lintas hari
                    </p>
                </div>

                {user?.is_admin && (
                    <Link href={route('tasks.create')} className="w-full sm:w-auto shrink-0">
                        <Button size="default" className="w-full sm:w-auto space-x-2 shadow-sm font-semibold">
                            <PlusCircle className="w-4 h-4" />
                            <span>Buat Task Baru</span>
                        </Button>
                    </Link>
                )}
            </div>

            {/* Filter and Search Bar */}
            <Card className="shadow-sm border-border/80">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="relative md:col-span-2">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Cari kode (DWT-...), judul, atau deskripsi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Semua Status</option>
                                <option value="backlog">Backlog</option>
                                <option value="in_progress">In Progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Semua Prioritas</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">
                                Ditemukan <strong>{tasks.total}</strong> pekerjaan
                            </span>
                            <div className="flex items-center space-x-2">
                                <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                                    <Filter className="w-3.5 h-3.5 mr-1" />
                                    Filter
                                </Button>
                                {(search || status || priority || categoryId || assetId) && (
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

            {/* Tasks Table */}
            <Card className="shadow-sm border-border/80">
                <CardContent className="p-0">
                    <Table className="min-w-[850px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-36">Kode Task</TableHead>
                                <TableHead>Judul & Deskripsi</TableHead>
                                <TableHead className="w-44">Kategori</TableHead>
                                <TableHead className="w-28">Prioritas</TableHead>
                                <TableHead className="w-28">Status</TableHead>
                                <TableHead className="w-32">Progres</TableHead>
                                <TableHead className="w-32">Target Selesai</TableHead>
                                <TableHead className="w-20 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.data.length > 0 ? (
                                tasks.data.map((task) => (
                                    <TableRow key={task.id} className="hover:bg-muted/40 transition-colors">
                                        <TableCell className="font-mono text-xs font-semibold text-primary">
                                            <Link href={route('tasks.show', task.id)} className="hover:underline">
                                                {task.task_code}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={route('tasks.show', task.id)}
                                                className="text-xs font-semibold text-foreground hover:text-primary block line-clamp-1"
                                            >
                                                {task.title}
                                            </Link>
                                            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                {task.description}
                                            </div>
                                            {task.assets && task.assets.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {task.assets.map((a) => (
                                                        <span
                                                            key={a.id}
                                                            className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono"
                                                        >
                                                            <Server className="w-2.5 h-2.5 mr-1 opacity-70" />
                                                            {a.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {task.category?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-[10px]">
                                                {task.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(task.status)} className="text-[10px]">
                                                {task.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                    <span>{task.progress_percent}%</span>
                                                </div>
                                                <Progress value={task.progress_percent} className="h-1.5" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {task.due_date ? (
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3 h-3 opacity-60" />
                                                    <span>{formatDate(task.due_date)}</span>
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('tasks.show', task.id)}>
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
                                        Tidak ada pekerjaan yang sesuai dengan kriteria filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Links */}
            {tasks.last_page > 1 && (
                <div className="flex justify-center items-center space-x-1 pt-2">
                    {tasks.links.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.url || '#'}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                link.active
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : !link.url
                                    ? 'text-muted-foreground opacity-40 cursor-not-allowed'
                                    : 'bg-card border border-border text-foreground hover:bg-muted'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
