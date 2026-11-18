import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Lock,
    Mail,
    Save,
    Shield,
    Trash2,
    UserCheck,
    UserCircle,
    UserX,
} from 'lucide-react';

interface UsersEditProps extends PageProps {
    user: User;
}

export default function UsersEdit({ auth, user }: UsersEditProps) {
    const currentUser = auth.user;
    const isSelf = currentUser.id === user.id;
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        is_active: user.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    const handleDeleteUser = () => {
        router.delete(route('users.destroy', user.id));
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Link href={route('users.index')}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="font-semibold text-lg text-foreground leading-tight">
                                Ubah Pengguna: {user.name}
                            </h2>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">
                                {user.role === 'admin' ? 'Admin (DevOps)' : 'Viewer (Atasan)'}
                            </Badge>
                            <Badge variant={user.is_active ? 'success' : 'destructive'} className="text-[10px]">
                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Kelola data profil, hak akses role, status login, dan reset password pengguna ini
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Ubah Pengguna: ${user.name} - DevOps Work Tracker`} />

            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Notice if editing self */}
                {isSelf && (
                    <Alert variant="info" className="text-xs shadow-xs">
                        <UserCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-semibold">Mengedit Akun Sendiri</AlertTitle>
                        <AlertDescription className="text-xs">
                            Anda saat ini sedang memperbarui profil akun Anda sendiri yang sedang aktif login.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Validation Error Banner */}
                {hasErrors && (
                    <Alert variant="destructive" className="text-xs shadow-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-semibold">Gagal Memperbarui Data Pengguna</AlertTitle>
                        <AlertDescription className="text-xs">
                            Silakan periksa kembali kolom isian yang bertanda merah di bawah.
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card 1: Informasi Profil & Role */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="pb-4 border-b border-border/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <UserCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            Informasi Akun & Otorisasi
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Identitas pengguna dan peran wewenang dalam aplikasi
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-medium flex items-center space-x-1.5">
                                    <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Nama Lengkap *</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="text-xs h-9"
                                    placeholder="Nama Lengkap Pengguna"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.name}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium flex items-center space-x-1.5">
                                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Alamat Email *</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="text-xs h-9"
                                    placeholder="nama@perusahaan.com"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.email}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-xs font-medium flex items-center space-x-1.5">
                                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Role / Wewenang Pengguna *</span>
                                </Label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value as any)}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                    required
                                >
                                    <option value="admin">Admin (DevOps Engineer - Akses Penuh Mutasi & Konfigurasi)</option>
                                    <option value="viewer">Viewer (Atasan / Management - Akses Baca & Monitoring Laporan)</option>
                                </select>
                                {errors.role && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.role}</span>
                                    </p>
                                )}
                            </div>

                            {/* Status Akun Aktif / Nonaktif */}
                            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
                                <div className="flex items-center space-x-2.5">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <Label htmlFor="is_active" className="text-xs font-semibold cursor-pointer flex items-center space-x-1.5">
                                        {data.is_active ? (
                                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                                                <UserCheck className="w-3.5 h-3.5" />
                                                <span>Status: Akun Aktif (Dapat Login ke Sistem)</span>
                                            </span>
                                        ) : (
                                            <span className="text-destructive flex items-center space-x-1">
                                                <UserX className="w-3.5 h-3.5" />
                                                <span>Status: Akun Nonaktif (Akses Login Diblokir)</span>
                                            </span>
                                        )}
                                    </Label>
                                </div>
                                <p className="text-[11px] text-muted-foreground pl-6.5 leading-relaxed">
                                    Jika dinonaktifkan, akun ini tidak dapat login ke sistem. Seluruh riwayat pekerjaan dan catatan audit yang pernah dibuat oleh akun ini <strong>tetap tersimpan secara aman di database (diarsipkan)</strong>.
                                </p>
                                {errors.is_active && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1 pl-6.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.is_active}</span>
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Reset Password (Opsional) */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="pb-4 border-b border-border/60">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        Reset Password Pengguna
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Opsional: Isi kolom ini hanya jika Anda ingin menetapkan password baru untuk pengguna ini
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-medium flex items-center space-x-1.5">
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Password Baru (Opsional)</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Biarkan kosong jika tidak ingin merubah password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="text-xs h-9"
                                    autoComplete="new-password"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Minimal 8 karakter jika diisi. Pengguna dapat mengganti password ini kembali di halaman profil mereka.
                                </p>
                                {errors.password && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between border-t border-border/60 p-4 bg-muted/10">
                            <Link href={route('users.index')}>
                                <Button type="button" variant="outline" size="sm">
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" size="sm" disabled={processing} className="space-x-1.5 shadow-xs">
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan Perubahan Pengguna</span>
                            </Button>
                        </CardFooter>
                    </Card>
                </form>

                {/* Card 3: Zona Bahaya (Hapus Akun Pengguna) */}
                {!isSelf && (
                    <Card className="shadow-sm border-destructive/30 bg-destructive/5">
                        <CardHeader className="pb-4 border-b border-destructive/20">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center space-x-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-destructive">
                                            Zona Bahaya: Hapus Pengguna Ini
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Hapus akun pengguna {user.name} secara permanen dari sistem
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="destructive" className="text-[10px]">
                                    Hapus Permanen
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-5">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Menghapus akun akan memusnahkan data login pengguna ini secara <strong className="text-foreground">permanen</strong>. Jika pengguna memiliki riwayat tugas atau log audit penting, Anda disarankan untuk memilih opsi <strong className="text-foreground">Nonaktifkan Akun</strong> di atas daripada menghapusnya.
                            </p>
                            <div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setConfirmDeleteOpen(true)}
                                    className="space-x-1.5 shadow-xs"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus Akun {user.name}</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Confirmation Dialog for Permanent User Deletion */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleDeleteUser}
                title={`Hapus Akun Pengguna: ${user.name}?`}
                variant="destructive"
                badgeText="Hapus Permanen"
                description={
                    <span>
                        Akun <strong>{user.name}</strong> ({user.email}) akan <strong>dihapus secara permanen</strong> dari sistem. Tindakan ini tidak dapat dibatalkan. Pastikan akun tidak memiliki dependensi pekerjaan yang aktif.
                    </span>
                }
                confirmText="Ya, Hapus Akun Permanen"
            />
        </AuthenticatedLayout>
    );
}
