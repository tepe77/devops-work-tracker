import { FormEventHandler, useRef } from 'react';
import { useForm } from '@inertiajs/react';
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
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Save } from 'lucide-react';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <Card className={`shadow-sm border-border ${className}`}>
            <CardHeader className="pb-4 border-b border-border/60">
                <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                            Perbarui Password Akun
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Gunakan kombinasi minimal 8 karakter dengan huruf, angka, dan simbol untuk keamanan maksimal
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <form onSubmit={updatePassword}>
                <CardContent className="space-y-4 pt-5">
                    {/* Error Notification Alert */}
                    {hasErrors && (
                        <Alert variant="destructive" className="text-xs shadow-xs">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-semibold">Gagal Memperbarui Password</AlertTitle>
                            <AlertDescription className="text-xs">
                                Periksa kembali password lama atau konfirmasi password baru yang Anda masukkan.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success Notification Alert */}
                    {recentlySuccessful && (
                        <Alert variant="success" className="text-xs shadow-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle className="text-xs font-semibold">Password Berhasil Diperbarui</AlertTitle>
                            <AlertDescription className="text-xs">
                                Kredensial keamanan akun Anda telah berhasil diganti.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="current_password" className="text-xs font-medium flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Password Saat Ini *</span>
                        </Label>
                        <Input
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type="password"
                            autoComplete="current-password"
                            className="text-xs h-9"
                            placeholder="Masukkan password akun yang aktif"
                            required
                        />
                        {errors.current_password && (
                            <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.current_password}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-medium flex items-center space-x-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Password Baru *</span>
                        </Label>
                        <Input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            autoComplete="new-password"
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
                        <Label htmlFor="password_confirmation" className="text-xs font-medium flex items-center space-x-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Konfirmasi Password Baru *</span>
                        </Label>
                        <Input
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type="password"
                            autoComplete="new-password"
                            className="text-xs h-9"
                            placeholder="Ulangi password baru"
                            required
                        />
                        {errors.password_confirmation && (
                            <p className="text-xs text-destructive flex items-center space-x-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.password_confirmation}</span>
                            </p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex items-center justify-end border-t border-border/60 p-4 bg-muted/10">
                    <Button type="submit" size="sm" disabled={processing} className="space-x-1.5 shadow-xs">
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Password Baru</span>
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
