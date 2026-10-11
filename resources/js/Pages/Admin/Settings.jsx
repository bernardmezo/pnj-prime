import { Head, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader } from '@/Components/ui';

// TODO(backend): not in use-case diagram; remove admin.settings routes when backend migrates
export default function AdminSettings({ settings }) {
    const { data, setData, patch, processing, errors } = useForm({
        settings: {
            ppn_enabled: settings.ppn_enabled?.value ?? '0',
            ppn_rate: settings.ppn_rate?.value ?? '',
            payment_bank_name: settings.payment_bank_name?.value ?? '',
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
        <DashboardLayout title="Pengaturan Platform" breadcrumb="PNJ Prime / Pengaturan">
            <Head title="Pengaturan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Pengaturan Platform"
                    desc="Kelola pajak, rekening pembayaran resmi, dan konfigurasi platform lainnya."
                />
                <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5 pb-24">
                    <Card className="p-6 sm:p-8">
                        <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Konfigurasi PPN</h3>
                        <p className="mb-5 mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                            Atur pengenaan pajak pertambahan nilai (PPN) pada seluruh transaksi platform.
                        </p>
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="ppn_enabled"
                                    checked={data.settings.ppn_enabled === '1'}
                                    onChange={(e) => set('ppn_enabled', e.target.checked ? '1' : '0')}
                                />
                                <InputLabel htmlFor="ppn_enabled" value="Aktifkan PPN" className="mb-0" />
                            </div>
                            <div>
                                <InputLabel htmlFor="ppn_rate" value="Tarif PPN (%)" />
                                <TextInput
                                    id="ppn_rate" type="number" value={data.settings.ppn_rate}
                                    onChange={(e) => set('ppn_rate', e.target.value)}
                                    className="mt-1 w-32" placeholder="mis. 11"
                                    disabled={data.settings.ppn_enabled !== '1'}
                                />
                                <InputError message={errors['settings.ppn_rate']} className="mt-1" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 sm:p-8">
                        <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Rekening Pembayaran Resmi PNJ</h3>
                        <p className="mb-5 mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                            Semua pembayaran masuk ke satu rekening resmi PNJ, tidak ada split payment.
                        </p>
                        <div className="space-y-5">
                            <div>
                                <InputLabel htmlFor="payment_bank_name" value="Nama Bank" />
                                <TextInput id="payment_bank_name" value={data.settings.payment_bank_name} onChange={(e) => set('payment_bank_name', e.target.value)} className="mt-1 w-full" />
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_account_number" value="Nomor Rekening" />
                                <TextInput id="payment_account_number" value={data.settings.payment_account_number} onChange={(e) => set('payment_account_number', e.target.value)} className="mt-1 w-full font-mono" />
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_account_holder" value="Nama Pemilik Rekening" />
                                <TextInput id="payment_account_holder" value={data.settings.payment_account_holder} onChange={(e) => set('payment_account_holder', e.target.value)} className="mt-1 w-full" />
                            </div>
                        </div>
                    </Card>

                    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur lg:left-64" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="mx-auto flex max-w-3xl items-center justify-end px-4 py-3 sm:px-6">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
