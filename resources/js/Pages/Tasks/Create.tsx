import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Category, InfrastructureAsset, PageProps, Project } from '@/types';
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
import { Textarea } from '@/Components/ui/textarea';
import { DatePicker } from '@/Components/ui/date-picker';
import { ArrowLeft, Save, Server } from 'lucide-react';

interface TasksCreateProps extends PageProps {
    categories: Category[];
    projects: Project[];
    assets: InfrastructureAsset[];
}

export default function TasksCreate({ auth, categories, projects, assets }: TasksCreateProps) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category_id: categories.length > 0 ? categories[0].id.toString() : '',
        project_id: '',
        priority: 'medium',
        start_date: today,
        due_date: '',
        asset_ids: [] as number[],
    });

    const handleAssetToggle = (id: number) => {
        setData(
            'asset_ids',
            data.asset_ids.includes(id)
                ? data.asset_ids.filter((item) => item !== id)
                : [...data.asset_ids, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tasks.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Link href={route('tasks.index')}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Buat Pekerjaan DevOps Baru
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Kode task unik (DWT-YYYY-NNNN) akan di-generate otomatis oleh sistem
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Buat Task Baru - DevOps Work Tracker" />

            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Informasi Pekerjaan</CardTitle>
                            <CardDescription className="text-xs">
                                Masukkan rincian operasional, kategori, target penyelesaian, dan aset infrastruktur terkait
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs">
                                    Judul Pekerjaan <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="Contoh: Migrasi PostgreSQL Cluster ke Versi 16 & Hardening Firewall"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs">
                                    Deskripsi & Ruang Lingkup <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Jelaskan tujuan pekerjaan, langkah verifikasi, konfigurasi yang akan diubah, atau dampak teknis..."
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive">{errors.description}</p>
                                )}
                            </div>

                            {/* Category & Project Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="category_id" className="text-xs">
                                        Kategori Pekerjaan <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="category_id"
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        required
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && (
                                        <p className="text-xs text-destructive">{errors.category_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="project_id" className="text-xs">
                                        Project (Opsional)
                                    </Label>
                                    <select
                                        id="project_id"
                                        value={data.project_id}
                                        onChange={(e) => setData('project_id', e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">-- Tanpa Project Khusus --</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.project_id && (
                                        <p className="text-xs text-destructive">{errors.project_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Priority & Dates Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="priority" className="text-xs">
                                        Tingkat Prioritas <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="priority"
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        required
                                    >
                                        <option value="low">Rendah (Low)</option>
                                        <option value="medium">Sedang (Medium)</option>
                                        <option value="high">Tinggi (High)</option>
                                        <option value="critical">Kritis (Critical)</option>
                                    </select>
                                    {errors.priority && (
                                        <p className="text-xs text-destructive">{errors.priority}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date" className="text-xs">
                                        Tanggal Mulai <span className="text-red-500">*</span>
                                    </Label>
                                    <DatePicker
                                        id="start_date"
                                        value={data.start_date}
                                        onChange={(val) => setData('start_date', val)}
                                        placeholder="Pilih tanggal mulai"
                                        required
                                    />
                                    {errors.start_date && (
                                        <p className="text-xs text-destructive">{errors.start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="due_date" className="text-xs">
                                        Target Selesai (Due Date)
                                    </Label>
                                    <DatePicker
                                        id="due_date"
                                        value={data.due_date}
                                        onChange={(val) => setData('due_date', val)}
                                        placeholder="Pilih target selesai"
                                        min={data.start_date || undefined}
                                    />
                                    {errors.due_date && (
                                        <p className="text-xs text-destructive">{errors.due_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Infrastructure Assets Multi-Select */}
                            <div className="space-y-2 pt-2 border-t border-border">
                                <Label className="text-xs font-semibold flex items-center justify-between">
                                    <span>Tautkan Aset Infrastruktur Terkait</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                        {data.asset_ids.length} aset terpilih
                                    </span>
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                    Pilih VM, Server, Database, atau Service yang terdampak oleh pekerjaan ini:
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md bg-muted/20">
                                    {assets.map((asset) => {
                                        const isChecked = data.asset_ids.includes(asset.id);
                                        return (
                                            <div
                                                key={asset.id}
                                                onClick={() => handleAssetToggle(asset.id)}
                                                className={`flex items-center space-x-2 p-2 rounded cursor-pointer border text-xs transition-colors ${
                                                    isChecked
                                                        ? 'bg-primary/10 border-primary text-primary font-medium'
                                                        : 'bg-card border-border text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                                />
                                                <Server className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                                <div className="truncate">
                                                    <div className="truncate">{asset.name}</div>
                                                    <div className="text-[10px] text-muted-foreground capitalize">
                                                        {asset.environment}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-border p-4 bg-muted/10">
                            <Link href={route('tasks.index')}>
                                <Button type="button" variant="outline" size="sm">
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" size="sm" disabled={processing} className="space-x-1.5 shadow-sm">
                                <Save className="w-4 h-4" />
                                <span>Simpan Pekerjaan</span>
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
