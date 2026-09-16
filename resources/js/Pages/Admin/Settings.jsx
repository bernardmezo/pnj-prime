import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function AdminSettings({ settings }) {
    const { data, setData, patch, processing } = useForm({
        settings: {
            ppn_enabled:            settings.ppn_enabled?.value ?? '0',
            ppn_rate:               settings.ppn_rate?.value ?? '',
            payment_bank_name:      settings.payment_bank_name?.value ?? '',
            payment_account_number: settings.payment_account_number?.value ?? '',
            payment_account_holder: settings.payment_account_holder?.value ?? '',
        },
    });

    function handleSubmit(e) {
        e.preventDefault();
        patch(route('admin.settings.update'));
    }

    function set(key, value) {
        setData('settings', { ...data.settings, [key]: value });
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Pengaturan Platform</h2>}>
            <Head title="Pengaturan — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* PPN Section */}
                        <div className="rounded-2xl bg-white shadow-card p-8">
                            <h3 className="text-base font-semibold text-prime-900 mb-1">Konfigurasi PPN</h3>
                            <p className="text-xs text-gray-500 mb-5">
                                Atur pengenaan pajak pertambahan nilai (PPN) pada seluruh transaksi platform.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        id="ppn_enabled"
                                        type="checkbox"
                                        checked={data.settings.ppn_enabled === '1'}
                                        onChange={(e) => set('ppn_enabled', e.target.checked ? '1' : '0')}
                                        className="h-4 w-4 rounded border-surface-border text-prime-600 focus:ring-prime-500"
                                    />
                                    <InputLabel htmlFor="ppn_enabled" value="Aktifkan PPN" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="ppn_rate" value="Tarif PPN (%)" />
                                    <TextInput
                                        id="ppn_rate"
                                        type="number"
                                        value={data.settings.ppn_rate}
                                        onChange={(e) => set('ppn_rate', e.target.value)}
                                        className="mt-1 w-32"
                                        placeholder="mis. 11"
                                        disabled={data.settings.ppn_enabled !== '1'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Section */}
                        <div className="rounded-2xl bg-white shadow-card p-8">
                            <h3 className="text-base font-semibold text-prime-900 mb-4">Rekening Pembayaran BLU PNJ</h3>
                            <p className="text-xs text-gray-500 mb-5">
                                Semua pembayaran masuk ke satu rekening BLU PNJ — tidak ada split payment.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="payment_bank_name" value="Nama Bank" />
                                    <TextInput
                                        id="payment_bank_name"
                                        value={data.settings.payment_bank_name}
                                        onChange={(e) => set('payment_bank_name', e.target.value)}
                                        className="mt-1 w-full"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="payment_account_number" value="Nomor Rekening" />
                                    <TextInput
                                        id="payment_account_number"
                                        value={data.settings.payment_account_number}
                                        onChange={(e) => set('payment_account_number', e.target.value)}
                                        className="mt-1 w-full font-mono"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="payment_account_holder" value="Nama Pemilik Rekening" />
                                    <TextInput
                                        id="payment_account_holder"
                                        value={data.settings.payment_account_holder}
                                        onChange={(e) => set('payment_account_holder', e.target.value)}
                                        className="mt-1 w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
