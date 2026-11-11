import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# Import structured data
sys.path.append(os.path.dirname(__file__))
from sdd_data import (
    TEAM_MEMBERS,
    REVISION_HISTORY,
    PROJECT_CONSTRAINTS,
    ESTIMATES_DATA,
    TRACEABILITY_MATRIX,
    DATA_DICTIONARY,
    GLOSSARY_ITEMS
)

TEMPLATE_PATH = r"C:\Users\Zaldi\Downloads\3. Dokumen Desain - Software Design Document.docx"
OUTPUT_PATH = r"C:\Users\Zaldi\Downloads\SDD_PNJ_PRIME_Kelompok_Suka_Suka.docx"
WORKSPACE_OUTPUT = r"C:\Users\Zaldi\OneDrive\Documents\MY project\pnj-prime\docs\SDD_PNJ_PRIME_Kelompok_Suka_Suka.docx"

# Color constants
COLOR_TEAL = RGBColor(0x00, 0x5F, 0x6E)
COLOR_DARK_TEAL = RGBColor(0x00, 0x3D, 0x47)
COLOR_GOLD = RGBColor(0xCA, 0x9C, 0x34)
COLOR_TEXT_MAIN = RGBColor(0x2D, 0x37, 0x48)
COLOR_TEXT_MUTED = RGBColor(0x64, 0x74, 0x8B)

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, hex_color="CBD5E1"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')  # 0.5 pt
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), hex_color)
        tblBorders.append(border)
    insideV = OxmlElement('w:insideV')
    insideV.set(qn('w:val'), 'none')
    tblBorders.append(insideV)
    tblPr.append(tblBorders)

def style_table(table, col_widths=None, header_bg="005F6E", header_color="FFFFFF", zebra=True):
    set_table_borders(table)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(table.rows):
        is_header = (r_idx == 0)
        bg = header_bg if is_header else ("F8FAFC" if (zebra and r_idx % 2 == 1) else "FFFFFF")
        for c_idx, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
            for p in cell.paragraphs:
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_before = Pt(1.5)
                p.paragraph_format.space_after = Pt(1.5)
                for run in p.runs:
                    run.font.name = 'Arial'
                    run.font.size = Pt(9.0 if not is_header else 9.5)
                    if is_header:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor.from_string(header_color)
                    else:
                        run.font.color.rgb = COLOR_TEXT_MAIN

def add_p(doc, text="", style='Normal', space_before=0, space_after=4, bold=False, italic=False, color=None, font_size=10.0, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph(style=style)
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = 'Arial'
        run.font.size = Pt(font_size)
        if color:
            run.font.color.rgb = color
    return p

def add_bullet(doc, text="", bold_prefix="", space_after=3):
    p = doc.add_paragraph(style='Normal')
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    run_bullet = p.add_run("•  ")
    run_bullet.font.name = 'Arial'
    run_bullet.font.size = Pt(9.5)
    run_bullet.font.color.rgb = COLOR_TEAL
    run_bullet.bold = True
    if bold_prefix:
        run_p = p.add_run(bold_prefix)
        run_p.font.name = 'Arial'
        run_p.font.size = Pt(9.5)
        run_p.bold = True
        run_p.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    if text:
        run_t = p.add_run(text)
        run_t.font.name = 'Arial'
        run_t.font.size = Pt(9.5)
        run_t.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    return p

def add_heading_1(doc, text):
    p = doc.add_paragraph(style='Heading 1')
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(13.5)
    run.bold = True
    run.font.color.rgb = COLOR_TEAL
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph(style='Heading 2')
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(11.5)
    run.bold = True
    run.font.color.rgb = COLOR_DARK_TEAL
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph(style='Heading 3')
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(10.0)
    run.bold = True
    run.font.color.rgb = COLOR_GOLD
    return p

def add_callout(doc, text, title="Catatan Teknis / Kebijakan Arsitektur:"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = tbl.rows[0].cells[0]
    c.width = Inches(6.5)
    set_cell_background(c, "F0F9FA")
    set_cell_margins(c, top=100, bottom=100, left=150, right=150)
    tcPr = c._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    left_b = OxmlElement('w:left')
    left_b.set(qn('w:val'), 'single')
    left_b.set(qn('w:sz'), '24')
    left_b.set(qn('w:color'), '005F6E')
    tcBorders.append(left_b)
    for b in ['top', 'bottom', 'right']:
        nb = OxmlElement(f'w:{b}')
        nb.set(qn('w:val'), 'none')
        tcBorders.append(nb)
    tcPr.append(tcBorders)
    
    p = c.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    r_tit = p.add_run(title + "\n")
    r_tit.bold = True
    r_tit.font.name = 'Arial'
    r_tit.font.size = Pt(9.0)
    r_tit.font.color.rgb = COLOR_TEAL
    
    r_txt = p.add_run(text)
    r_txt.font.name = 'Arial'
    r_txt.font.size = Pt(9.0)
    r_txt.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    add_p(doc, "", space_after=4)

def build_sdd():
    print("Loading template from:", TEMPLATE_PATH)
    doc = docx.Document(TEMPLATE_PATH)
    body = doc._body._element
    for child in list(body):
        if child.tag.endswith('sectPr'):
            continue
        body.remove(child)

    # ---------------- COVER / HEADER ----------------
    add_p(doc, "POLITEKNIK NEGERI JAKARTA", bold=True, color=COLOR_TEAL, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p(doc, "JURUSAN TEKNIK INFORMATIKA DAN KOMPUTER", bold=True, color=COLOR_TEXT_MUTED, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p(doc, "PROJECT BASED LEARNING (PBL) — TAHUN 2026", bold=True, color=COLOR_GOLD, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=22)

    add_p(doc, "SOFTWARE DESIGN DOCUMENT (SDD)", style='Title', bold=True, color=COLOR_TEAL, font_size=20, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_p(doc, "PNJ PRIME", bold=True, color=COLOR_DARK_TEAL, font_size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_p(doc, "(Products, Research, Innovation, and Market Excellence)", italic=True, color=COLOR_TEXT_MUTED, font_size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    add_p(doc, "Platform Digital Hilirisasi dan Komersialisasi Produk Riset, Layanan Pengujian Laboratorium, dan Fasilitas Unggulan Politeknik Negeri Jakarta", bold=False, color=COLOR_TEXT_MAIN, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=22)

    # Team Members Table
    tbl_team = doc.add_table(rows=len(TEAM_MEMBERS) + 1, cols=3)
    tbl_team.rows[0].cells[0].paragraphs[0].add_run("Nama Anggota")
    tbl_team.rows[0].cells[1].paragraphs[0].add_run("Peran Utama (Role PBL)")
    tbl_team.rows[0].cells[2].paragraphs[0].add_run("Program Studi / Jurusan")

    for idx, (m_name, m_role, m_jur) in enumerate(TEAM_MEMBERS, start=1):
        tbl_team.rows[idx].cells[0].paragraphs[0].add_run(m_name)
        tbl_team.rows[idx].cells[1].paragraphs[0].add_run(m_role)
        tbl_team.rows[idx].cells[2].paragraphs[0].add_run(m_jur)
    style_table(tbl_team, col_widths=[Inches(2.5), Inches(2.3), Inches(1.7)], header_bg="005F6E", zebra=True)

    add_p(doc, "", space_after=10)
    add_p(doc, "Kelompok: Kelompok Suka suka", bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p(doc, "Pemilik Kebutuhan (Klien): Unit RTPU (Rekayasa Teknologi dan Pusat Unggulan) PNJ", bold=False, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p(doc, "Dosen Pembimbing: Dosen Pembimbing PBL Jurusan TIK PNJ", bold=False, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p(doc, "Versi Dokumen: Versi 2.0 (Desain Arsitektur & Implementasi Final) — November 2026", italic=True, font_size=9, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=22)

    # ---------------- SECTION 1 ----------------
    add_heading_1(doc, "Section 1 – Deskripsi Proyek")

    add_heading_2(doc, "1.1 Judul Project")
    add_p(doc, "PNJ PRIME (Products, Research, Innovation, and Market Excellence) — Platform Digital Hilirisasi dan Komersialisasi Produk, Layanan Jasa Pengujian, dan Fasilitas Unggulan Politeknik Negeri Jakarta.")

    add_heading_2(doc, "1.2 Deskripsi")
    add_p(doc, "PNJ PRIME adalah platform e-commerce dan marketplace institusional berbasis web yang dirancang khusus untuk memfasilitasi hilirisasi, komersialisasi, serta pemanfaatan produk inovasi riset, layanan pengujian laboratorium, dan penyewaan fasilitas/ruangan milik Politeknik Negeri Jakarta (PNJ). Platform ini dikembangkan untuk menjawab permasalahan operasional pada website Unit RTPU (Rekayasa Teknologi dan Pusat Unggulan) yang lama, yang kerap mengalami kendala teknis (server down) dan belum memiliki infrastruktur transaksi digital yang terintegrasi.")
    add_p(doc, "Sistem PNJ PRIME dibangun dengan landasan arsitektur modern yang disesuaikan dengan regulasi Badan Layanan Umum (BLU) Politeknik Negeri Jakarta. Berbeda dengan platform komersial publik (seperti Shopee atau Tokopedia) yang berorientasi profit murni dan tidak mendukung tata kelola aset negara, PNJ PRIME mengadopsi prinsip benchmark dari Solution UI (ACID) milik Direktorat Inovasi Universitas Indonesia dengan kustomisasi mendalam pada prosedur internal kampus.")
    add_p(doc, "Karakteristik dan keunggulan arsitektur sistem PNJ PRIME meliputi:")
    add_bullet(doc, "Memfasilitasi penayangan produk fisik habis pakai, layanan pengujian lab, serta penyewaan fasilitas ruangan dalam satu portal terpadu bertema brand premium.", "Katalog Multi-Kategori: ")
    add_bullet(doc, "Setiap pengajuan item katalog baru dari Admin Pengelola unit/jurusan diverifikasi terlebih dahulu oleh Admin RTPU (pemeriksaan kelengkapan dan kelayakan), kemudian disetujui secara final oleh Pimpinan RTPU sebelum tayang di katalog publik.", "Alur Kurasi Dua Tahap: ")
    add_bullet(doc, "Mendukung dua jalur pembayaran, yaitu transfer manual ke rekening resmi Bank Mandiri BLU PNJ dengan penerbitan invoice resmi dan verifikasi bukti bayar manual oleh Admin RTPU (untuk layanan, sewa fasilitas, pengujian lab, dan pre-order), serta payment gateway (simulasi pada tahap PBL) untuk transaksi produk fisik ready stock.", "Dual Payment Channel: ")
    add_bullet(doc, "Menerapkan 6 peran aktor (Customer, Admin Pengelola Jurusan/Unit, Admin RTPU, Pimpinan RTPU, Super Admin, dan Direktur) dengan pemisahan hak akses granular, di mana Admin Pengelola hanya dapat melihat dan mengelola data milik unitnya sendiri.", "Granular Role-Based Access Control (RBAC): ")
    add_bullet(doc, "Menghitung PPN secara dinamis berdasarkan tabel master tarif pajak yang dapat dikonfigurasi langsung oleh Admin RTPU tanpa perlu mengubah kode sumber aplikasi.", "Master Pajak Dinamis: ")
    add_bullet(doc, "Backend berbasis Laravel 11 (PHP 8.4) yang kokoh dipadukan dengan frontend Single Page Application (SPA) berbasis Inertia.js dan React 18, menghasilkan pengalaman pengguna yang responsif, cepat, dan aman.", "Modern Fullstack Architecture: ")

    add_heading_2(doc, "1.3 Revision History")
    add_p(doc, "Tabel berikut mendokumentasikan riwayat perubahan dan evolusi dokumen perancangan perangkat lunak PNJ PRIME:")

    tbl_rev = doc.add_table(rows=len(REVISION_HISTORY) + 1, cols=3)
    tbl_rev.rows[0].cells[0].paragraphs[0].add_run("Date")
    tbl_rev.rows[0].cells[1].paragraphs[0].add_run("Comment")
    tbl_rev.rows[0].cells[2].paragraphs[0].add_run("Author")
    for idx, (r_date, r_comm, r_auth) in enumerate(REVISION_HISTORY, start=1):
        tbl_rev.rows[idx].cells[0].paragraphs[0].add_run(r_date)
        tbl_rev.rows[idx].cells[1].paragraphs[0].add_run(r_comm)
        tbl_rev.rows[idx].cells[2].paragraphs[0].add_run(r_auth)
    style_table(tbl_rev, col_widths=[Inches(1.2), Inches(3.8), Inches(1.5)], header_bg="005F6E", zebra=True)

    # ---------------- SECTION 2 ----------------
    add_heading_1(doc, "Section 2 - Overview")

    add_heading_2(doc, "2.1 Tujuan Proyek")
    add_p(doc, "Tujuan utama perancangan dan pengembangan perangkat lunak PNJ PRIME dirumuskan secara terukur sebagai berikut:")
    add_bullet(doc, "Menyediakan platform digital terpadu untuk hilirisasi dan komersialisasi produk fisik, jasa pengujian lab, dan penyewaan fasilitas kampus dengan cakupan 23 kebutuhan fungsional (FR-01 s.d. FR-23) yang terverifikasi lulus UAT.", "1. Platform Komersialisasi Terpadu: ")
    add_bullet(doc, "Mengotomatisasi prosedur kurasi produk dua tahap (verifikasi teknis Admin RTPU dan persetujuan eksekutif Pimpinan RTPU) sehingga 100% item yang tayang di katalog publik telah terjamin validitas dan legalitasnya.", "2. Otomasi Kurasi Dua Tahap: ")
    add_bullet(doc, "Menyediakan mekanisme transaksi dan penagihan transparan dengan alur pengajuan, penerbitan invoice resmi, dan verifikasi bukti transfer manual serta payment gateway simulasi dengan tingkat keberhasilan uji alur ≥ 95%.", "3. Transparansi Transaksi & Penagihan: ")
    add_bullet(doc, "Mengimplementasikan kontrol akses peran (RBAC) granular untuk 6 peran pengguna dengan isolasi data antar jurusan/unit (tingkat keberhasilan penolakan akses tanpa izin 100%) serta perhitungan PPN otomatis dengan selisih Rp0.", "4. Tata Kelola Data & Kepatuhan Pajak: ")
    add_bullet(doc, "Menghadirkan antarmuka web modern dengan identitas visual 'Prime' (Deep Petroleum Teal dan Warm Golden Amber) yang responsif lintas perangkat (lebar 360px hingga 1920px) menggantikan website lama yang sering mengalami server down.", "5. Stabilitas Platform & Identitas Brand: ")

    add_heading_2(doc, "2.2 Batasan Proyek")
    add_p(doc, "Perancangan sistem PNJ PRIME dibatasi oleh batasan-batasan teknis, organisasional, dan manajerial berikut:")

    tbl_bat = doc.add_table(rows=len(PROJECT_CONSTRAINTS) + 1, cols=2)
    tbl_bat.rows[0].cells[0].paragraphs[0].add_run("Aspek Batasan")
    tbl_bat.rows[0].cells[1].paragraphs[0].add_run("Deskripsi Batasan")
    for idx, (b_asp, b_desc) in enumerate(PROJECT_CONSTRAINTS, start=1):
        tbl_bat.rows[idx].cells[0].paragraphs[0].add_run(b_asp)
        tbl_bat.rows[idx].cells[1].paragraphs[0].add_run(b_desc)
    style_table(tbl_bat, col_widths=[Inches(2.0), Inches(4.5)], header_bg="005F6E", zebra=True)

    add_heading_2(doc, "2.3 Requirement")
    add_p(doc, "Kebutuhan sistem PNJ PRIME mengacu pada dokumen SRS v1.2 yang terdiri dari 23 Kebutuhan Fungsional (FR-01 s.d. FR-23) dan 10 Kebutuhan Non-Fungsional (NFR).")

    add_heading_3(doc, "2.3.1 Estimates")
    add_p(doc, "Estimasi alokasi usaha pengembangan per kelompok modul sistem PNJ PRIME dihitung berdasarkan rincian WBS dan manday (1 Manday = 8 Jam Kerja):")

    tbl_est = doc.add_table(rows=len(ESTIMATES_DATA) + 2, cols=3)
    tbl_est.rows[0].cells[0].paragraphs[0].add_run("#")
    tbl_est.rows[0].cells[1].paragraphs[0].add_run("Description of Task / Module")
    tbl_est.rows[0].cells[2].paragraphs[0].add_run("Hrs. Est.")

    for idx, (e_no, e_desc, e_hrs) in enumerate(ESTIMATES_DATA, start=1):
        tbl_est.rows[idx].cells[0].paragraphs[0].add_run(e_no)
        tbl_est.rows[idx].cells[1].paragraphs[0].add_run(e_desc)
        tbl_est.rows[idx].cells[2].paragraphs[0].add_run(e_hrs)

    # Total Row
    tot_row_idx = len(ESTIMATES_DATA) + 1
    tbl_est.rows[tot_row_idx].cells[0].paragraphs[0].add_run("")
    tbl_est.rows[tot_row_idx].cells[1].paragraphs[0].add_run("TOTAL ESTIMASI USAHA PENGEMBANGAN:")
    tbl_est.rows[tot_row_idx].cells[2].paragraphs[0].add_run("992 Jam (124 Manday)")
    tbl_est.rows[tot_row_idx].cells[1].paragraphs[0].runs[0].bold = True
    tbl_est.rows[tot_row_idx].cells[2].paragraphs[0].runs[0].bold = True
    style_table(tbl_est, col_widths=[Inches(0.5), Inches(4.3), Inches(1.7)], header_bg="005F6E", zebra=True)

    add_heading_3(doc, "2.3.2 Traceability Matrix")
    add_p(doc, "Tabel matriks ketertelusuran berikut memetakan setiap kebutuhan fungsional dalam SRS v1.2 terhadap modul rancangan SDD dan komponen kode implementasinya:")

    tbl_trace = doc.add_table(rows=len(TRACEABILITY_MATRIX) + 1, cols=4)
    tbl_trace.rows[0].cells[0].paragraphs[0].add_run("SRS Requirement")
    tbl_trace.rows[0].cells[1].paragraphs[0].add_run("SDD Module & Logic")
    tbl_trace.rows[0].cells[2].paragraphs[0].add_run("Komponen Handler / Controller")
    tbl_trace.rows[0].cells[3].paragraphs[0].add_run("Komponen UI (Inertia Page)")

    for idx, (t_req, t_mod, t_ctrl, t_ui) in enumerate(TRACEABILITY_MATRIX, start=1):
        tbl_trace.rows[idx].cells[0].paragraphs[0].add_run(t_req)
        tbl_trace.rows[idx].cells[1].paragraphs[0].add_run(t_mod)
        tbl_trace.rows[idx].cells[2].paragraphs[0].add_run(t_ctrl)
        tbl_trace.rows[idx].cells[3].paragraphs[0].add_run(t_ui)
    style_table(tbl_trace, col_widths=[Inches(1.5), Inches(1.8), Inches(1.6), Inches(1.6)], header_bg="005F6E", zebra=True)

    add_heading_2(doc, "3.c Antarmuka Perangkat Lunak")
    add_p(doc, "Sistem PNJ PRIME menghubungkan pengguna dan sub-sistem melalui antarmuka perangkat lunak berbasis protokol HTTP/HTTPS yang terbagi atas:")
    add_bullet(doc, "Antarmuka berbasis komponen React yang dirender di peramban klien melalui jembatan Inertia.js. Menghilangkan kebutuhan penulisan API terpisah untuk kebutuhan perenderan internal, memungkinkan komunikasi fullstack berkecepatan tinggi dengan validasi otomatis.", "Client Presentation Interface: ")
    add_bullet(doc, "Routing internal Laravel (web.php) yang dilindungi middleware otentikasi (auth), verifikasi email, dan pengecekan role (role:admin_rtpu, role:pimpinan, dsb.). Menghasilkan payload data JSON terkompresi ke antarmuka React.", "Application Controller Interface: ")
    add_bullet(doc, "Lapisan Object-Relational Mapping (ORM) Eloquent yang mengisolasi query SQL dan memetakan struktur tabel database secara aman menggunakan parameterized queries, mencegah celah SQL Injection.", "Database Interface: ")
    add_bullet(doc, "Modul redirect eksternal ke domain https://lms-rtpu.pnj.ac.id serta https://rtpu.pnj.ac.id baru, dan integrasi pengiriman email notifikasi tagihan/kuitansi berbasis SMTP Mailer.", "External & Communications Interface: ")

    # ---------------- SECTION 3 ----------------
    add_heading_1(doc, "Section 3 - System Architecture")
    add_p(doc, "Arsitektur perangkat lunak PNJ PRIME mengadopsi model Multi-Tier Architecture dengan pemisahan tanggung jawab (Separation of Concerns) yang tegas antara antarmuka pengguna, logika aplikasi, orkestrasian bisnis, dan lapisan penyimpanan data:")

    add_callout(doc, "Arsitektur Sistem PNJ PRIME:\n"
                     "[1. Presentation Tier]   -> Client Browser: React 18 SPA + Tailwind CSS + Lucide Icons\n"
                     "                                      ↕ (Inertia.js Protocol over HTTPS)\n"
                     "[2. Routing & Security]  -> Laravel Kernel HTTP: Route Middleware (Auth, RBAC, Unit Isolation, CSRF)\n"
                     "                                      ↕ (Direct Controller Invocation)\n"
                     "[3. Application Tier]    -> Controllers & Service Layer: CurationService, InvoiceService, TaxEngine\n"
                     "                                      ↕ (Eloquent ORM & Repository Pattern)\n"
                     "[4. Data Tier]           -> Relational Database: PostgreSQL / SQLite (Indexed, Foreign Keys)\n"
                     "[5. Storage Tier]        -> File Storage Disk: PDF Invoices, Payment Proofs, KTP/NPWP, Posters",
                     "Diagram Blok Arsitektur Sistem PNJ PRIME")

    add_heading_2(doc, "3.1 Sisi Klien (Frontend)")
    add_p(doc, "Frontend PNJ PRIME dikembangkan sebagai Single Page Application (SPA) modern berbasis React 18 yang dikompilasi menggunakan Vite. Karakteristik utama arsitektur frontend mencakup:")
    add_bullet(doc, "Menggunakan Inertia.js sebagai adapter klien yang meniadakan state manajemen rumit seperti Redux untuk alur data server. Komponen React menerima data langsung sebagai props dari controller Laravel.", "Inertia Client Adapter: ")
    add_bullet(doc, "Dibangun dengan framework CSS utilitas Tailwind yang menerapkan konsistensi sistem desain institusi PNJ PRIME: warna utama Deep Petroleum Teal (#005f6e), Deep Dark (#003d47), dan Warm Golden Amber (#ca9c34).", "Desain Sistem UI: ")
    add_bullet(doc, "Formulir interaktif dikelola menggunakan hook useForm dari Inertia yang menangani validasi real-time, penanganan error validasi dari server, serta penonaktifan tombol submit otomatis saat pengiriman data berlangsung.", "Manajemen State & Validasi Klien: ")
    add_bullet(doc, "Antarmuka dibangun dengan pendekatan mobile-first yang sepenuhnya responsif pada berbagai resolusi layar (ponsel pintar 360px hingga layar desktop lebar 1920px).", "Responsivitas: ")

    add_heading_2(doc, "3.2 Sisi Server (Backend)")
    add_p(doc, "Backend PNJ PRIME dikembangkan menggunakan Laravel 11 dengan runtime PHP 8.4. Arsitektur backend dirancang modular dengan komponen-komponen berikut:")
    add_bullet(doc, "Setiap HTTP request diproses melalui Controller yang ramping (skinny controller). Logika perhitungan pajak dan penerbitan nomor tagihan didelegasikan ke Service Layer terpisah (TaxCalculationService, InvoiceService).", "Controller & Service Layer: ")
    add_bullet(doc, "Permintaan data masuk divalidasi secara ketat menggunakan Form Request kustom (StoreProductRequest, StorePengajuanRequest) sebelum menyentuh logika controller.", "Form Request Validation: ")
    add_bullet(doc, "Pengelolaan data menggunakan Eloquent ORM dengan relasi tabel yang terdefinisi rapi, dilengkapi transaction lock (DB::transaction) pada operasi kritis (seperti penerbitan invoice dan verifikasi pembayaran) untuk menjamin integritas data (ACID).", "Eloquent ORM & Database Transactions: ")
    add_bullet(doc, "Penyimpanan file bukti pembayaran, kartu identitas KTP/NPWP penyewa, serta poster produk dikelola melalui modul Storage Laravel dengan penyimpanan terenkripsi/terlindungi hak akses.", "Storage Disk Security: ")

    add_heading_2(doc, "3.3 System Analyst")
    add_p(doc, "Peran System Analyst dalam perancangan PNJ PRIME mencakup pendefinisian model fungsional dan perilaku sistem:")
    add_bullet(doc, "Mencakup 18 Use Case yang dipetakan pada 6 Aktor (Customer, Admin Pengelola, Admin RTPU, Pimpinan RTPU, Super Admin, dan Direktur) yang merefleksikan seluruh alur operasional hilirisasi.", "Pemodelan Use Case: ")
    add_bullet(doc, "Diagram aktivitas detail dari AD-01 hingga AD-18 yang mendefinisikan langkah aksi, pengambilan keputusan, dan alur alternatif pada tiap fungsi sistem.", "Pemodelan Aktivitas: ")
    add_bullet(doc, "Tiga pemodelan proses bisnis utama: BPMN-01 (Proses Layanan, Sewa, dan Pre-order via Transfer Bank), BPMN-02 (Pemesanan Ready Stock via Payment Gateway), dan BPMN-03 (Alur Kurasi & Penayangan Katalog Dua Tahap).", "Pemodelan Proses Bisnis (BPMN): ")
    add_bullet(doc, "Perancangan skema relasional 12 entitas database dan Class Diagram berbasis objek untuk memandu implementasi tim programmer.", "Perancangan Data & Struktur Kelas: ")

    add_heading_2(doc, "3.4 Software Tester")
    add_p(doc, "Pengujian perangkat lunak dirancang secara sistematis untuk memastikan seluruh kebutuhan fungsional dan non-fungsional terpenuhi tanpa cacat kritis:")
    add_bullet(doc, "Menggunakan PHPUnit untuk menguji kebenaran algoritma perhitungan pajak, validasi model, dan pengecekan akses per role.", "Unit Testing: ")
    add_bullet(doc, "Pengujian alur HTTP end-to-end melalui simulasi request Inertia untuk memastikan pengajuan layanan, penerbitan invoice, dan verifikasi bukti bayar menghasilkan status yang valid di database.", "Feature & Integration Testing: ")
    add_bullet(doc, "Uji penerimaan sistem bersama Unit RTPU dan Dosen Pembimbing berdasarkan 23 skenario uji Fit Criteria SRS dengan target kelulusan 100% pada fungsi inti kurasi dan transaksi.", "User Acceptance Test (UAT): ")

    add_heading_2(doc, "3.5 Proses Pengembangan dan Kolaborasi")
    add_p(doc, "Proses pengembangan menerapkan adaptasi metodologi Unified Process (RUP) yang diselaraskan dengan tahapan PBL:")
    add_bullet(doc, "Inception (M1, orientasi dan WBS), Elaboration (M2–M6, analisis SRS v1.2 dan perancangan SDD v2.0), Construction (M7–M14, implementasi Laravel/React), dan Transition (M15–M16, UAT, sosialisasi, dan BAST).", "Empat Fase Iteratif: ")
    add_bullet(doc, "Pengelolaan kode sumber menggunakan Git dengan repository GitHub. Cabang main dilindungi untuk versi stabil, cabang dev untuk integrasi aktif, dan cabang feature/* untuk pengerjaan per modul.", "Branching Model & Code Review: ")
    add_bullet(doc, "Standardisasi gaya penulisan kode PHP menggunakan Laravel Pint (vendor/bin/pint) dan ESLint/Prettier pada kode JavaScript/React.", "Standardisasi Kode: ")

    # ---------------- SECTION 4 ----------------
    add_heading_1(doc, "Section 4 - Data Design")

    add_heading_2(doc, "3.1 Desain Entity Relationship Diagram (ERD)")
    add_p(doc, "Basis data PNJ PRIME dirancang menggunakan model relasional yang dinormalisasi (3NF) guna menghindari redundansi data dan menjaga konsistensi transaksi antar modul. Hubungan antar entitas utama didasarkan pada alur kurasi produk, pemesanan multi-layanan, penagihan, dan pembayaran.")
    add_p(doc, "Penjelasan 12 entitas utama sistem PNJ PRIME:")
    add_bullet(doc, "Menyimpan data otentikasi, identitas pengguna, tipe akun (Customer / Admin Pengelola), asal jurusan/unit, serta status verifikasi akun oleh Pimpinan RTPU.", "1. Users: ")
    add_bullet(doc, "Mengatur hak akses berbasis peran (RBAC) granular dengan asosiasi permission per menu dan fungsionalitas.", "2. Roles & Permissions: ")
    add_bullet(doc, "Kategori utama item (Produk Fisik, Layanan Jasa Pengujian, Fasilitas/Ruangan).", "3. Product Categories: ")
    add_bullet(doc, "Menyimpan katalog item, harga, stok/ketersediaan, spesifikasi teknis, dokumen pendukung, foto poster, dan status kurasi (draft, pending, approved_admin, approved_leader, rejected).", "4. Products: ")
    add_bullet(doc, "Menyimpan data identitas perusahaan, NPWP, dan lampiran KTP penanggung jawab untuk layanan penyewaan fasilitas/alat.", "5. Tenant Profiles: ")
    add_bullet(doc, "Menyimpan data pengajuan layanan, permohonan jasa lab, dan sewa fasilitas yang diajukan oleh customer.", "6. Pengajuan: ")
    add_bullet(doc, "Dokumen tagihan resmi yang diterbitkan oleh Admin RTPU, memuat tanggal jatuh tempo, rekening tujuan, subtotal, dan nomor invoice berurutan.", "7. Invoices: ")
    add_bullet(doc, "Rincian baris item transaksi pada sebuah tagihan invoice.", "8. Invoice Lines: ")
    add_bullet(doc, "Mencatat transaksi pembayaran, nominal terbayar, saluran bayar, serta status verifikasi keuangan.", "9. Payments: ")
    add_bullet(doc, "Menyimpan berkas gambar bukti transfer bank dari customer beserta metadata rekening pengirim.", "10. Payment Proofs: ")
    add_bullet(doc, "Daftar rekening bank resmi PNJ (Bank Mandiri BLU) dan kanal pembayaran yang aktif.", "11. Payment Methods: ")
    add_bullet(doc, "Master persentase pajak PPN dinamis yang digunakan oleh mesin kalkulasi pajak.", "12. Tax Rates: ")

    # Data Dictionary Tables
    add_heading_3(doc, "Kamus Data (Data Dictionary)")
    for tbl_name, cols in DATA_DICTIONARY.items():
        add_p(doc, f"Tabel {tbl_name}", bold=True, color=COLOR_DARK_TEAL, font_size=10.0, space_before=6, space_after=2)
        dict_t = doc.add_table(rows=len(cols) + 1, cols=4)
        dict_t.rows[0].cells[0].paragraphs[0].add_run("Field Name")
        dict_t.rows[0].cells[1].paragraphs[0].add_run("Notes / Keterangan")
        dict_t.rows[0].cells[2].paragraphs[0].add_run("Type")
        dict_t.rows[0].cells[3].paragraphs[0].add_run("Field Size")
        for r_i, (f_name, f_notes, f_type, f_size) in enumerate(cols, start=1):
            dict_t.rows[r_i].cells[0].paragraphs[0].add_run(f_name)
            dict_t.rows[r_i].cells[1].paragraphs[0].add_run(f_notes)
            dict_t.rows[r_i].cells[2].paragraphs[0].add_run(f_type)
            dict_t.rows[r_i].cells[3].paragraphs[0].add_run(f_size)
        style_table(dict_t, col_widths=[Inches(1.8), Inches(2.7), Inches(1.0), Inches(1.0)], header_bg="005F6E", zebra=True)
        add_p(doc, "", space_after=3)

    add_heading_2(doc, "3.2 Class Diagram")
    add_p(doc, "Struktur kelas PNJ PRIME dirancang mengikuti pola Model-View-Controller (MVC) berorientasi objek yang diperkaya dengan Service Layer. Relasi dan metode utama pada kelas-kelas inti dijabarkan sebagai berikut:")

    add_callout(doc,
"""1. Class: User (Eloquent Model)
   - Atribut: id, name, email, password, role, jurusan_unit, status_verifikasi
   - Metode: hasRole(role), isPengelola(), products(), pengajuan(), invoices()

2. Class: Product (Eloquent Model)
   - Atribut: id, category_id, user_id, nama_produk, harga, stok, status_kurasi, target_audience
   - Metode: category(), owner(), scopeApprovedPublic(), canBeEditedBy(user)

3. Class: Pengajuan (Eloquent Model)
   - Atribut: id, nomor_pengajuan, user_id, product_id, status, catatan_pemohon
   - Metode: customer(), product(), invoice(), roomBooking(), updateStatus(status)

4. Class: Invoice (Eloquent Model)
   - Atribut: id, nomor_invoice, pengajuan_id, subtotal, tax_amount, total_amount, status
   - Metode: lines(), payments(), markAsPaid(), generatePdfReceipt()

5. Class: CurationService (Application Service)
   - Metode: submitForReview(product), reviewByAdmin(product, notes, approved), finalApproveByLeader(product, approved)

6. Class: TaxCalculationService (Business Domain Service)
   - Metode: calculatePPN(subtotal, categoryId), applyTaxSnapshot(invoice)

7. Class: RoleMiddleware & UnitOwnershipMiddleware (HTTP Middleware)
   - Metode: handle(request, next, requiredRoles), ensureUnitAccess(user, product)""",
"Representasi Class Diagram Sistem PNJ PRIME")

    # ---------------- SECTION 5 ----------------
    add_heading_1(doc, "Section 5 - Software Domain Design")

    add_heading_2(doc, "5.1 Software Application Domain Chart")
    add_p(doc, "Arsitektur domain fungsional sistem PNJ PRIME dikelompokkan ke dalam 5 domain batas bisnis utama:")

    add_callout(doc,
"""+-----------------------------------------------------------------------------------+
|                           DOMAIN UTAMA APLIKASI PNJ PRIME                         |
+-----------------------------------------------------------------------------------+
| 1. IDENTITY & ACCESS DOMAIN                                                       |
|    - Manajemen Pengguna, Autentikasi, Simulasi SSO PNJ, Verifikasi Akun Pengelola  |
+-----------------------------------------------------------------------------------+
| 2. PRODUCT & CATALOG DOMAIN                                                       |
|    - Data Master Produk, Segmentasi Publik/Internal, Alur Kurasi Dua Tahap        |
+-----------------------------------------------------------------------------------+
| 3. SERVICE & TRANSACTION DOMAIN                                                   |
|    - Pengajuan Layanan Jasa, Peminjaman Ruangan/Lab, Checkout Produk Fisik        |
+-----------------------------------------------------------------------------------+
| 4. FINANCIAL & BILLING DOMAIN                                                     |
|    - Mesin Pajak Dinamis, Penerbitan Invoice Resmi, Verifikasi Bukti Transfer     |
+-----------------------------------------------------------------------------------+
| 5. GOVERNANCE & REPORTING DOMAIN                                                  |
|    - Matriks RBAC Dinamis, Audit Logging, Dashboard Monitoring, Ekspor Laporan    |
+-----------------------------------------------------------------------------------+""",
"Bagan Domain Aplikasi Perangkat Lunak (Domain Chart)")

    add_heading_2(doc, "5.2 Software Application Domain")
    add_p(doc, "Uraian tanggung jawab logis dan interaksi antar domain bisnis:")
    add_bullet(doc, "Bertanggung jawab atas pendaftaran identitas pengguna, otentikasi aman, pengelompokan unit kerja kampus, serta verifikasi legalitas akun Admin Pengelola jurusan oleh Pimpinan RTPU sebelum dapat mengusulkan produk.", "Identity & Access Domain: ")
    add_bullet(doc, "Menjaga siklus hidup data produk riset dan fasilitas. Menjalankan mesin kurasi dua tahap yang mengisolasi produk belum disetujui agar tidak bocor ke katalog publik, serta mengatur batasan hak ubah item per unit kerja.", "Product & Catalog Domain: ")
    add_bullet(doc, "Mengelola keranjang pemesanan, konfirmasi jadwal ketersediaan peminjaman ruangan laboratorium, pengunggahan dokumen KTP/NPWP penyewa, serta transisi tahapan pengerjaan jasa pengujian.", "Service & Transaction Domain: ")
    add_bullet(doc, "Mengotomatisasi kalkulasi tarif pajak PPN berdasarkan kategori item, menghasilkan invoice bernomor urut legal, mencocokkan konfirmasi bukti transfer customer dengan rekening Mandiri BLU, dan menerbitkan kuitansi elektronik.", "Financial & Billing Domain: ")
    add_bullet(doc, "Menyediakan visibilitas status secara terpusat untuk Direktur dan Pimpinan RTPU, mencatat seluruh riwayat aktivitas krusial pengguna (audit trail), serta menyediakan pintu navigasi keluar ke sistem LMS RTPU.", "Governance & Reporting Domain: ")

    # ---------------- SECTION 6 ----------------
    add_heading_1(doc, "Section 6 - User Interface Design")

    add_heading_2(doc, "6.1 User Interface Mockup/ Wireframe/ Prototype")
    add_p(doc, "Perancangan antarmuka pengguna PNJ PRIME mengedepankan identitas visual bernuansa premium, elegan, dan profesional yang mencerminkan martabat institusi Politeknik Negeri Jakarta. Palet warna resmi yang diterapkan adalah:")
    add_bullet(doc, "Hex #005F6E (Accent) dan #003D47 (Deep Dark) sebagai warna dominan pada navbar, tombol aksi utama, dan header tabel.", "Deep Petroleum Teal: ")
    add_bullet(doc, "Hex #CA9C34 (Gold Accent) dan #A87D20 (Deep Gold) sebagai warna aksen pada lencana kurasi terverifikasi, bintang inovasi, dan elemen sorotan.", "Warm Golden Amber: ")
    add_bullet(doc, "Hex #E6F4F6 sebagai latar belakang kartu informasi dan kontainer sorotan lembut.", "Petroleum Tint: ")

    add_p(doc, "Hierarki rancangan mockup dan prototipe antarmuka sistem terbagi ke dalam modul-modul berikut:")
    add_bullet(doc, "Menampilkan banner inovasi unggulan, fitur pencarian cepat, filter jenis item (Produk Fisik, Jasa Uji, Sewa Fasilitas), filter unit/jurusan pengusul, serta kartu produk lengkap dengan label harga dan badge resmi kurasi RTPU.", "1. Katalog Publik & Landing Page: ")
    add_bullet(doc, "Menyajikan galeri foto, spesifikasi teknis lengkap, nama jurusan pengusul, formulir tanggal pemesanan ruangan, dan tombol pengajuan layanan/checkout.", "2. Detail Produk & Fasilitas: ")
    add_bullet(doc, "Formulir pengisian data institusi, input nomor NPWP, dan area drag-and-drop unggah scan KTP/NPWP penanggung jawab.", "3. Formulir Pengajuan Sewa & Data Penyewa: ")
    add_bullet(doc, "Menampilkan rincian tagihan resmi, perhitungan subtotal dan pajak PPN, nomor rekening resmi Bank Mandiri BLU PNJ, countdown batas waktu bayar, serta form unggah bukti transfer perbankan.", "4. Antarmuka Invoice & Unggah Bukti Bayar: ")
    add_bullet(doc, "Tabel manajemen produk khusus unitnya, indikator status kurasi (Badge Kuning Pending, Merah Ditolak, Hijau Disetujui), serta tombol ajukan ulang produk revisi.", "5. Dashboard Admin Pengelola Jurusan: ")
    add_bullet(doc, "Meja kerja pemeriksaan kelayakan berkas produk tahap 1, tombol loloskan ke pimpinan atau tolak dengan alasan, serta panel verifikasi bukti transfer kasir.", "6. Dashboard Admin RTPU: ")
    add_bullet(doc, "Panel otorisasi akhir penayangan produk tahap 2, daftar persetujuan akun Admin Pengelola jurusan, serta grafik monitoring pendapatan hilirisasi kampus.", "7. Dashboard Pimpinan RTPU & Direktur: ")
    add_bullet(doc, "Matriks hak akses dinamis (Dynamic RBAC Grid) untuk mengatur akses menu per peran, tabel kelola pengguna, dan log audit sistem.", "8. Dashboard Super Admin: ")

    add_callout(doc, "Tautan Prototype & Desain Interaktif (Figma):\n"
                     "Prototipe antarmuka interaktif bertema 'PNJ Prime Premium' dapat diakses melalui repositori desain Figma resmi Tim PBL Suka Suka pada tautan proyek UI/UX PNJ PRIME.",
                     "Akses Mockup & Prototipe Antarmuka")

    # ---------------- SECTION 7 ----------------
    add_heading_1(doc, "Section 7 – References")
    add_p(doc, "Dokumen perancangan Software Design Document (SDD) ini disusun dengan merujuk pada standar dan dokumen resmi berikut:")
    add_bullet(doc, "Dokumen Software Requirement Specification (SRS) PNJ PRIME Versi 1.2, Tim PBL Suka Suka, Oktober 2026.", "1. SRS PNJ PRIME v1.2: ")
    add_bullet(doc, "Dokumen Software Development Plan (SDPLN) PNJ PRIME Versi 1.3, Tim PBL Suka Suka, 9 November 2026.", "2. SDPLN PNJ PRIME v1.3: ")
    add_bullet(doc, "Dokumen Project Charter PNJ PRIME, Tim PBL Suka Suka & Unit RTPU PNJ, 2026.", "3. Project Charter: ")
    add_bullet(doc, "Model Use Case Diagram dan Diagram Aktivitas (AD-01 sampai AD-18 Versi 6), Revisi 23 Oktober 2026.", "4. Diagram UML StarUML: ")
    add_bullet(doc, "Model Proses Bisnis BPMN-01, BPMN-02, dan BPMN-03 PNJ PRIME Revisi 2026.", "5. Diagram Proses Bisnis BPMN: ")
    add_bullet(doc, "Platform E-Commerce Direktorat Inovasi Universitas Indonesia (https://solution.ui.ac.id) sebagai benchmark fungsionalitas komersialisasi inovasi perguruan tinggi.", "6. Benchmark Solution UI (ACID): ")
    add_bullet(doc, "Dokumentasi Resmi Laravel Framework v11.x, Inertia.js v2.x, dan React 18.", "7. Dokumentasi Teknis: ")

    # ---------------- SECTION 8 ----------------
    add_heading_1(doc, "Section 8 – Glossary")
    add_p(doc, "Daftar istilah dan singkatan yang digunakan di dalam dokumen ini:")

    tbl_glo = doc.add_table(rows=len(GLOSSARY_ITEMS) + 1, cols=2)
    tbl_glo.rows[0].cells[0].paragraphs[0].add_run("Istilah / Singkatan")
    tbl_glo.rows[0].cells[1].paragraphs[0].add_run("Definisi dan Keterangan")
    for idx, (g_term, g_def) in enumerate(GLOSSARY_ITEMS, start=1):
        tbl_glo.rows[idx].cells[0].paragraphs[0].add_run(g_term)
        tbl_glo.rows[idx].cells[1].paragraphs[0].add_run(g_def)
    style_table(tbl_glo, col_widths=[Inches(1.8), Inches(4.7)], header_bg="005F6E", zebra=True)

    # Save outputs
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(WORKSPACE_OUTPUT), exist_ok=True)

    doc.save(OUTPUT_PATH)
    doc.save(WORKSPACE_OUTPUT)

    print(f"SUCCESS: SDD document generated and saved to:")
    print(f"  1. {OUTPUT_PATH}")
    print(f"  2. {WORKSPACE_OUTPUT}")

if __name__ == "__main__":
    build_sdd()
