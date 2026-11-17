import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

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
        <section className={`space-y-4 ${className}`}>
            <header>
                <h2 className="text-base font-bold text-destructive">
                    Hapus Akun Pengguna
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                    Setelah akun Anda dihapus, semua sumber daya dan sesi data Anda akan ditutup secara permanen.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="text-xs">
                Hapus Akun Saya
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-base font-bold text-foreground">
                        Apakah Anda yakin ingin menghapus akun ini?
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Tindakan ini tidak dapat dibatalkan. Masukkan password Anda saat ini untuk mengonfirmasi penghapusan permanen.
                    </p>

                    <div className="mt-5">
                        <InputLabel
                            htmlFor="password"
                            value="Password Saat Ini"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4 text-xs"
                            isFocused
                            placeholder="Password Anda"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2 text-xs"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal} className="text-xs">
                            Batal
                        </SecondaryButton>

                        <DangerButton className="ms-2 text-xs" disabled={processing}>
                            Hapus Akun
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
