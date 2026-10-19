# UI Kit

Reusable, accessible form and layout primitives for PNJ Prime. Built on
[Tailwind CSS](https://tailwindcss.com) and
[Headless UI v2](https://headlessui.com) and styled with the app's design
tokens (`var(--color-*)` defined in `resources/css/app.css`).

## Purpose

One implementation of every control, so behaviour (keyboard, focus, ARIA,
disabled/error states), spacing, and colour are consistent across all pages.
Pages migrate away from hand-rolled `<select>`, `<input type="checkbox">`,
custom dropdowns, and bespoke modals to these components.

- Source: `resources/js/Components/ui/`
- Barrel: `resources/js/Components/ui/index.js`
- Playground (dev only): `resources/js/Pages/Dev/UiKit.jsx` → `/dev/ui-kit`

Import a single component from its sub-path, or many from the barrel:

```jsx
import Select from '@/Components/ui/Select';
// or
import { Select, Checkbox, Modal } from '@/Components/ui';
```

`ConfirmModal` and the button primitives live in
`resources/js/Components/ui.jsx` (the legacy shared file) and are imported
from `@/Components/ui`.

## Conventions

- **Controlled**: every control takes `value`/`checked` plus `onChange`.
  - Text-like inputs and textareas: `onChange(event)`.
  - `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Switch`, `Select`,
    `Combobox`, `MultiSelect`, `MoneyInput`, `NumberStepper`:
    `onChange(value)` — **not** an event.
- **Field semantics**: passing `label`, `hint`, or `error` (or nesting inside
  `<Field>`) renders the shared label/hint/error UI and wires
  `aria-invalid` + `aria-describedby`. Errors render with `role="alert"`.
- **`name`**: pass it to render a hidden input for native (non-Inertia)
  form posts. Inertia `useForm` does not need it.
- Native `input`, `textarea`, and their props pass through.

---

## Field

Shared label / hint / error wrapper. Descendant controls consume its context
via `useField()`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | — | Renders `<label htmlFor>`. |
| `hint` | `string` | — | Helper text below the control. |
| `error` | `string` | — | Renders a `role="alert"` error and sets invalid. |
| `required` | `boolean` | `false` | Adds an accent `*` marker. |
| `htmlFor` / `id` | `string` | generated | Control id. |
| `className` | `string` | — | Wrapper classes. |
| `children` | `ReactNode` | — | One control. |

```jsx
<Field label="Nama layanan" required hint="Muncul di katalog" error={errors.name}>
    <TextInput value={data.name} onChange={(e) => setData('name', e.target.value)} />
</Field>
```

---

## TextInput

Native `<input>` wrapped in `Field` semantics. Forwards a `ref`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` / `hint` / `error` / `required` | — | — | Same as `Field`; renders the wrapper when present. |
| `id` | `string` | generated | |
| `className` | `string` | — | |
| `...rest` | input props | — | `type`, `value`, `onChange(event)`, `placeholder`, … |

```jsx
<TextInput label="Email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
```

---

## Textarea

Native `<textarea>` wrapped in `Field` semantics. Forwards a `ref`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` / `hint` / `error` / `required` | — | — | Same as `Field`. |
| `rows` | `number` | `4` | |
| `...rest` | textarea props | — | `value`, `onChange(event)`, … |

```jsx
<Textarea label="Keperluan" rows={3} value={data.keperluan} onChange={(e) => setData('keperluan', e.target.value)} />
```

---

## Select

Single-choice dropdown (Headless UI `Listbox`). Use for short, known lists.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `any` | — | Must equal an option `value`. |
| `onChange` | `(value) => void` | — | Receives the option value. |
| `options` | `{ value, label, description?, disabled?, icon? }[]` | `[]` | |
| `label` / `hint` / `error` / `required` | — | — | Via `Field`. |
| `name` | `string` | — | Renders a hidden input. |
| `placeholder` | `string` | `'Pilih…'` | Shown when empty. |
| `disabled` | `boolean` | `false` | |
| `clearable` | `boolean` | `false` | Shows a clear (×) button. |
| `size` | `'sm' \| 'md'` | `'md'` | |
| `id` / `className` | `string` | — | |

```jsx
<Select
    label="Satuan"
    value={data.satuan}
    onChange={(v) => setData('satuan', v)}
    options={[{ value: 'flat', label: 'Flat' }, { value: 'per_hari', label: 'Per hari' }]}
    error={errors.satuan}
/>
```

---

## Combobox

Searchable single-choice select. Use for long lists or async/server search.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `any` | — | |
| `onChange` | `(value) => void` | — | |
| `options` | `{ value, label, description?, disabled? }[]` | `[]` | |
| `onSearch` | `(query) => void` | — | Enables async mode (debounced 250 ms); pair with `loading`. |
| `loading` | `boolean` | `false` | Shows "Memuat…". |
| `emptyLabel` | `string` | `'Tidak ditemukan'` | |
| `placeholder` | `string` | `'Cari…'` | |
| `label` / `hint` / `error` / `required` / `disabled` / `size` / `name` / `id` | — | — | |

```jsx
<Combobox label="Layanan" value={data.layanan} onChange={(v) => setData('layanan', v)}
    options={layananOptions} onSearch={(q) => fetchList(q)} loading={loading} />
```

---

## MultiSelect

Pick many values, rendered as removable chips.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `any[]` | — | |
| `onChange` | `(values[]) => void` | — | |
| `options` | `{ value, label, disabled? }[]` | `[]` | |
| `max` | `number` | — | Caps the number of selections. |
| `placeholder` / `emptyLabel` | `string` | `'Cari…'` / `'Tidak ditemukan'` | |
| `label` / `hint` / `error` / `required` / `disabled` / `size` / `name` / `id` | — | — | |

```jsx
<MultiSelect label="Tipe" value={data.tipe} onChange={(v) => setData('tipe', v)} options={tipeOptions} max={3} />
```

---

## Checkbox

Accessible checkbox. `onChange` receives a **boolean**. Pass `aria-label`
when there is no visible `label` (e.g. inside table cells).

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | |
| `onChange` | `(checked: boolean) => void` | — | |
| `label` / `description` | `string` | — | The component renders its own label — do not wrap it in `<label>`. |
| `indeterminate` | `boolean` | `false` | Mixed state. |
| `disabled` | `boolean` | `false` | |
| `error` | `string` | — | Rendered only when there is no `label`. |
| `name` / `value` / `id` / `aria-label` | — | — | |

```jsx
<Checkbox checked={data.aktif} onChange={(v) => setData('aktif', v)} label="Aktif" />
<Checkbox checked={row.selected} onChange={...} aria-label={`Pilih ${row.name}`} />
```

---

## CheckboxGroup

Fieldset of related checkboxes with optional "Pilih semua".

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `any[]` | `[]` | |
| `onChange` | `(values[]) => void` | — | |
| `options` | `{ value, label, description?, disabled? }[]` | `[]` | |
| `label` / `legend` | `string` | — | `legend` wins. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | |
| `selectAll` | `boolean` | `false` | Adds an indeterminate "Pilih semua". |
| `hint` / `error` / `disabled` / `id` / `className` | — | — | |

```jsx
<CheckboxGroup label="Aksi tersedia" value={data.aksi} onChange={(v) => setData('aksi', v)}
    options={[{ value: 'Lihat', label: 'Lihat' }, { value: 'Tambah', label: 'Tambah' }]} selectAll />
```

---

## RadioGroup

Single choice with two looks.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `any` | — | |
| `onChange` | `(value) => void` | — | |
| `options` | `{ value, label, description?, icon?, disabled? }[]` | `[]` | |
| `variant` | `'list' \| 'cards'` | `'list'` | `cards` shows large tiles. |
| `label` / `hint` / `error` / `disabled` / `name` / `id` / `className` | — | — | |

```jsx
<RadioGroup variant="cards" value={data.tipe} onChange={(v) => setData('tipe', v)}
    options={[{ value: 'jasa', label: 'Jasa', description: 'Layanan profesional', icon: <Wrench /> }]} />
```

---

## Switch

On/off toggle for `aktif`/`nonaktif`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | |
| `onChange` | `(checked: boolean) => void` | — | |
| `label` / `description` | `string` | — | |
| `disabled` / `error` / `name` / `id` / `className` | — | — | |

```jsx
<Switch checked={data.aktif} onChange={(v) => setData('aktif', v)} label="Aktif" />
```

---

## Menu

Action / user dropdown (Headless UI `Menu`, portal + `anchor`). The
`button` node is rendered inside the `MenuButton`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `button` | `ReactNode` | — | Content inside the trigger button. |
| `items` | `(Item \| { type: 'divider' })[]` | `[]` | See below. |
| `align` | `'start' \| 'end'` | `'end'` | Anchor side. |
| `className` / `buttonClassName` / `menuClassName` | `string` | — | |

`Item`: `{ key, label, icon?, onClick? }` or `{ key, label, icon?, href? }`.
Add `destructive` for danger styling and `disabled` to lock an item.

```jsx
<Menu
    button={<button className="…">Aksi</button>}
    items={[
        { key: 'edit', label: 'Ubah', icon: Pencil, onClick: () => edit(row) },
        { type: 'divider' },
        { key: 'del', label: 'Hapus', icon: Trash2, destructive: true, onClick: () => remove(row) },
    ]}
/>
```

---

## Modal

Dialog with focus trap, `Esc`, scroll lock, and a mobile full-height sheet.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | — | |
| `onClose` | `() => void` | — | Backdrop click, `Esc`, and close button. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | |
| `title` / `description` | `string` | — | Header. |
| `footer` | `ReactNode` | — | Right-aligned action row. |
| `dismissible` | `boolean` | `true` | When `false`, `Esc`/backdrop are ignored (use while processing). |
| `showClose` | `boolean` | `true` | Show the × button. |
| `children` | `ReactNode` | — | Body. |
| `className` / `panelClassName` | `string` | — | |

```jsx
<Modal open={open} onClose={close} size="xl" title="Ajukan Layanan"
    description="…" dismissible={!processing}
    footer={<><SecondaryButton onClick={close}>Batal</SecondaryButton><PrimaryButton>Kirim</PrimaryButton></>}>
    {body}
</Modal>
```

### ConfirmModal (`@/Components/ui`)

Thin preset built on `Modal` for confirm/destructive dialogs.

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | — |
| `title` / `desc` | `string` | — |
| `confirmLabel` | `string` | `'Ya, lanjutkan'` |
| `danger` | `boolean` | `false` |
| `processing` | `boolean` | `false` |
| `onConfirm` / `onClose` | `() => void` | — |
| `children` | `ReactNode` | — |

```jsx
<ConfirmModal open={del !== null} title={`Hapus "${del?.name}"?`} confirmLabel="Ya, hapus" danger
    onConfirm={remove} onClose={() => setDel(null)} />
```

---

## Tabs

Headless UI `TabGroup` wrapper. Controlled with `value`/`onChange`, or
uncontrolled from the first tab. `children` are panels, positionally matched.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tabs` | `{ key, label, icon? }[]` | `[]` | |
| `value` | `string` | first tab | Current `key`. |
| `onChange` | `(key) => void` | — | |
| `children` | `ReactNode \| ReactNode[]` | — | One panel per tab. |
| `className` / `panelClassName` | `string` | — | |

```jsx
<Tabs value={tab} onChange={setTab} tabs={[{ key: 'jasa', label: 'Jasa' }, { key: 'produk', label: 'Produk' }]}>
    <div>Panel jasa</div>
    <div>Panel produk</div>
</Tabs>
```

---

## Accordion (`Disclosure`)

Collapsible section.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` / `description` | `string` | — | Trigger content. |
| `defaultOpen` | `boolean` | `false` | |
| `children` | `ReactNode` | — | Panel content. |
| `className` / `panelClassName` | `string` | — | |

```jsx
<Accordion title="Riwayat & Pemantauan" defaultOpen>{rows}</Accordion>
```

---

## MoneyInput

Rupiah input. Displays `1.250.000` while storing an integer rupiah value (no
decimals, no floats).

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Integer rupiah. |
| `onChange` | `(number) => void` | — | Receives integer rupiah. |
| `label` / `hint` / `error` / `required` / `disabled` / `name` / `id` | — | — | |

```jsx
<MoneyInput label="Harga" value={data.harga} onChange={(v) => setData('harga', v)} />
```

---

## NumberStepper

Integer stepper with −/+ buttons and keyboard support.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | `0` | |
| `onChange` | `(number) => void` | — | |
| `min` / `max` | `number` | `0` / — | Clamped. |
| `step` | `number` | `1` | |
| `label` / `hint` / `error` / `required` / `disabled` / `id` / `className` | — | — | |

```jsx
<NumberStepper label="Jumlah" min={1} max={10} value={data.jumlah} onChange={(v) => setData('jumlah', v)} />
```

---

## When to use which

These controls overlap, so pick by **how many options there are**, whether
the user **needs to search**, and whether the choice is **one or many**.

| Situation | Use |
| --- | --- |
| Binary on/off setting ("Aktif", "Nonaktif") | **Switch** — the state is a property of the record, not a form answer. |
| Binary consent / acknowledgement ("Saya menyetujui…") | **Checkbox** (single) — a checkmark reads as "yes, I opt in". |
| 2–5 mutually exclusive, always-visible options | **RadioGroup** (`list`), or `variant="cards"` when each option needs an icon + explanation (e.g. choosing a service type). |
| 5–15 mutually exclusive options | **Select** — compact, keyboard-friendly, no search needed. |
| Many (> ~15) mutually exclusive options, or server-side search | **Combobox** — type-to-filter; supports async `onSearch`. |
| Several independent yes/no items that belong to one group | **CheckboxGroup** — optional "Pilih semua". |
| Choose **multiple** values from a list | **MultiSelect** — selected values shown as chips; supports `max`. |

Rules of thumb:

- About a handful of visible choices → radios/checkboxes (no hidden menu).
- Long or dynamic lists → `Combobox`/`MultiSelect`.
- Short, fixed lists → `Select`.
- One answer → `RadioGroup` / `Select` / `Combobox`; many answers →
  `CheckboxGroup` / `MultiSelect`.
- A setting that takes effect immediately → `Switch`; an answer you collect
  and submit → `Checkbox`.

### Native elements replaced

| Instead of | Use |
| --- | --- |
| `<select>…<option>` | `Select` (short lists) or `Combobox` (long/searchable) |
| `<input type="checkbox">` | `Checkbox` |
| `<input type="radio">` | `RadioGroup` |
| Hand-rolled dropdown menus | `Menu` |
| Hand-rolled dialogs / modals | `Modal` (or `ConfirmModal`) |
| Raw `<input>` / `<textarea>` | `TextInput` / `Textarea` (and `MoneyInput` / `NumberStepper` for those types) |
