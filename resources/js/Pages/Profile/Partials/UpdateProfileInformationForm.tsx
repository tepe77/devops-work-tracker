import { FormEventHandler } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { AlertCircle, CheckCircle2, Mail, Save, ShieldCheck, User } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage<PageProps>().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <Card className={`shadow-sm border-border ${className}`}>
            <CardHeader className="pb-4 border-b border-border/60">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-foreground">
                                Informasi Profil
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Perbarui informasi nama lengkap dan alamat email akun Anda
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={user.is_admin ? 'default' : 'secondary'} className="text-[10px]">
                        {user.is_admin ? 'Admin (DevOps)' : 'Viewer (Atasan)'}
                    </Badge>
                </div>
            </CardHeader>

            <form onSubmit={submit}>
                <CardContent className="space-y-4 pt-5">
                    {/* Error Notification Alert */}
                    {hasErrors && (
                        <Alert variant="destructive" className="text-xs shadow-xs">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-semibold">Gagal Memperbarui Profil</AlertTitle>
                            <AlertDescription className="text-xs">
                                Terdapat kesalahan pada data yang Anda masukkan. Silakan periksa kolom isian di bawah.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Notification Alert */}
                    {recentlySuccessful && (
                        <Alert variant="success" className="text-xs shadow-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle className="text-xs font-semibold">Berhasil Disimpan</AlertTitle>
                            <AlertDescription className="text-xs">
                                Informasi profil Anda telah berhasil diperbarui di sistem.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Nama Lengkap *</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            className="text-xs h-9"
                            placeholder="Nama Lengkap Anda"
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
                            required
                            autoComplete="username"
                            className="text-xs h-9"
                            placeholder="nama@perusahaan.com"
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.email}</span>
                            </p>
                        )}
                    </div>

                    {/* Role & Verification Badge Info */}
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center space-x-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                <span className="font-medium text-foreground">Hak Akses Sistem:</span>
                            </span>
                            <span className="font-semibold text-foreground">
                                {user.is_admin ? 'Administrator / Full Access' : 'Viewer / Read-Only'}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            {user.is_admin
                                ? 'Memiliki izin penuh untuk membuat/mengubah pekerjaan, mengelola aset infrastruktur, mengelola pengguna, dan mengubah konfigurasi.'
                                : 'Memiliki akses monitoring pekerjaan, aset infrastruktur, dan export laporan tanpa hak modifikasi.'}
                        </p>
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
                            <p className="text-amber-800 dark:text-amber-300">
                                Alamat email Anda belum terverifikasi.
                            </p>
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="text-xs font-medium text-amber-900 dark:text-amber-200 underline hover:text-amber-700"
                            >
                                Klik di sini untuk mengirim ulang email verifikasi.
                            </Link>

                            {status === 'verification-link-sent' && (
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                    Tautan verifikasi baru telah dikirimkan ke alamat email Anda.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex items-center justify-end border-t border-border/60 p-4 bg-muted/10">
                    <Button type="submit" size="sm" disabled={processing} className="space-x-1.5 shadow-xs">
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Informasi Profil</span>
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
