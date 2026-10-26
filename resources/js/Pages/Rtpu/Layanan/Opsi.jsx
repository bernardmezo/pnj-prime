import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, PageHeader, PrimaryButton, Table } from '@/Components/ui';

export default function RtpuLayananOpsi({ auth, product, opsi = [] }) {
    return (
        <DashboardLayout auth={auth}>
            <Head title={`Kelola Opsi · ${product.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('rtpu.layanan')}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Layanan
                    </Link>
                </div>

                <PageHeader
                    title={`Kelola Opsi: ${product.name}`}
                    subtitle={`Tipe: ${product.type || 'Layanan'} · Atur opsi termasuk dan tambahan untuk layanan ini.`}
                />

                <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-base font-semibold">Daftar Opsi</h3>
                    </div>

                    <div className="divide-y divide-[var(--color-border)]">
                        {opsi.length === 0 ? (
                            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                                Belum ada opsi untuk layanan ini.
                            </p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b text-xs text-[var(--color-muted)]">
                                        <th className="py-2.5">Nama</th>
                                        <th className="py-2.5">Jenis</th>
                                        <th className="py-2.5">Harga</th>
                                        <th className="py-2.5">Satuan</th>
                                        <th className="py-2.5">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opsi.map((item) => (
                                        <tr key={item.id} className="border-b last:border-b-0">
                                            <td className="py-3 font-medium">{item.nama}</td>
                                            <td className="py-3 capitalize">{item.jenis}</td>
                                            <td className="py-3">
                                                {item.jenis === 'termasuk' ? 'Termasuk' : `Rp ${Number(item.harga).toLocaleString('id-ID')}`}
                                            </td>
                                            <td className="py-3">{item.satuan}</td>
                                            <td className="py-3">{item.aktif ? 'Aktif' : 'Nonaktif'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
