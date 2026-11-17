import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
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
import { Badge } from '@/Components/ui/badge';
import { Edit3, PlusCircle, Trash2, UserPlus, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UsersIndexProps extends PageProps {
    users: {
        data: User[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
}

export default function UsersIndex({ auth, users }: UsersIndexProps) {
    const currentUser = auth.user;

    const handleDelete = (userToDelete: User) => {
        if (confirm(`Apakah Anda yakin ingin menghapus akun ${userToDelete.name}?`)) {
            router.delete(route('users.destroy', userToDelete.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Pengguna - DevOps Work Tracker" />

            {/* Dedicated Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Kelola akun Admin (DevOps Engineer) dan akun Viewer (Atasan / Management)
                    </p>
                </div>
                <Link href={route('users.create')}>
                    <Button size="sm" className="space-x-1.5 shadow-sm">
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah Pengguna</span>
                    </Button>
                </Link>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <Table className="min-w-[650px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-56">Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-36">Role</TableHead>
                                <TableHead className="w-32">Status Akun</TableHead>
                                <TableHead className="w-36">Dibuat Pada</TableHead>
                                <TableHead className="w-24 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-semibold text-xs text-foreground">
                                        {u.name}
                                        {u.id === currentUser.id && (
                                            <span className="ml-2 text-[10px] text-primary font-normal">(Anda)</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                        {u.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={u.role === 'admin' ? 'default' : 'secondary'}
                                            className="text-[10px]"
                                        >
                                            {u.role === 'admin' ? 'Admin' : 'Viewer'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={u.is_active ? 'success' : 'destructive'}
                                            className="text-[10px]"
                                        >
                                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDate(u.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                            <Link href={route('users.edit', u.id)}>
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                                    <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Button>
                                            </Link>
                                            {u.id !== currentUser.id && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-destructive"
                                                    onClick={() => handleDelete(u)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
