import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Card, CardContent } from '@/Components/ui/card';
import { UserCircle } from 'lucide-react';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2">
                    <UserCircle className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="font-semibold text-lg text-foreground leading-tight">
                            Profil Pengguna
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Kelola informasi akun pribadi dan kredensial keamanan Anda
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Profil Pengguna - DevOps Work Tracker" />

            <div className="space-y-6 max-w-4xl">
                <Card className="shadow-xs">
                    <CardContent className="p-6">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </CardContent>
                </Card>

                <Card className="shadow-xs">
                    <CardContent className="p-6">
                        <UpdatePasswordForm className="max-w-xl" />
                    </CardContent>
                </Card>

                <Card className="shadow-xs border-destructive/20">
                    <CardContent className="p-6">
                        <DeleteUserForm className="max-w-xl" />
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
