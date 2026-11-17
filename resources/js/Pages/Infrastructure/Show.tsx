import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { InfrastructureAsset, PageProps } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    ArrowLeft,
    CheckSquare,
    Edit3,
    ExternalLink,
    HardDrive,
    Server,
    Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface InfrastructureShowProps extends PageProps {
    asset: InfrastructureAsset;
}

export default function InfrastructureShow({ auth, asset }: InfrastructureShowProps) {
    const user = auth.user;

    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin mengarsipkan aset ${asset.name}?`)) {
            router.delete(route('infrastructure.destroy', asset.id));
        }
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Link href={route('infrastructure.index')}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={getEnvBadgeVariant(asset.environment)} className="text-[10px]">
                                {asset.environment}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(asset.status)} className="text-[10px]">
                                {asset.status}
                            </Badge>
                        </div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">{asset.name}</h2>
                    </div>
                </div>
            }
        >
            <Head title={`Aset: ${asset.name}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main: Related Tasks (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center space-x-2">
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                    <span>Pekerjaan Terkait Aset Ini ({asset.tasks?.length || 0})</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Daftar task yang memodifikasi, memelihara, atau melakukan perbaikan pada mesin ini
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="min-w-[600px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-28">Kode Task</TableHead>
                                        <TableHead>Judul</TableHead>
                                        <TableHead className="w-32">Kategori</TableHead>
                                        <TableHead className="w-28">Target</TableHead>
                                        <TableHead className="w-24">Status</TableHead>
                                        <TableHead className="w-16 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asset.tasks && asset.tasks.length > 0 ? (
                                        asset.tasks.map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-mono text-xs font-semibold text-primary">
                                                    <Link href={route('tasks.show', task.id)} className="hover:underline">
                                                        {task.task_code}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={route('tasks.show', task.id)}
                                                        className="text-xs font-medium text-foreground hover:underline block line-clamp-1"
                                                    >
                                                        {task.title}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {task.category?.name || '-'}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {task.due_date ? formatDate(task.due_date) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            task.status === 'completed'
                                                                ? 'success'
                                                                : task.status === 'in_progress'
                                                                ? 'info'
                                                                : task.status === 'blocked'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {task.status}
                                                    </Badge>
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
                                            <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                                                Belum ada task yang dikaitkan dengan aset ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Details Card (1 col) */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Spesifikasi Mesin</CardTitle>
                            {user?.is_admin && (
                                <div className="flex items-center space-x-1">
                                    <Link href={route('infrastructure.edit', asset.id)}>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-destructive"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3.5 text-xs">
                            <div className="flex justify-between border-b border-border pb-2.5">
                                <span className="text-muted-foreground">Tipe Aset:</span>
                                <span className="font-semibold text-foreground capitalize">
                                    {asset.asset_type.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex justify-between border-b border-border pb-2.5">
                                <span className="text-muted-foreground">Environment:</span>
                                <Badge variant={getEnvBadgeVariant(asset.environment)} className="text-[10px]">
                                    {asset.environment}
                                </Badge>
                            </div>

                            <div className="flex justify-between border-b border-border pb-2.5">
                                <span className="text-muted-foreground">IP Address:</span>
                                <span className="font-mono">{asset.ip_address || '-'}</span>
                            </div>

                            <div className="flex justify-between border-b border-border pb-2.5">
                                <span className="text-muted-foreground">Hostname:</span>
                                <span className="font-mono">{asset.hostname || '-'}</span>
                            </div>

                            <div className="flex justify-between border-b border-border pb-2.5">
                                <span className="text-muted-foreground">Sistem Operasi:</span>
                                <span>{asset.operating_system || '-'}</span>
                            </div>

                            <div className="flex justify-between border-b border-border pb-2.5">
                                <span className="text-muted-foreground">Status Operasional:</span>
                                <Badge variant={getStatusBadgeVariant(asset.status)} className="text-[10px]">
                                    {asset.status}
                                </Badge>
                            </div>

                            {asset.purpose && (
                                <div className="pt-1 space-y-1">
                                    <span className="text-muted-foreground font-medium">Tujuan / Fungsi:</span>
                                    <p className="text-foreground bg-muted/40 p-2 rounded">
                                        {asset.purpose}
                                    </p>
                                </div>
                            )}

                            {asset.description && (
                                <div className="pt-1 space-y-1">
                                    <span className="text-muted-foreground font-medium">Deskripsi / Spesifikasi:</span>
                                    <p className="text-muted-foreground whitespace-pre-line bg-muted/40 p-2 rounded">
                                        {asset.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
