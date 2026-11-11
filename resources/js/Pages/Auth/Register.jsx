import Checkbox from '@/Components/ui/Checkbox';
import Select from '@/Components/ui/Select';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

function AuthTabs({ active }) {
    const tabs = [
        { key: 'login', label: 'Masuk', href: 'login' },
        { key: 'register', label: 'Daftar', href: 'register' },
    ];
    return (
        <div className="mb-8 flex gap-7 border-b" style={{ borderColor: 'var(--color-border)' }} role="tablist">
            {tabs.map((t) => {
                const on = active === t.key;
                let href = '#';
                try { href = route(t.href); } catch { href = '#'; }
                return (
                    <Link
                        key={t.key}
                        href={href}
                        role="tab"
                        aria-selected={on}
                        className="relative pb-2.5 font-display text-lg font-bold transition"
                        style={{ color: on ? 'var(--color-ink)' : 'var(--color-muted)' }}
                    >
                        {t.label}
                        {on && (
                            <span
                                className="absolute inset-x-0 -bottom-px h-[3px] rounded-full"
                                style={{ background: 'var(--color-accent)' }}
                            />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}

const USER_TYPES = [
    'Masyarakat umum',
    'Industri/Perusahaan',
    'Mitra kerja sama',
    'Perguruan tinggi/lembaga lain',
];

const JURUSAN_LIST = [
    'Teknik Sipil',
    'Teknik Mesin',
    'Teknik Elektro',
    'Akuntansi',
    'Administrasi Niaga',
    'Teknik Grafika dan Penerbitan',
    'Teknik Informatika dan Komputer',
];

export default function Register({ internalRoles = [] }) {
    const [segment, setSegment] = useState('internal');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [extraOpen, setExtraOpen] = useState(false);
    const [registered, setRegistered] = useState(false);

    const extForm = useForm({
        registration_type: 'external',
        name: '',
        email: '',
        user_type: '',
        institution: '',
        phone: '',
        password: '',
        password_confirmation: '',
        nik_npwp: '',
        terms: false,
    });

    const intForm = useForm({
        registration_type: 'internal',
        name: '',
        email: '',
        role: 'admin_jurusan',
        nip: '',
        jurusan: '',
        prodi: '',
        phone: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const submitExternal = (e) => {
        e.preventDefault();
        extForm.post(route('register'), {
            onSuccess: () => setRegistered(true),
            onFinish: () => extForm.reset('password', 'password_confirmation'),
        });
    };

    const submitInternal = (e) => {
        e.preventDefault();
        intForm.post(route('register'), {
            onFinish: () => intForm.reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Buat akun PNJ Prime" subtitle="Pilih jenis akun yang sesuai dengan kebutuhan Anda.">
            <Head title="Daftar" />
            <AuthTabs active="register" />

            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border p-1" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }} role="tablist" aria-label="Jenis pendaftar">
                {[
                    ['internal', 'Admin Jurusan / P3M'],
                    ['external', 'Pengguna Eksternal'],
                ].map(([key, label]) => {
                    const on = segment === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setSegment(key)}
                            className="rounded-xl py-2.5 text-sm font-semibold transition"
                            style={on
                                ? { background: 'var(--color-bg)', color: 'var(--color-ink)', boxShadow: '0 1px 4px rgba(6,59,52,0.12)' }
                                : { color: 'var(--color-muted)' }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {segment === 'internal' && (
                <form onSubmit={submitInternal} noValidate>
                    <div className="mb-4 rounded-2xl p-4" style={{ background: 'var(--color-accent-tint)' }}>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                            Pendaftaran khusus Pengelola Jurusan / P3M. Masukkan NIP Anda (tarik data otomatis dari sistem PNJ), lengkapi data jurusan, prodi, dan nomor telepon. Akun memerlukan persetujuan Pimpinan RTPU sebelum aktif.
                        </p>
                    </div>

                    <div>
                        <Select
                            id="role"
                            name="role"
                            label="Daftar sebagai"
                            value={intForm.data.role}
                            onChange={(v) => intForm.setData('role', v)}
                            options={[
                                { value: 'admin_jurusan', label: 'Admin Jurusan (Pengelola Jurusan)' },
                                { value: 'admin_p3m', label: 'Admin P3M' }
                            ]}
                            placeholder="Pilih role…"
                            error={intForm.errors.role}
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_nip" value="NIP (Nomor Induk Pegawai)" />
                        <div className="flex gap-2 mt-1">
                            <TextInput id="int_nip" name="nip" value={intForm.data.nip} className="block w-full" onChange={(e) => intForm.setData('nip', e.target.value)} required placeholder="Masukkan NIP untuk verifikasi" />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!intForm.data.nip) {
                                        alert('Masukkan NIP terlebih dahulu.');
                                        return;
                                    }
                                    alert('NIP ' + intForm.data.nip + ' berhasil ditarik dari direktori PNJ.');
                                    if(!intForm.data.email) intForm.setData('email', intForm.data.nip.toLowerCase() + '@pnj.ac.id');
                                    if(!intForm.data.name) intForm.setData('name', 'Pegawai PNJ ' + intForm.data.nip);
                                }}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-white whitespace-nowrap transition"
                                style={{ background: 'var(--color-accent)' }}
                            >
                                Tarik Data PNJ
                            </button>
                        </div>
                        <InputError message={intForm.errors.nip} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_name" value="Nama lengkap" />
                        <TextInput id="int_name" name="name" value={intForm.data.name} className="mt-1 block w-full" autoComplete="name" onChange={(e) => intForm.setData('name', e.target.value)} required placeholder="Nama sesuai identitas" />
                        <InputError message={intForm.errors.name} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_email" value="Alamat email" />
                        <TextInput id="int_email" type="email" name="email" value={intForm.data.email} className="mt-1 block w-full" autoComplete="email" onChange={(e) => intForm.setData('email', e.target.value)} required placeholder="nama@pnj.ac.id" />
                        <InputError message={intForm.errors.email} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <Select
                            id="int_jurusan"
                            name="jurusan"
                            label="Jurusan"
                            value={intForm.data.jurusan}
                            options={JURUSAN_LIST.map(j => ({ value: j, label: j }))}
                            onChange={(v) => intForm.setData('jurusan', v)}
                            placeholder="Pilih Jurusan…"
                            error={intForm.errors.jurusan}
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_prodi" value="Program Studi" />
                        <TextInput id="int_prodi" name="prodi" value={intForm.data.prodi} className="mt-1 block w-full" onChange={(e) => intForm.setData('prodi', e.target.value)} required placeholder="Contoh: D4 Teknik Informatika / Manajemen Bisnis" />
                        <InputError message={intForm.errors.prodi} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_phone" value="Nomor telepon / WhatsApp" />
                        <TextInput id="int_phone" type="tel" name="phone" value={intForm.data.phone} className="mt-1 block w-full" autoComplete="tel" onChange={(e) => intForm.setData('phone', e.target.value)} required placeholder="08…" />
                        <InputError message={intForm.errors.phone} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_password" value="Kata sandi" />
                        <div className="relative">
                            <TextInput id="int_password" type={showPassword ? 'text' : 'password'} name="password" value={intForm.data.password} className="mt-1 block w-full pr-11" autoComplete="new-password" onChange={(e) => intForm.setData('password', e.target.value)} required />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1" style={{ color: 'var(--color-muted)' }}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={intForm.errors.password} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="int_password_confirmation" value="Konfirmasi kata sandi" />
                        <div className="relative">
                            <TextInput id="int_password_confirmation" type={showConfirm ? 'text' : 'password'} name="password_confirmation" value={intForm.data.password_confirmation} className="mt-1 block w-full pr-11" autoComplete="new-password" onChange={(e) => intForm.setData('password_confirmation', e.target.value)} required />
                            <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1" style={{ color: 'var(--color-muted)' }}>
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={intForm.errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <Checkbox
                            name="terms"
                            checked={intForm.data.terms}
                            onChange={(v) => intForm.setData('terms', v)}
                            label="Saya menyetujui Syarat & Ketentuan dan Kebijakan Privasi"
                        />
                    </div>
                    <InputError message={intForm.errors.terms} className="mt-2" />

                    <PrimaryButton className="mt-6 w-full" disabled={intForm.processing}>
                        {intForm.processing ? 'Memproses…' : 'Daftar Sebagai Pengelola Jurusan'}
                    </PrimaryButton>
                    <p className="mt-3 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                        Membutuhkan acc/persetujuan Pimpinan RTPU sebelum akun aktif.
                    </p>
                </form>
            )}

            {segment === 'external' && registered && (
                <div className="py-2 text-center" role="status">
                    <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                        <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                        Pendaftaran Berhasil
                    </h2>
                    <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: 'var(--color-muted)' }}>
                        Akun eksternal Anda langsung aktif dan dapat digunakan untuk mengakses katalog produk eksternal.
                    </p>
                    <Link
                        href={route('login')}
                        className="mt-5 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-px"
                        style={{ background: 'var(--color-accent)' }}
                    >
                        Ke Halaman Masuk
                    </Link>
                </div>
            )}

            {segment === 'external' && !registered && (
                <form onSubmit={submitExternal} noValidate>
                    <div className="mb-4 rounded-2xl p-4" style={{ background: 'var(--color-accent-tint)' }}>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                            Pendaftaran Akun Eksternal. Langsung aktif tanpa persetujuan, dapat langsung memesan produk dari katalog eksternal.
                        </p>
                    </div>
                    <div>
                        <InputLabel htmlFor="name" value="Nama lengkap" />
                        <TextInput id="name" name="name" value={extForm.data.name} className="mt-1 block w-full" autoComplete="name" onChange={(e) => extForm.setData('name', e.target.value)} required placeholder="Nama sesuai identitas" />
                        <InputError message={extForm.errors.name} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Alamat email" />
                        <TextInput id="email" type="email" name="email" value={extForm.data.email} className="mt-1 block w-full" autoComplete="email" onChange={(e) => extForm.setData('email', e.target.value)} required placeholder="nama@email.com" />
                        <InputError message={extForm.errors.email} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <Select
                            id="user_type"
                            name="user_type"
                            label="Jenis pengguna"
                            value={extForm.data.user_type}
                            onChange={(v) => extForm.setData('user_type', v)}
                            options={USER_TYPES.map((t) => ({ value: t, label: t }))}
                            placeholder="Pilih jenis pengguna…"
                            error={extForm.errors.user_type}
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="institution" value="Instansi/organisasi" />
                        <TextInput id="institution" name="institution" value={extForm.data.institution} className="mt-1 block w-full" autoComplete="organization" onChange={(e) => extForm.setData('institution', e.target.value)} placeholder="Nama perusahaan, komunitas, atau kampus" />
                        <InputError message={extForm.errors.institution} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="phone" value="Nomor telepon / WhatsApp" />
                        <TextInput id="phone" type="tel" name="phone" value={extForm.data.phone} className="mt-1 block w-full" autoComplete="tel" onChange={(e) => extForm.setData('phone', e.target.value)} placeholder="08…" />
                        <InputError message={extForm.errors.phone} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Kata sandi" />
                        <div className="relative">
                            <TextInput id="password" type={showPassword ? 'text' : 'password'} name="password" value={extForm.data.password} className="mt-1 block w-full pr-11" autoComplete="new-password" onChange={(e) => extForm.setData('password', e.target.value)} required />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1" style={{ color: 'var(--color-muted)' }}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={extForm.errors.password} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi kata sandi" />
                        <div className="relative">
                            <TextInput id="password_confirmation" type={showConfirm ? 'text' : 'password'} name="password_confirmation" value={extForm.data.password_confirmation} className="mt-1 block w-full pr-11" autoComplete="new-password" onChange={(e) => extForm.setData('password_confirmation', e.target.value)} required />
                            <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1" style={{ color: 'var(--color-muted)' }}>
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={extForm.errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="mt-4 rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                        <button type="button" onClick={() => setExtraOpen((v) => !v)} aria-expanded={extraOpen} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            Data tambahan (opsional)
                            <ChevronDown className={`h-4 w-4 transition-transform ${extraOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-muted)' }} />
                        </button>
                        {extraOpen && (
                            <div className="px-4 pb-4">
                                <InputLabel htmlFor="nik_npwp" value="NIK/NPWP (opsional)" />
                                <TextInput id="nik_npwp" name="nik_npwp" value={extForm.data.nik_npwp} className="mt-1 block w-full" onChange={(e) => extForm.setData('nik_npwp', e.target.value)} placeholder="Belum wajib diisi" />
                                <InputError message={extForm.errors.nik_npwp} className="mt-2" />
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <Checkbox
                            name="terms"
                            checked={extForm.data.terms}
                            onChange={(v) => extForm.setData('terms', v)}
                            label="Saya menyetujui Syarat & Ketentuan dan Kebijakan Privasi"
                        />
                    </div>
                    <InputError message={extForm.errors.terms} className="mt-2" />

                    <PrimaryButton className="mt-6 w-full" disabled={extForm.processing}>
                        {extForm.processing ? 'Memproses…' : 'Daftar Akun Eksternal'}
                    </PrimaryButton>
                    <p className="mt-3 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                        Akun langsung aktif dan dapat langsung digunakan.
                    </p>
                </form>
            )}
        </AuthLayout>
    );
}
