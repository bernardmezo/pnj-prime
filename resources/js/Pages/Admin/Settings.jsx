import { Head, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/ui/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader } from '@/Components/ui';

// TODO(backend): not in use-case diagram; remove admin.settings routes when backend migrates
export default function AdminSettings({ settings, audits = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        settings: {
            ppn_enabled: settings.ppn_enabled?.value ?? '0',
            ppn_rate: settings.ppn_rate?.value ?? '',
            ppn_threshold: settings.ppn_threshold?.value ?? '0',
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
                            <Checkbox
                                id="ppn_enabled"
                                checked={data.settings.ppn_enabled === '1'}
                                onChange={(v) => set('ppn_enabled', v ? '1' : '0')}
                                label="Aktifkan PPN"
                            />
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
                            <div>
                                <InputLabel htmlFor="ppn_threshold" value="Batas bawah PPN (Rp)" />
                                <TextInput
                                    id="ppn_threshold" type="number" min="0" value={data.settings.ppn_threshold}
                                    onChange={(e) => set('ppn_threshold', e.target.value)}
                                    className="mt-1 w-48" placeholder="0 = selalu diterapkan"
                                    disabled={data.settings.ppn_enabled !== '1'}
                                />
                                <InputError message={errors['settings.ppn_threshold']} className="mt-1" />
                                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                                    PPN hanya diterapkan bila subtotal DI ATAS nominal ini.
                                </p>
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

                <Card className="mx-auto mt-2 max-w-3xl p-6 sm:p-8">
                    <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Riwayat perubahan (20 terakhir)</h3>
                    <p className="mb-4 mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                        Hanya-baca. Setiap penyimpanan tercatat beserta pengubahnya.
                    </p>
                    {audits.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Belum ada perubahan tercatat.</p>
                    ) : (
                        <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {audits.map((a) => (
                                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                                    <span className="font-mono text-[13px]" style={{ color: 'var(--color-ink)' }}>{a.key}</span>
                                    <span className="font-mono text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                        {a.old_value ?? '∅'} → {a.new_value ?? '∅'}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                        {a.changed_by_name ?? 'sistem'} · {a.changed_at}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </FadeIn>
        </DashboardLayout>
    );
}
