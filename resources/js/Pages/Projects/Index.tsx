import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Project } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { FolderKanban, PlusCircle } from 'lucide-react';

interface ProjectsIndexProps extends PageProps {
    projects: {
        data: Project[];
        total: number;
    };
}

export default function ProjectsIndex({ auth, projects }: ProjectsIndexProps) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        description: '',
        status: 'active',
        start_date: '',
        due_date: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2">
                    <FolderKanban className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Manajemen Projects
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Pengelompokan inisiatif besar atau milestone transformasi infrastruktur
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Projects - DevOps Work Tracker" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Projects (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Daftar Project Terdaftar</CardTitle>
                            <CardDescription className="text-xs">
                                Terdapat {projects.total} project operasional
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="min-w-[500px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-48">Nama Project</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead className="w-24 text-center">Jumlah Task</TableHead>
                                        <TableHead className="w-24">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.data.map((proj) => (
                                        <TableRow key={proj.id}>
                                            <TableCell className="font-semibold text-xs text-foreground">
                                                {proj.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {proj.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-xs">
                                                {proj.tasks_count || 0}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={proj.status === 'active' ? 'success' : 'secondary'}
                                                    className="text-[10px]"
                                                >
                                                    {proj.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Project Form (1 col) */}
                <div>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center space-x-1.5">
                                <PlusCircle className="w-4 h-4 text-primary" />
                                <span>Tambah Project Baru</span>
                            </CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-3.5">
                                <div className="space-y-1">
                                    <Label className="text-xs">Nama Project *</Label>
                                    <Input
                                        placeholder="Contoh: Migrasi Cloud AWS 2026"
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
                                        placeholder="Target dan tujuan inisiatif project..."
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Status</Label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as any)}
                                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                    >
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Mulai</Label>
                                        <Input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Target</Label>
                                        <Input
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" size="sm" disabled={processing} className="w-full">
                                    Simpan Project
                                </Button>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
