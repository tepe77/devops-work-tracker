import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
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
import { ArrowLeft, Save } from 'lucide-react';

interface UsersEditProps extends PageProps {
    user: User;
}

export default function UsersEdit({ auth, user }: UsersEditProps) {
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
                            Ubah Pengguna: {user.name}
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title={`Ubah Pengguna ${user.name}`} />

            <div className="max-w-md mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Ubah Data Akun</CardTitle>
                            <CardDescription className="text-xs">
                                Kosongkan kolom password jika tidak ingin mengganti password pengguna
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs">Nama Lengkap *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs">Alamat Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs">Ganti Password (Opsional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Isi hanya jika ingin mereset password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="text-xs"
                                />
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-xs">Role Pengguna *</Label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value as any)}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    required
                                >
                                    <option value="viewer">Viewer (Atasan / Read-Only)</option>
                                    <option value="admin">Admin (DevOps Engineer / Full Access)</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2 border-t border-border">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                />
                                <Label htmlFor="is_active" className="text-xs cursor-pointer">
                                    Akun Aktif (Dapat Login)
                                </Label>
                            </div>
                            {errors.is_active && (
                                <p className="text-xs text-destructive">{errors.is_active}</p>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-border p-4 bg-muted/10">
                            <Link href={route('users.index')}>
                                <Button type="button" variant="outline" size="sm">
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" size="sm" disabled={processing} className="space-x-1.5 shadow-sm">
                                <Save className="w-4 h-4" />
                                <span>Simpan Perubahan</span>
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
