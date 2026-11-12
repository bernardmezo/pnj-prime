# Agent Guidelines — PNJ PRIME

## Stack
- Laravel 13 + Inertia v2 + React 18 + Tailwind v3 + Vite 8 + PostgreSQL
- Dev server: `php artisan serve` (port 8000), `npm run dev` (Vite, port bisa 5174)

## Tugas
Upgrade tampilan agar premium dan selaras dengan logo PRIME. Struktur layout, sidebar, menu per role, route, props, logika backend, dan data TIDAK diubah. Jangan mengarang konten atau data.

## Batasan
- Hanya ubah visual (warna, spacing, shadow, typography, komponen UI).
- Tidak boleh mengubah struktur layout, routing, atau logika bisnis.
- Tidak boleh mengarang data atau konten baru.

## Git Workflow
- Commit LOKAL di branch `redesign-ui` boleh.
- DILARANG: push, merge, rebase, reset, stash, checkout branch lain, atau commit file rahasia (.env, credentials).
- Berhenti setelah setiap tugas dan tunggu persetujuan saya.

## Verifikasi
- Build frontend: `npx vite build` (wajib sebelum commit).
- Alat browser tidak bisa mengakses 127.0.0.1, jangan dipakai.
- Saya akan verifikasi visual di browser saya sendiri dan melaporkan hasilnya.

## Hemat Token
- Batasi output perintah terminal (gunakan `tail`, `head`, atau curl dengan status code saja).
- Baca hanya file yang relevan dengan tugas.
- Tulis ulang file utuh (write_file) jika perubahan banyak, bukan banyak patch kecil.
- Batch tool calls yang independen dalam satu turn.

## Design System
Lihat DESIGN.md untuk token warna, komponen, dan aturan desain yang sudah ada. Gunakan komponen yang ada, jangan membuat komponen baru kecuali diminta.

## Reporting
Setelah selesai, laporkan:
- File yang diubah.
- Halaman mana yang harus saya buka untuk verifikasi.
- Apa yang harus saya perhatikan secara visual.
