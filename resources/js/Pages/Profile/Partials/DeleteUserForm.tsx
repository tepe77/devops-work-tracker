import { FormEventHandler, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { AlertCircle, AlertTriangle, Lock, Trash2 } from 'lucide-react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <Card className={`shadow-sm border-destructive/30 bg-destructive/5 ${className}`}>
            <CardHeader className="pb-4 border-b border-destructive/20">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-destructive">
                                Zona Bahaya: Hapus Akun
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Tutup sesi dan hapus akun pengguna Anda dari aplikasi
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">
                        Hapus Permanen
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Menghapus akun akan menghapus kredensial Anda dari database dan menutup seluruh sesi login Anda secara <strong className="text-foreground">permanen</strong>. Anda tidak akan dapat memulihkan akun ini setelah konfirmasi.
                </p>

                <div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={confirmUserDeletion}
                        className="space-x-1.5 shadow-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Akun Saya</span>
                    </Button>
                </div>
            </CardContent>

            {/* Shadcn Modal Dialog for Password Confirmation */}
            <Dialog open={confirmingUserDeletion} onOpenChange={(isOpen) => !isOpen && closeModal()}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </div>
                            <Badge variant="destructive" className="text-[10px]">
                                Konfirmasi Hapus Permanen
                            </Badge>
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                            Apakah Anda yakin ingin menghapus akun ini?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            Tindakan ini bersifat <strong>permanen dan tidak dapat dibatalkan</strong>. Masukkan password akun Anda saat ini untuk mengonfirmasi bahwa Anda adalah pemilik sah akun.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={deleteUser} className="space-y-4 pt-2">
                        {errors.password && (
                            <Alert variant="destructive" className="text-xs py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">{errors.password}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="delete_password" className="text-xs font-medium flex items-center space-x-1.5">
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Password Akun Anda *</span>
                            </Label>
                            <Input
                                id="delete_password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="text-xs h-9"
                                placeholder="Masukkan password untuk konfirmasi"
                                autoFocus
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={closeModal}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                disabled={processing}
                                className="space-x-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Ya, Hapus Akun Permanen</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
