import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Server, Lock, LogIn, ShieldAlert } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <Head title="Masuk ke Sistem - DevOps Work Tracker" />

            <div className="w-full max-w-md space-y-6">
                {/* Brand header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-500/10 items-center justify-center p-2 border border-blue-500/20 shadow-md mb-2">
                        <ApplicationLogo className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        DevOps Work Tracker
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Platform Pelaporan & Pemantauan Progres Pekerjaan Infrastruktur
                    </p>
                </div>

                {status && (
                    <div className="p-3 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                        {status}
                    </div>
                )}

                {/* Executive Board Shortcut for Atasan/Management */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30 p-3.5 shadow-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <div>
                            <div className="text-xs font-bold text-blue-950 dark:text-blue-200">
                                Mode Pantau Atasan & Management
                            </div>
                            <div className="text-[11px] text-blue-700 dark:text-blue-300">
                                Pantau status & progres tanpa perlu login
                            </div>
                        </div>
                    </div>
                    <Link href={route('executive.board')}>
                        <Button size="sm" variant="outline" className="h-7 text-xs font-medium border-blue-300 bg-white dark:bg-slate-900 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100">
                            Buka Board &rarr;
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-lg border-border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-base font-semibold">Masuk ke Akun Anda</CardTitle>
                        <CardDescription className="text-xs">
                            Masukkan email dan kata sandi yang telah didaftarkan oleh Administrator
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={submit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs">Alamat Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@devops.internal"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs">Password</Label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            Lupa password?
                                        </Link>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                                <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                                    Ingat sesi masuk saya di perangkat ini
                                </Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full space-x-2 shadow-sm" disabled={processing}>
                                <LogIn className="w-4 h-4" />
                                <span>Masuk ke Dashboard</span>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Aplikasi Internal Resmi &bull; Akses Terbatas untuk Tim DevOps & Management</span>
                </div>
            </div>
        </div>
    );
}
