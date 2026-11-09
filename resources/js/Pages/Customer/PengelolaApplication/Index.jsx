import { Head, useForm } from '@inertiajs/react';
import { Building2, CheckCircle2, Send } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge, PrimaryButton } from '@/Components/ui';

export default function CustomerPengelolaApplication({ auth, applications = [], application = null }) {
    const list = Array.isArray(applications) ? applications : (applications?.data || []);
    const { data, setData, post, processing, errors } = useForm({
        unit_name: '',
        pic_name: auth?.user?.name || '',
        pic_phone: '',
        sk_document: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('customer.pengelola.store'));
    };

    return (
        <PublicLayout auth={auth}>
            <Head title="Pendaftaran Pengelola Unit · PNJ Prime" />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <FadeIn>
                    <PageHeader
                        eyebrow="Kemitraan & Riset"
                        title="Pendaftaran Admin Pengelola Unit"
                        desc="Ajukan akun unit riset / laboratorium untuk mengelola dan mempublikasikan katalog produk inovasi PNJ."
                    />

                    {list.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-slate-700 mb-3">Status Permohonan Anda</h2>
                            <div className="space-y-3">
                                {list.map((app) => (
                                    <Card key={app.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{app.unit_name}</p>
                                            <p className="text-xs text-slate-500">PIC: {app.pic_name} ({app.pic_phone || app.phone})</p>
                                        </div>
                                        <StatusBadge status={app.status} />
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-amber-500" />
                            Formulir Pendaftaran Pengelola
                        </h2>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nama Unit / Jurusan / Laboratorium
                                </label>
                                <input
                                    type="text"
                                    value={data.unit_name}
                                    onChange={(e) => setData('unit_name', e.target.value)}
                                    placeholder="Contoh: Lab Robotika & Otomasi Teknik Elektro"
                                    className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                    required
                                />
                                {errors.unit_name && <p className="text-xs text-red-500 mt-1">{errors.unit_name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nama PIC / Penanggung Jawab
                                    </label>
                                    <input
                                        type="text"
                                        value={data.pic_name}
                                        onChange={(e) => setData('pic_name', e.target.value)}
                                        className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                        required
                                    />
                                    {errors.pic_name && <p className="text-xs text-red-500 mt-1">{errors.pic_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nomor Telepon / WhatsApp
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.pic_phone}
                                        onChange={(e) => setData('pic_phone', e.target.value)}
                                        placeholder="0812xxxxxxxx"
                                        className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                        required
                                    />
                                    {errors.pic_phone && <p className="text-xs text-red-500 mt-1">{errors.pic_phone}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Unggah Dokumen SK / Surat Tugas (PDF, Max 10MB)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setData('sk_document', e.target.files[0])}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                    required
                                />
                                {errors.sk_document && <p className="text-xs text-red-500 mt-1">{errors.sk_document}</p>}
                            </div>

                            <div className="pt-2">
                                <PrimaryButton disabled={processing} className="w-full justify-center">
                                    <Send className="w-4 h-4 mr-1.5" />
                                    Kirim Permohonan Pengelola
                                </PrimaryButton>
                            </div>
                        </form>
                    </Card>
                </FadeIn>
            </div>
        </PublicLayout>
    );
}
