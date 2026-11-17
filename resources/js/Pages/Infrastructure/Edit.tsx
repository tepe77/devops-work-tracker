import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { InfrastructureAsset, PageProps } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';

interface InfrastructureEditProps extends PageProps {
    asset: InfrastructureAsset;
}

export default function InfrastructureEdit({ auth, asset }: InfrastructureEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: asset.name,
        asset_type: asset.asset_type,
        environment: asset.environment,
        hostname: asset.hostname || '',
        ip_address: asset.ip_address || '',
        operating_system: asset.operating_system || '',
        purpose: asset.purpose || '',
        description: asset.description || '',
        status: asset.status,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('infrastructure.update', asset.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Link href={route('infrastructure.show', asset.id)}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Ubah Aset: {asset.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Perbarui identitas server atau status operasional aset
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Ubah Aset ${asset.name}`} />

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Formulir Pembaruan Aset</CardTitle>
                            <CardDescription className="text-xs">
                                Perubahan data aset akan dicatat ke dalam audit log
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs">
                                    Nama Aset <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="text-xs"
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="asset_type" className="text-xs">
                                        Tipe Aset <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="asset_type"
                                        value={data.asset_type}
                                        onChange={(e) => setData('asset_type', e.target.value as any)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        required
                                    >
                                        <option value="virtual_machine">Virtual Machine</option>
                                        <option value="physical_server">Physical Server</option>
                                        <option value="database">Database</option>
                                        <option value="container_host">Container Host / K8s</option>
                                        <option value="application_service">Application Service</option>
                                        <option value="network">Network</option>
                                        <option value="storage">Storage</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="environment" className="text-xs">
                                        Environment <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="environment"
                                        value={data.environment}
                                        onChange={(e) => setData('environment', e.target.value as any)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        required
                                    >
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                        <option value="disaster_recovery">Disaster Recovery (DR)</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="hostname" className="text-xs">Hostname</Label>
                                    <Input
                                        id="hostname"
                                        value={data.hostname}
                                        onChange={(e) => setData('hostname', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="ip_address" className="text-xs">IP Address</Label>
                                    <Input
                                        id="ip_address"
                                        value={data.ip_address}
                                        onChange={(e) => setData('ip_address', e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="operating_system" className="text-xs">Sistem Operasi</Label>
                                    <Input
                                        id="operating_system"
                                        value={data.operating_system}
                                        onChange={(e) => setData('operating_system', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-xs">Status Operasional</Label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as any)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="active">Active (Aktif)</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="retired">Retired</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="purpose" className="text-xs">Tujuan / Fungsi</Label>
                                <Input
                                    id="purpose"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs">Catatan Tambahan</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-border p-4 bg-muted/10">
                            <Link href={route('infrastructure.show', asset.id)}>
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
