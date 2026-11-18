import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { UserCircle } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage<PageProps>().props.auth.user;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <UserCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="font-semibold text-lg text-foreground leading-tight">
                                Profil Pengguna: {user.name}
                            </h2>
                            <Badge variant={user.is_admin ? 'default' : 'secondary'} className="text-[10px]">
                                {user.is_admin ? 'DevOps Engineer (Admin)' : 'Management (Viewer)'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Kelola informasi profil akun pribadi, keamanan kredensial, dan preferensi akun Anda
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Profil Pengguna - DevOps Work Tracker" />

            <div className="space-y-6 max-w-3xl mx-auto">
                <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                />

                <UpdatePasswordForm />

                <DeleteUserForm />
            </div>
        </AuthenticatedLayout>
    );
}
