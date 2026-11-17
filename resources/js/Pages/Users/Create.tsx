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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

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
                            Pendaftaran publik dimatikan; hanya Admin yang dapat membuat akun
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tambah Pengguna" />

            <div className="max-w-md mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Data Akun</CardTitle>
                            <CardDescription className="text-xs">
                                Buat akun Admin atau Viewer untuk atasan / management
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs">Nama Lengkap *</Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Budi Santoso"
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
                                    placeholder="budi@devops.internal"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs">Password * (Min. 8 Karakter)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="text-xs"
                                    required
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
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-border p-4 bg-muted/10">
                            <Link href={route('users.index')}>
                                <Button type="button" variant="outline" size="sm">
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" size="sm" disabled={processing} className="space-x-1.5 shadow-sm">
                                <Save className="w-4 h-4" />
                                <span>Buat Akun</span>
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
