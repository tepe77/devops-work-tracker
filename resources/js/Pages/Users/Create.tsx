import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
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
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { AlertCircle, ArrowLeft, KeyRound, Lock, Mail, Save, Shield, UserCircle, UserPlus } from 'lucide-react';

export default function UsersCreate({ auth }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.store'));
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
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Tambah Akun Pengguna Baru
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Pendaftaran publik dinonaktifkan; hanya Administrator yang dapat membuat akun
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tambah Pengguna - DevOps Work Tracker" />

            <div className="space-y-6 max-w-3xl mx-auto">
                {hasErrors && (
                    <Alert variant="destructive" className="text-xs shadow-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-semibold">Gagal Menambahkan Pengguna</AlertTitle>
                        <AlertDescription className="text-xs">
                            Silakan periksa kembali kolom isian yang bertanda merah di bawah.
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm border-border">
                        <CardHeader className="pb-4 border-b border-border/60">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <UserPlus className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        Data Akun Pengguna
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Buat akun Admin (DevOps Engineer) atau Viewer (Atasan / Executive)
                                    </CardDescription>
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
                                    placeholder="Contoh: Budi Santoso"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="text-xs h-9"
                                    required
                                    autoFocus
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
                                    placeholder="budi@perusahaan.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="text-xs h-9"
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
                                <Label htmlFor="password" className="text-xs font-medium flex items-center space-x-1.5">
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Password Awal * (Min. 8 Karakter)</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="text-xs h-9"
                                    placeholder="Minimal 8 karakter"
                                    required
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-xs font-medium flex items-center space-x-1.5">
                                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Role Pengguna *</span>
                                </Label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value as any)}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                    required
                                >
                                    <option value="viewer">Viewer (Atasan / Management - Akses Baca & Monitoring Laporan)</option>
                                    <option value="admin">Admin (DevOps Engineer - Akses Penuh Mutasi & Konfigurasi)</option>
                                </select>
                                {errors.role && (
                                    <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.role}</span>
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
                                <span>Buat Akun Pengguna</span>
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
