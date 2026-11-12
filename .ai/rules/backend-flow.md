# Backend Flow PNJ PRIME (v3)

Sumber kebenaran: dokumen ini. Bila Activity Diagram, BPMN, atau FR lama
bertentangan, ikuti dokumen ini.

## Peran (hanya 6)
- Customer: hanya pengajuan miliknya sendiri
- Admin Pengelola: katalog dan pesanan produk unit sendiri (menyiapkan barang, mengirim)
- Admin RTPU: seluruh unit; memverifikasi pengajuan, katalog, pembayaran; menerbitkan invoice
- Pimpinan RTPU: seluruh unit; menyetujui katalog; memverifikasi akun pengelola
- Direktur: seluruh data, hanya lihat
- Super Admin: kelola akun, hak akses, dan fitur

Catatan peran: nama peran yang dipakai hanya Admin Pengelola (`admin_pengelola`).
Nama `admin_p3m` dan `admin_jurusan` tidak dipakai lagi. Admin Pengelola mengajukan
produk unggulan dan mengurus pesanan produk unit sendiri.

## Atribut item katalog
- Kategori: Produk, Jasa, Layanan
- Skema: Beli, Sewa
- Ketersediaan: Ready Stock atau Pre-Order, hanya untuk Produk dengan skema Beli

## Penentuan jalur (diturunkan, lalu disimpan sebagai snapshot di pesanan)
- Produk + Beli + Ready Stock: Jalur B (payment gateway)
- Produk + Beli + Pre-Order: Jalur A (invoice + transfer)
- Jasa atau Layanan + Beli (mis. pengujian lab): Jalur A, tanpa ongkir
- Sewa (Produk atau Layanan, mis. ruangan): Jalur C (invoice + transfer), tanpa ongkir
- Opsi kurir dan ongkir hanya untuk Produk + Beli

## Status katalog
Pending -> Menunggu Persetujuan Pimpinan | Ditolak
Menunggu Persetujuan Pimpinan -> Disetujui | Ditolak
Ditolak -> diperbaiki -> Pending
Item buatan Admin RTPU langsung Disetujui.
Perubahan harga, tarif, atau deskripsi pada item Disetujui memicu verifikasi ulang.

## Status akun Admin Pengelola
Menunggu Verifikasi -> Aktif | Ditolak (diputuskan Pimpinan RTPU)

## Status pesanan (tiga dimensi terpisah)
Persetujuan: Diajukan -> Disetujui | Ditolak
Pembayaran: Belum Ditagih -> Menunggu Pembayaran -> Menunggu Verifikasi -> Lunas | Ditolak
  (Jalur B: Menunggu Pembayaran -> Lunas | Kedaluwarsa)
Pemenuhan:
  - Produk, ambil di PNJ: Belum Diproses -> Diproses -> Siap Diambil -> Selesai
  - Produk, kurir: Belum Diproses -> Diproses -> Dikirim (nama kurir + no. resi) -> Selesai
  - Jasa atau Layanan Beli: Belum Diproses -> Diproses -> Selesai
  - Sewa: Terjadwal -> Berjalan (ruangan/layanan) atau Dipinjam (alat) -> Dikembalikan (alat saja) -> Selesai
  - Dibatalkan: pesanan Ditolak, Kedaluwarsa, atau dibatalkan sebelum Selesai

## Jalur A: Pre-order dan jasa/layanan beli (invoice, transfer bank)
1. Customer mengajukan; untuk produk memilih ambil di PNJ atau kurir.
2. Admin RTPU memeriksa data pembeli dan kelayakan; Disetujui atau Ditolak (+catatan).
3. Admin RTPU menerbitkan invoice (bayar penuh, tanpa DP); email ke Customer.
4. Customer transfer sesuai invoice dan mengunggah bukti.
5. Admin RTPU memeriksa bukti dan mutasi; Lunas atau Ditolak (unggah ulang).
6. Pemenuhan sesuai tabel status.

## Jalur B: Ready stock (payment gateway)
1. Customer mengajukan; memilih ambil di PNJ atau kurir; mengisi data pembeli.
2. Admin RTPU memeriksa nama, KTP/NIP, telepon, email, stok, dan harga;
   Disetujui atau Ditolak (+catatan). Stok dicadangkan saat Disetujui.
3. Customer membayar lewat gateway; transaksi gateway dibuat saat Customer menekan Bayar.
4. Webhook gateway mengubah pembayaran menjadi Lunas otomatis, lalu notifikasi ke
   Admin RTPU dan Admin Pengelola pemilik produk.
5. Admin Pengelola menyiapkan barang. Ambil di PNJ: Siap Diambil. Kurir: kurir dipesan,
   nama kurir dan no. resi diinput, status Dikirim; Customer menerima email invoice
   pembelian beserta no. resi.
6. Tidak dibayar sampai batas waktu: Kedaluwarsa, pesanan Dibatalkan, stok dikembalikan.
Pelacakan resi dilakukan manual oleh Customer di situs kurir.

## Jalur C: Sewa (invoice, transfer bank)
1. Customer memilih item sewa, mengisi periode (mulai-selesai) dan data penyewa
   (nama perusahaan, NPWP, KTP). Sistem menolak jadwal yang bentrok.
2. Admin RTPU memeriksa data penyewa dan kelayakan; Disetujui atau Ditolak (+catatan).
   Persetujuan sewa hanya oleh Admin RTPU, tanpa persetujuan Pimpinan RTPU.
   Jadwal dikunci saat Disetujui, dilepas bila tidak dibayar sampai batas waktu.
3. Admin RTPU menerbitkan invoice: tarif x durasi + pajak; email ke Customer.
4. Customer transfer dan unggah bukti; Admin RTPU verifikasi; Lunas.
5. Pemenuhan: Terjadwal -> Berjalan/Dipinjam -> Dikembalikan -> Selesai.

## Metode pemenuhan dan ongkir
- Pilihan: ambil di PNJ, atau kurir. Kurir hanya untuk Produk + Beli.
- Ongkir adalah biaya tambahan, hanya ada bila memilih kurir; dihitung dari PNJ
  ke alamat tujuan berdasarkan berat barang dan layanan kurir (RajaOngkir).
- Estimasi ongkir tampil saat pengajuan; nilai final dikunci saat Disetujui.
- Metode pemenuhan hanya boleh diubah saat status Diajukan.
- Satu pesanan berisi produk dari satu unit saja.

## Aturan bisnis
1. Total bayar = subtotal + pajak + ongkir. Pajak dihitung dari subtotal saja.
   Tarif pajak dari master pajak dan disimpan sebagai snapshot di invoice.
   Ongkir disimpan sebagai snapshot (nilai, kurir, layanan). Kolom uang bertipe integer rupiah.
2. Setiap perubahan status menulis riwayat dan audit log (pelaku + waktu)
   dalam satu transaksi.
3. Customer hanya boleh ubah atau batal pengajuan saat status Diajukan.
4. Penolakan (pengajuan, pembayaran, katalog, akun) wajib menyimpan catatan/alasan.
5. Login: SSO ID PNJ untuk internal, kredensial lokal untuk eksternal.
6. Registrasi menyimpan persetujuan data pribadi (UU No. 27 Tahun 2022).
7. Data KTP/NIP, NPWP, dan dokumen pembeli/penyewa privat; hanya pemilik data
   dan Admin RTPU yang dapat melihatnya.
8. Webhook gateway: verifikasi signature, idempoten, nominal dicocokkan dengan DB.
9. Admin Pengelola hanya boleh mengakses data dan pesanan unit sendiri,
   dijaga lewat Policy, bukan hanya middleware role.
10. Validasi atribut item di backend: ketersediaan wajib untuk Produk + Beli dan
    kosong untuk lainnya; stok wajib untuk Ready Stock; tarif dan satuan wajib
    untuk Sewa; berat wajib untuk produk yang dapat dikirim.
11. Tiap item punya kategori pajak; tarif diambil dari master pajak.
12. Jalur pembayaran disimpan sebagai snapshot di pesanan; perubahan atribut
    item tidak mengubah pesanan lama.

## Notifikasi
- Pengajuan masuk: Admin RTPU
- Disetujui / Ditolak: Customer
- Invoice terbit (Jalur A dan C): Customer (email)
- Bukti transfer diunggah: Admin RTPU
- Lunas (gateway): Admin RTPU dan Admin Pengelola pemilik produk
- Dikirim + resi: Customer (email invoice pembelian)
- Siap diambil: Customer

## Keputusan sementara (perlu konfirmasi)
- Selisih ongkir final dengan estimasi ditanggung PNJ; ongkir dikunci saat Disetujui.
- Batas waktu bayar dan pencadangan stok/jadwal dapat dikonfigurasi (default 24 jam).
- Tidak ada deposit dan denda keterlambatan sewa.
- Ruangan = Layanan + Sewa; Pengujian Lab = Jasa + Beli.

## Daftar fitur yang harus ada
Login, registrasi, katalog (lihat dan kelola, dengan kategori/skema/ketersediaan),
verifikasi katalog 2 tahap, pengajuan Jalur A/B/C, verifikasi pengajuan dan data
pembeli/penyewa, invoice + pajak, pembayaran transfer, pembayaran gateway,
verifikasi pembayaran, pilihan ambil/kurir + ongkir, pemenuhan pesanan
(siap diambil, kirim + resi), sewa (jadwal, bentrok, dipinjam, dikembalikan),
pemantauan per peran, kelola metode pembayaran, kelola akun, kelola hak akses,
verifikasi akun pengelola, master pajak, notifikasi, laporan/dashboard.
