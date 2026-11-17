import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category, PageProps } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Tag } from 'lucide-react';

interface CategoriesIndexProps extends PageProps {
    categories: {
        data: Category[];
        total: number;
    };
}

export default function CategoriesIndex({ auth, categories }: CategoriesIndexProps) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('categories.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Kategori Pekerjaan DevOps
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Kelola kategori pekerjaan untuk standarisasi klasifikasi dan pelaporan
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Kategori Pekerjaan - DevOps Work Tracker" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Categories (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Daftar Kategori Terdaftar</CardTitle>
                            <CardDescription className="text-xs">
                                Terdapat {categories.total} kategori yang digunakan dalam sistem
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="min-w-[500px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-48">Nama Kategori</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead className="w-24 text-center">Jumlah Task</TableHead>
                                        <TableHead className="w-24">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.data.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-semibold text-xs text-foreground">
                                                {cat.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {cat.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-xs">
                                                {cat.tasks_count || 0}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={cat.is_active ? 'success' : 'outline'} className="text-[10px]">
                                                    {cat.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Category Form (1 col) */}
                <div>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center space-x-1.5">
                                <PlusCircle className="w-4 h-4 text-primary" />
                                <span>Tambah Kategori Baru</span>
                            </CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-3.5">
                                <div className="space-y-1">
                                    <Label className="text-xs">Nama Kategori *</Label>
                                    <Input
                                        placeholder="Contoh: Kubernetes Cluster Management"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Deskripsi</Label>
                                    <Textarea
                                        placeholder="Tuliskan cakupan pekerjaan kategori ini..."
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <Button type="submit" size="sm" disabled={processing} className="w-full">
                                    Simpan Kategori
                                </Button>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
