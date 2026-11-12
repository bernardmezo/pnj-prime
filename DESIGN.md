# PNJ PRIME Design System

Dokumentasi ini merangkum design system yang **SUDAH ADA** di kode. Jangan mengarang; lihat file asli untuk implementasi lengkap.

---

## Color Tokens (resources/css/app.css)

### Semantic Colors
```
--color-bg: #ffffff          (background utama)
--color-surface: #f8fafc     (surface terang)
--color-ink: #0f172a         (teks utama)
--color-muted: #5b6676       (teks sekunder)
--color-border: #e2e8f0      (border default)
```

### Brand Colors
```
--color-accent: #005f6e      (Deep Petroleum Teal, aksen utama)
--color-accent-hover: #004b57
--color-accent-tint: #e6f4f6 (tint terang)
--color-deep: #003d47        (teal gelap)
--color-deep-soft: #004c57
--color-gold: #ca9c34        (Warm Golden Amber, aksen sekunder)
--color-gold-deep: #a87d20
```

### Functional Colors
```
--color-danger: #d64545
--color-danger-hover: #b33636
--color-danger-tint: #fdecec
--color-success: #0e8a66
--color-success-tint: #e6f4f0
```

### Dark Panel (sidebar, auth)
```
--color-dark-bg: #003d47
--color-dark-text: #ffffff
--color-dark-muted: #b8d4d9
--color-dark-border: rgba(255,255,255,0.12)
--color-dark-hover: rgba(255,255,255,0.08)
```

### Gradient
```
--color-gradient-start: #ca9c34 (gold)
--color-gradient-end: #0e8a66   (teal-hijau)
```

---

## Shadows (CSS Variables)
```
--shadow-layered: berlapis premium untuk card hero
--shadow-card: card standar
--shadow-card-hover: card hover
--shadow-header: header dengan elevasi
--shadow-dropdown: menu dropdown
--shadow-hero: bayangan dramatis
```

---

## Border Radius (tailwind.config.js)
- `rounded-xl`: 0.875rem
- `rounded-2xl`: 1.25rem
- `rounded-card`: 1.375rem (untuk card premium)
- `rounded-full`: pill penuh (button, badge, tabs)

---

## Typography

### Font Family
- Body: `Inter` (400, 500, 600, 700)
- Display/Heading: `Sora` (600, 700, 800)
- CSS class `.font-display` untuk heading

### Landing Page
- `.landing-h1`: clamp(40px, 5.5vw, 64px), line-height 1.05, font-weight 700

---

## Components

### Button (resources/js/Components/ui.jsx)
- **PrimaryButton**: pill penuh, bg accent, hover lift (-1px), focus-visible ring, disabled state.
- **SecondaryButton**: pill dengan border, hover bg tint, focus ring.
- **DangerButton**: pill merah, hover lift.
- Semua button: `rounded-full`, `px-6 py-2.5`, `text-sm font-semibold`, `transition duration-150`.

### Badge (ui.jsx → StatusBadge)
- **Shape**: small rounded rectangle (`rounded-md`), bukan pill.
- **Size**: `px-2.5 py-1`, `text-[11px] font-semibold`.
- **Tone**: teal (aktif), gold (pending), danger (ditolak), neutral (lainnya).
- Fungsi `statusTone(status)` untuk mapping otomatis.

### Card (ui.jsx → Card)
- `rounded-3xl`, `border`, `bg-white`, `shadow-card`.
- Garis dekoratif horizontal di atas (gradasi gold, 2px height, opacity 0.6).
- Hover: `shadow-layered`.

### PageHeader (ui.jsx)
- `rounded-2xl`, `border`, `p-6 sm:p-7`, `shadow-card`.
- Garis dekoratif gradasi gold → teal → gold di atas (2px).
- Eyebrow: pill kecil dengan dot gold.
- Title: `font-display text-[28px] sm:text-3xl font-bold`.
- Desc: `text-sm text-muted`.
- Actions: flex wrap di kanan (desktop) atau bawah (mobile).

### Table (ui.jsx)
- Wrapped dalam Card.
- Thead: bg surface, border-b, `text-xs uppercase tracking-wide`.
- Td: `border-t`, `px-6 py-4`, `text-sm`.

### Modal (resources/js/Components/ui/Modal.jsx)
- `rounded-2xl`, `border`, `shadow-layered`.
- Garis dekoratif gradasi gold → teal di atas (1px height).
- Dismissible button: rounded-full, focus-ring.
- Footer: flex-col-reverse (mobile) → flex-row justify-end (desktop).

### Tabs (ui/Tabs.jsx)
- Wrapper: `rounded-full`, `border`, `bg-surface`, `p-1`.
- Tab aktif: `skew-x-[-6deg]`, `bg-accent`, `text-white`, `rounded-xl`.
- Teks di dalam tab aktif: `skew-x-[6deg]` (counter-skew agar tetap tegak).
- Tab inactive: `rounded-full`, `text-muted`, hover bg surface.

### EmptyState (ui.jsx)
- Card dengan icon di tengah, title, desc, dan optional action button.
- Icon: `h-12 w-12`, bg tint, rounded-xl.

### FlashToast (resources/js/Components/FlashToast.jsx)
- Fixed bottom-right, `rounded-2xl`, `shadow-layered`.
- Border kiri tebal (4px) dengan warna tone (success/error).
- Icon + message + close button dengan focus-ring.
- Auto-hide 5 detik.

### Form Fields (ui.jsx → Field, inputClass, inputStyleProps)
- Label: `text-sm font-medium`.
- Input: `rounded-xl`, `border`, `px-4 py-2.5`, `text-sm`.
- Focus: border accent + box-shadow tint.
- Error: `text-[13px]` dalam warna danger.

### FilterTabs / Pagination (ui.jsx)
- Pill buttons dengan hover lift, focus-ring, active state accent.

---

## Motif Dekoratif

### SpeedLines (resources/js/Components/SpeedLines.jsx)
Tiga garis horizontal yang memudar dari gold ke teal-hijau, terinspirasi garis logo PRIME.
- Size: `sm`, `md`, `lg`.
- Direction: `horizontal` (default) atau `vertical`.
- Tidak ada animasi.

### SwooshLine (resources/js/Components/SwooshLine.jsx)
Lengkungan abstrak tipis, terinspirasi garis keranjang di logo PRIME.
- Size: `sm`, `md`, `lg`.
- Opacity: 0–1 (default 0.15).
- Color: default `var(--color-gold)`.

---

## Pola Halaman

### Public Landing/Catalog
- Hero section dengan `.landing-h1`, gradient background, SpeedLines.
- CatalogCard: aspect-[4/3], hover lift, hover image scale-105, garis dekoratif gold→teal di atas saat hover.
- PublicFooter: gold underline pada link hover.
- PublicHeader: nav dengan underline grow-from-left saat hover/active.

### Auth Pages
- Dark panel (bg `--color-dark-bg`, text `--color-dark-text`).
- Logo white di atas panel.
- Form dalam card putih dengan bayangan berlapis.

### Dashboard Pages
- PageHeader di atas.
- StatCard dengan counter animasi (framer-motion, IntersectionObserver).
- Table dalam Card.
- FilterTabs untuk filter.
- Pagination di bawah table.

---

## Patterns & Effects

### Dot Pattern
- `.dot-pattern`: white dots (untuk dark bg).
- `.dot-pattern-dark`: teal dots (untuk light bg).

### Grid Pattern
- `.grid-pattern`: white grid lines (untuk dark bg).

### Catalog Card Image
- `.catalog-card-img`: hover scale-105, transition 0.5s ease-out-expo.

### Ribbon Sweep
- `.ribbon-sweep`: gold shimmer sweep animation (5s infinite).
- Disabled jika `prefers-reduced-motion: reduce`.

---

## Aturan Desain

1. **Teks UI Harus Tegak**: Jika wrapper menggunakan skew/transform, teks di dalamnya harus counter-skew agar terbaca.
2. **Gold Hanya Aksen**: Jangan gunakan gold sebagai warna dominan. Gold untuk highlight, badge, garis dekoratif.
3. **Tidak Ada Hex Hardcoded**: Gunakan CSS variables (var(--color-*)).
4. **Mobile-First**: Breakpoint minimum 390px.
5. **Prefers-Reduced-Motion**: Animasi dan transisi harus respek `@media (prefers-reduced-motion: reduce)`.
6. **Focus-Visible**: Semua elemen interaktif (button, link, input) harus punya focus-visible ring.
7. **Disabled State**: Button disabled harus `cursor-not-allowed`, `opacity-60`, dan hover tidak aktif.

---

## Animasi

- **Ease**: `cubic-bezier(0.22, 1, 0.36, 1)` (var(--ease-out-expo)).
- **Duration**: 150ms (micro-interactions), 200ms (transitions), 300–600ms (reveal animations).
- **Framer Motion**: `initial={{ opacity: 0, y: 24 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `transition={{ ease: EASE }}`.
- **Reduced Motion**: Gunakan `useReducedMotion()` hook, set duration 0 dan y 0 jika reduce.

---

## File Penting

- `resources/css/app.css` — CSS variables, custom classes.
- `tailwind.config.js` — Tailwind color/shadow/radius tokens.
- `resources/js/Components/ui.jsx` — Komponen dashboard utama.
- `resources/js/Components/ui/Modal.jsx` — Modal dialog.
- `resources/js/Components/ui/Tabs.jsx` — Tabs dengan skew.
- `resources/js/Components/Public/CatalogCard.jsx` — Card katalog publik.
- `resources/js/Components/Public/shared.jsx` — Utilities public.
- `resources/js/Components/SpeedLines.jsx` — Motif garis.
- `resources/js/Components/SwooshLine.jsx` — Motif lengkung.
- `resources/js/Components/FlashToast.jsx` — Toast notification.

---

Gunakan komponen yang ada. Jangan membuat komponen baru kecuali diminta.
