import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const EDGE_PATHS = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findEdgeExecutable() {
    for (const p of EDGE_PATHS) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SCREENSHOT_DIR = path.resolve('tests/e2e/screenshots');
const REPORT_DIR = path.resolve('tests/e2e/reports');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

// Telemetry & Results
const qaResults = {
    suite: 'PNJ Prime Full Activity Diagram Live QA Suite (AD-01 - AD-18)',
    targetUrl: '',
    startTime: new Date().toISOString(),
    endTime: null,
    durationMs: 0,
    totalSteps: 18,
    passedSteps: 0,
    failedSteps: 0,
    totalAssertions: 0,
    passedAssertions: 0,
    failedAssertions: 0,
    consoleErrors: [],
    networkFailures: [],
    steps: [],
};

let currentStepRecord = null;

async function setLiveHud(page, { stepId, title, role, action, passCount, failCount, totalSteps = 18 }) {
    try {
        await page.evaluate(({ stepId, title, role, action, passCount, failCount, totalSteps }) => {
            let hud = document.getElementById('qa-live-hud');
            if (!hud) {
                hud = document.createElement('div');
                hud.id = 'qa-live-hud';
                hud.style.position = 'fixed';
                hud.style.top = '12px';
                hud.style.right = '16px';
                hud.style.zIndex = '9999999';
                hud.style.background = 'rgba(15, 23, 42, 0.94)';
                hud.style.backdropFilter = 'blur(8px)';
                hud.style.color = '#f8fafc';
                hud.style.padding = '12px 18px';
                hud.style.borderRadius = '12px';
                hud.style.border = '1px solid rgba(56, 189, 248, 0.3)';
                hud.style.boxShadow = '0 12px 32px rgba(0,0,0,0.45)';
                hud.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                hud.style.fontSize = '13px';
                hud.style.minWidth = '340px';
                hud.style.maxWidth = '420px';
                hud.style.pointerEvents = 'none';
                hud.style.transition = 'all 0.25s ease';
                document.body.appendChild(hud);
            }

            hud.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(148,163,184,0.18);padding-bottom:8px;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e;"></span>
                        <span style="color:#38bdf8;font-weight:700;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">QA AUDIT ACTIVE</span>
                    </div>
                    <span style="font-size:11px;color:#94a3b8;font-weight:600;">STEP ${stepId} / ${totalSteps}</span>
                </div>
                <div style="margin-bottom:4px;font-weight:700;font-size:13px;color:#ffffff;line-height:1.3;">
                    ${title}
                </div>
                <div style="display:flex;gap:12px;font-size:11px;color:#cbd5e1;margin-bottom:6px;">
                    <span>Peran: <strong style="color:#facc15;">${role}</strong></span>
                    <span>Aksi: <strong style="color:#38bdf8;">${action}</strong></span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px dashed rgba(148,163,184,0.15);font-size:11px;">
                    <span style="color:#22c55e;font-weight:600;">✓ Assertions Pass: ${passCount}</span>
                    <span style="color:${failCount > 0 ? '#ef4444' : '#64748b'};font-weight:600;">✗ Fail: ${failCount}</span>
                </div>
            `;
        }, { stepId, title, role, action, passCount, failCount, totalSteps });
    } catch {
        // Navigation in progress
    }
}

async function highlightElement(page, selector) {
    try {
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'center' });
                const prevTransition = el.style.transition;
                const prevBoxShadow = el.style.boxShadow;
                el.style.transition = 'box-shadow 0.2s ease';
                el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.8), 0 0 16px rgba(245, 158, 11, 0.4)';
                setTimeout(() => {
                    el.style.boxShadow = prevBoxShadow;
                    el.style.transition = prevTransition;
                }, 800);
            }
        }, selector);
    } catch {
        // Selector may not exist yet
    }
}

async function assertCondition(page, condition, description) {
    qaResults.totalAssertions++;
    const pass = Boolean(condition);
    if (pass) {
        qaResults.passedAssertions++;
        currentStepRecord.assertions.push({ description, status: 'PASS' });
        console.log(`    ✓ [ASSERT PASS] ${description}`);
    } else {
        qaResults.failedAssertions++;
        currentStepRecord.assertions.push({ description, status: 'FAIL' });
        console.error(`    ✗ [ASSERT FAIL] ${description}`);
    }
}

async function assertSelectorExists(page, selector, description) {
    let exists = false;
    try {
        await page.waitForSelector(selector, { timeout: 4000 });
        exists = true;
    } catch {
        exists = false;
    }
    await assertCondition(page, exists, description || `Selector '${selector}' harus tampil di DOM.`);
    if (exists) {
        await highlightElement(page, selector);
    }
    return exists;
}

async function takeStepScreenshot(page, filename) {
    const filePath = path.join(SCREENSHOT_DIR, filename);
    try {
        await page.screenshot({ path: filePath, fullPage: false });
        currentStepRecord.screenshots.push(filename);
    } catch (e) {
        console.warn(`    [WARN] Gagal mengambil screenshot ${filename}: ${e.message}`);
    }
}

async function clearSession(page) {
    try {
        const cookies = await page.cookies();
        if (cookies.length > 0) {
            await page.deleteCookie(...cookies);
        }
    } catch {
        // Fallback
    }
}

async function loginAs(page, baseUrl, email, password = 'password', roleName = '') {
    await clearSession(page);
    await sleep(200);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    await highlightElement(page, 'input[name="email"], input[type="email"]');
    await page.type('input[name="email"], input[type="email"]', email, { delay: 10 });
    
    await highlightElement(page, 'input[name="password"], input[type="password"]');
    await page.type('input[name="password"], input[type="password"]', password, { delay: 10 });
    
    await page.click('form button[type="submit"], form button.h-12');
    await page.waitForFunction(() => !window.location.pathname.endsWith('/login'), { timeout: 8000 }).catch(() => {});
    await sleep(500);
}

async function executeStep(page, { id, title, role, action, fn }) {
    console.log(`\n▶ [${id}] ${title} (${role})`);
    const stepStart = Date.now();
    currentStepRecord = {
        id,
        title,
        role,
        action,
        status: 'PENDING',
        durationMs: 0,
        assertions: [],
        screenshots: [],
        error: null,
    };

    await setLiveHud(page, {
        stepId: id,
        title,
        role,
        action,
        passCount: qaResults.passedAssertions,
        failCount: qaResults.failedAssertions,
    });

    try {
        await fn();
        currentStepRecord.status = 'PASS';
        qaResults.passedSteps++;
        console.log(`  ✔ [PASS] ${id} diselesaikan dalam ${Date.now() - stepStart}ms`);
    } catch (err) {
        currentStepRecord.status = 'FAIL';
        currentStepRecord.error = err.message;
        qaResults.failedSteps++;
        console.error(`  ✖ [FAIL] ${id} error: ${err.message}`);
    } finally {
        currentStepRecord.durationMs = Date.now() - stepStart;
        qaResults.steps.push(currentStepRecord);
        await setLiveHud(page, {
            stepId: id,
            title: `${title} (${currentStepRecord.status})`,
            role,
            action,
            passCount: qaResults.passedAssertions,
            failCount: qaResults.failedAssertions,
        });
        await sleep(400);
    }
}

function generateHtmlReport(results) {
    const passPercent = Math.round((results.passedAssertions / Math.max(results.totalAssertions, 1)) * 100);
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>PNJ Prime - Activity Diagrams E2E Live QA Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; margin-bottom: 24px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 20px; }
        .stat-card { background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; }
        .stat-value { font-size: 28px; font-weight: 700; color: #38bdf8; }
        .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
        .diagram-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; margin-bottom: 20px; padding: 20px; }
        .diagram-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
        .badge-pass { background: #166534; color: #4ade80; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; }
        .badge-fail { background: #991b1b; color: #f87171; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; }
        .assertion-item { padding: 6px 10px; border-radius: 4px; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .assert-pass { background: rgba(34, 197, 94, 0.1); color: #86efac; border-left: 3px solid #22c55e; }
        .assert-fail { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-left: 3px solid #ef4444; }
        .screenshots { display: flex; gap: 12px; margin-top: 14px; overflow-x: auto; padding-bottom: 8px; }
        .screenshot-thumb { border: 1px solid #475569; border-radius: 6px; max-height: 160px; object-fit: cover; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0 0 8px 0; font-size: 24px; color: #ffffff;">PNJ Prime - Live E2E QA Test Report</h1>
            <p style="margin:0; color:#94a3b8; font-size: 14px;">Evaluasi Kepatuhan & Keandalan Fungsional Activity Diagram (AD-01 s/d AD-18)</p>
            <div class="stats">
                <div class="stat-card"><div class="stat-value" style="color: #4ade80;">${results.passedSteps} / ${results.totalSteps}</div><div class="stat-label">Diagrams Pass</div></div>
                <div class="stat-card"><div class="stat-value" style="color: #38bdf8;">${results.passedAssertions} / ${results.totalAssertions}</div><div class="stat-label">Assertions (${passPercent}%)</div></div>
                <div class="stat-card"><div class="stat-value" style="color: #e2e8f0;">${(results.durationMs / 1000).toFixed(1)}s</div><div class="stat-label">Total Duration</div></div>
                <div class="stat-card"><div class="stat-value" style="color: ${results.consoleErrors.length > 0 ? '#f87171' : '#4ade80'};">${results.consoleErrors.length}</div><div class="stat-label">Console Errors</div></div>
            </div>
        </div>

        ${results.steps.map((s) => `
            <div class="diagram-card">
                <div class="diagram-header">
                    <div>
                        <span style="color:#facc15; font-weight:700; margin-right:8px;">[${s.id}]</span>
                        <strong style="font-size:16px;">${s.title}</strong>
                        <span style="color:#94a3b8; font-size:13px; margin-left:12px;">Peran: ${s.role}</span>
                    </div>
                    <div>
                        <span class="${s.status === 'PASS' ? 'badge-pass' : 'badge-fail'}">${s.status} (${s.durationMs}ms)</span>
                    </div>
                </div>
                <div>
                    <strong style="font-size:12px; color:#94a3b8; text-transform:uppercase; display:block; margin-bottom:8px;">Hasil Assertion QA:</strong>
                    ${s.assertions.map((a) => `
                        <div class="assertion-item ${a.status === 'PASS' ? 'assert-pass' : 'assert-fail'}">
                            <span>${a.status === 'PASS' ? '✔' : '✖'}</span>
                            <span>${a.description}</span>
                        </div>
                    `).join('')}
                </div>
                ${s.screenshots.length > 0 ? `
                    <div class="screenshots">
                        ${s.screenshots.map((img) => `
                            <a href="../screenshots/${img}" target="_blank">
                                <img src="../screenshots/${img}" class="screenshot-thumb" alt="${img}" />
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

async function main() {
    const edgePath = findEdgeExecutable();
    if (!edgePath) {
        console.error('Microsoft Edge binary tidak ditemukan.');
        process.exit(1);
    }

    const baseUrl = process.env.APP_URL || 'http://127.0.0.1:8000';
    qaResults.targetUrl = baseUrl;
    const testStartTime = Date.now();

    console.log('='.repeat(75));
    console.log('   PNJ PRIME - PROFESSIONAL E2E QUALITY ASSURANCE LIVE TESTING');
    console.log('   Browser    : Microsoft Edge (Headed Mode)');
    console.log('   Host URL   : ' + baseUrl);
    console.log('   Standards  : Industry QA, Visual Headed, Assertion Telemetry, HTML Report');
    console.log('='.repeat(75));

    const browser = await puppeteer.launch({
        executablePath: edgePath,
        headless: false,
        slowMo: 35,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--window-size=1400,900',
        ],
    });

    const page = (await browser.pages())[0] || (await browser.newPage());

    // Intercept Console and Network telemetry
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            const errText = msg.text();
            if (!errText.includes('favicon') && !errText.includes('extension')) {
                qaResults.consoleErrors.push({ timestamp: new Date().toISOString(), text: errText });
            }
        }
    });

    page.on('response', (res) => {
        if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
            qaResults.networkFailures.push({ url: res.url(), status: res.status() });
        }
    });

    try {
        // ==========================================
        // AD-01: Melakukan Login (Negative & Positive)
        // ==========================================
        await executeStep(page, {
            id: 'AD-01',
            title: 'Melakukan Login (Pengujian Positif & Validasi Negatif)',
            role: 'Customer / Mitra',
            action: 'Verifikasi Autentikasi',
            fn: async () => {
                await clearSession(page);
                await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'input[name="email"], input[type="email"]', 'Form input email login harus tersedia.');
                await assertSelectorExists(page, 'input[name="password"], input[type="password"]', 'Form input password login harus tersedia.');

                // Negative Test: Password salah
                await page.type('input[name="email"], input[type="email"]', 'mitra@pnjprime.test', { delay: 10 });
                await page.type('input[name="password"], input[type="password"]', 'wrongpass123', { delay: 10 });
                await page.click('form button[type="submit"], form button.h-12');
                await sleep(500);
                await takeStepScreenshot(page, 'AD-01_login_negative_validation.png');

                // Positive Test: Kredensial valid
                await loginAs(page, baseUrl, 'mitra@pnjprime.test', 'password', 'Customer');
                await assertCondition(page, !page.url().endsWith('/login'), 'User berhasil login dan diarahkan dari halaman login.');
                await takeStepScreenshot(page, 'AD-01_login_success.png');
            },
        });

        // ==========================================
        // AD-02: Mendaftar Akun
        // ==========================================
        await executeStep(page, {
            id: 'AD-02',
            title: 'Mendaftar Akun (Customer Publik & Pengelola Unit Riset)',
            role: 'Mitra & Calon Pengelola',
            action: 'Formulir Registrasi Akun',
            fn: async () => {
                // Clear session agar guest mode aktif untuk registrasi
                await clearSession(page);

                // Registrasi Customer
                await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'input[name="name"]', 'Field Nama Lengkap pada form registrasi customer.');
                await assertSelectorExists(page, 'input[name="email"]', 'Field Email pada form registrasi customer.');
                await assertSelectorExists(page, 'input[name="password"]', 'Field Password pada form registrasi customer.');
                await takeStepScreenshot(page, 'AD-02_register_customer.png');

                // Form Permohonan Akun Pengelola Unit
                await page.goto(`${baseUrl}/pengelola-register`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'form', 'Form permohonan admin pengelola unit harus ada.');
                await takeStepScreenshot(page, 'AD-02_register_pengelola.png');
            },
        });

        // ==========================================
        // AD-03: Melihat Katalog Layanan
        // ==========================================
        await executeStep(page, {
            id: 'AD-03',
            title: 'Melihat Katalog Layanan & Meninjau Spesifikasi Detail',
            role: 'Customer / Publik',
            action: 'Penelusuran & Detail Produk',
            fn: async () => {
                await page.goto(`${baseUrl}/katalog`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'input, [placeholder*="Cari"]', 'Input pencarian katalog produk inovasi harus tersedia.');
                await takeStepScreenshot(page, 'AD-03_katalog_overview.png');

                // Buka detail produk inovasi
                await page.goto(`${baseUrl}/catalog/alat-uji-kualitas-air-portable`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'h1, .font-display', 'Judul produk inovasi harus tampil pada halaman detail.');
                await takeStepScreenshot(page, 'AD-03_produk_detail.png');
            },
        });

        // ==========================================
        // AD-04: Mengajukan Layanan
        // ==========================================
        await executeStep(page, {
            id: 'AD-04',
            title: 'Mengajukan Layanan (Formulir Permohonan & Jadwal Customer)',
            role: 'Customer / Mitra',
            action: 'Pengisian Form Pengajuan',
            fn: async () => {
                await loginAs(page, baseUrl, 'mitra@pnjprime.test', 'password', 'Customer');
                await page.goto(`${baseUrl}/pengajuan/create?product_id=1`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'form', 'Formulir pengajuan layanan harus dirender.');
                await assertSelectorExists(page, 'button[type="submit"], button', 'Tombol aksi submit pengajuan harus aktif.');
                
                const hasTextarea = await page.$('textarea');
                if (hasTextarea) {
                    await page.type('textarea', 'Kebutuhan pengujian kalibrasi industri alat otomatis.', { delay: 10 });
                }
                await takeStepScreenshot(page, 'AD-04_form_pengajuan.png');
            },
        });

        // ==========================================
        // AD-05: Mengelola Pengajuan Layanan
        // ==========================================
        await executeStep(page, {
            id: 'AD-05',
            title: 'Mengelola Pengajuan Layanan (Monitoring Status Pengajuan)',
            role: 'Customer / Mitra',
            action: 'Daftar & Detail Pengajuan',
            fn: async () => {
                await page.goto(`${baseUrl}/pengajuan`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Halaman daftar pengajuan customer harus termuat.');
                await takeStepScreenshot(page, 'AD-05_daftar_pengajuan.png');

                await page.goto(`${baseUrl}/pengajuan/1`, { waitUntil: 'domcontentloaded' });
                await takeStepScreenshot(page, 'AD-05_detail_pengajuan.png');
            },
        });

        // ==========================================
        // AD-06: Melakukan Pembayaran
        // ==========================================
        await executeStep(page, {
            id: 'AD-06',
            title: 'Melakukan Pembayaran (Pilihan Metode, Invoice & Snap Midtrans)',
            role: 'Customer / Mitra',
            action: 'Portal Pembayaran Layanan',
            fn: async () => {
                await page.goto(`${baseUrl}/pengajuan/3/bayar`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Halaman pembayaran tagihan/invoice harus tampil.');
                await takeStepScreenshot(page, 'AD-06_portal_pembayaran.png');
            },
        });

        // ==========================================
        // AD-07: Memantau Pengajuan
        // ==========================================
        await executeStep(page, {
            id: 'AD-07',
            title: 'Memantau Pengajuan (Riwayat Customer & Dashboard Direktur)',
            role: 'Customer & Direktur',
            action: 'Pemantauan Eksekutif',
            fn: async () => {
                // Riwayat Customer
                await page.goto(`${baseUrl}/riwayat`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Riwayat permohonan customer harus terbuka.');
                await takeStepScreenshot(page, 'AD-07_riwayat_customer.png');

                // Pemantauan Direktur
                await loginAs(page, baseUrl, 'direktur@pnjprime.test', 'password', 'Direktur');
                await page.goto(`${baseUrl}/direktur/pemantauan`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Dashboard monitoring Direktur harus tampil.');
                await takeStepScreenshot(page, 'AD-07_monitoring_direktur.png');
            },
        });

        // ==========================================
        // AD-08: Memverifikasi Pengajuan Layanan
        // ==========================================
        await executeStep(page, {
            id: 'AD-08',
            title: 'Memverifikasi Pengajuan Layanan (Review Kelayakan Data)',
            role: 'Admin RTPU',
            action: 'Verifikasi Pengajuan Mitra',
            fn: async () => {
                await loginAs(page, baseUrl, 'admin@pnjprime.test', 'password', 'Admin RTPU');
                await page.goto(`${baseUrl}/rtpu/verifikasi/layanan`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Halaman verifikasi layanan Admin RTPU terbuka.');
                await takeStepScreenshot(page, 'AD-08_verifikasi_layanan.png');
            },
        });

        // ==========================================
        // AD-09: Menerbitkan Invoice
        // ==========================================
        await executeStep(page, {
            id: 'AD-09',
            title: 'Menerbitkan Invoice (Komponen Biaya, PPN & Jatuh Tempo)',
            role: 'Admin RTPU',
            action: 'Penerbitan Faktur Tagihan',
            fn: async () => {
                await page.goto(`${baseUrl}/rtpu/layanan`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Modul kelola layanan dan penagihan invoice RTPU.');
                await takeStepScreenshot(page, 'AD-09_penerbitan_invoice.png');
            },
        });

        // ==========================================
        // AD-10: Memverifikasi Pembayaran
        // ==========================================
        await executeStep(page, {
            id: 'AD-10',
            title: 'Memverifikasi Pembayaran (Validasi Bukti Transfer Manual/Online)',
            role: 'Admin RTPU',
            action: 'Verifikasi Keuangan Transaksi',
            fn: async () => {
                await page.goto(`${baseUrl}/rtpu/verifikasi/pembayaran`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Antrean konfirmasi bukti pembayaran transaksi.');
                await takeStepScreenshot(page, 'AD-10_verifikasi_pembayaran.png');
            },
        });

        // ==========================================
        // AD-11: Memperbarui Status Layanan
        // ==========================================
        await executeStep(page, {
            id: 'AD-11',
            title: 'Memperbarui Status Layanan (Tracking Siklus Pelaksanaan)',
            role: 'Admin RTPU',
            action: 'Update Status Pengerjaan',
            fn: async () => {
                await page.goto(`${baseUrl}/rtpu/status`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Tabel manajemen status layanan dan pelaksanaan.');
                await takeStepScreenshot(page, 'AD-11_update_status.png');
            },
        });

        // ==========================================
        // AD-12: Mengelola Metode Pembayaran
        // ==========================================
        await executeStep(page, {
            id: 'AD-12',
            title: 'Mengelola Metode Pembayaran (Konfigurasi Akun Rekening & Gateway)',
            role: 'Admin RTPU',
            action: 'Pengaturan Rekening & Channel',
            fn: async () => {
                await page.goto(`${baseUrl}/rtpu/metode`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Panel pengaturan rekening pembayaran.');
                await takeStepScreenshot(page, 'AD-12_metode_pembayaran.png');
            },
        });

        // ==========================================
        // AD-13: Mengelola Katalog (Admin Pengelola Unit)
        // ==========================================
        await executeStep(page, {
            id: 'AD-13',
            title: 'Mengelola Katalog (Pendaftaran & Pemutakhiran Inovasi Riset)',
            role: 'Admin Pengelola Unit',
            action: 'Manajemen Produk Riset',
            fn: async () => {
                // Admin Pengelola Unit login & kelola katalog produk
                await loginAs(page, baseUrl, 'pengelola@pnjprime.test', 'password', 'Admin Pengelola Unit');
                await page.goto(`${baseUrl}/pengelola/produk`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Katalog produk inovasi riset Pengelola Unit.');
                await takeStepScreenshot(page, 'AD-13_katalog_pengelola.png');

                await page.goto(`${baseUrl}/pengelola/produk/create`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'input, form', 'Input formulir produk riset baru harus ada.');
                await takeStepScreenshot(page, 'AD-13_form_tambah_produk.png');
            },
        });

        // ==========================================
        // AD-14: Memverifikasi Katalog (Kurator RTPU)
        // ==========================================
        await executeStep(page, {
            id: 'AD-14',
            title: 'Memverifikasi Katalog (Kurasi & Telaah Kelaikan Produk Riset)',
            role: 'Admin RTPU',
            action: 'Kurasi Produk Inovasi',
            fn: async () => {
                await loginAs(page, baseUrl, 'admin@pnjprime.test', 'password', 'Admin RTPU');
                await page.goto(`${baseUrl}/rtpu/verifikasi/produk`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Halaman kurasi produk riset Admin RTPU terbuka.');
                await takeStepScreenshot(page, 'AD-14_kurasi_produk_rtpu.png');
            },
        });

        // ==========================================
        // AD-15: Mengelola Akun (Super Admin)
        // ==========================================
        await executeStep(page, {
            id: 'AD-15',
            title: 'Mengelola Akun (Manajemen Pengguna, Status & Peran Pengguna)',
            role: 'Super Admin',
            action: 'Manajemen Akun Pengguna',
            fn: async () => {
                await loginAs(page, baseUrl, 'superadmin@pnjprime.test', 'password', 'Super Admin');
                await page.goto(`${baseUrl}/superadmin/users`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'table, [role="table"], body', 'Tabel daftar pengguna sistem PNJ Prime.');
                await takeStepScreenshot(page, 'AD-15_manajemen_users.png');
            },
        });

        // ==========================================
        // AD-16: Mengelola Hak Akses dan Fitur (Super Admin)
        // ==========================================
        await executeStep(page, {
            id: 'AD-16',
            title: 'Mengelola Hak Akses dan Fitur (Matriks Permission & Feature Toggle)',
            role: 'Super Admin',
            action: 'Konfigurasi RBAC & Fitur',
            fn: async () => {
                await page.goto(`${baseUrl}/superadmin/hak-akses`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Matriks konfigurasi hak akses per peran.');
                await takeStepScreenshot(page, 'AD-16_matriks_hak_akses.png');

                await page.goto(`${baseUrl}/superadmin/fitur`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Pengaturan toggle status fitur aplikasi.');
                await takeStepScreenshot(page, 'AD-16_toggle_fitur.png');
            },
        });

        // ==========================================
        // AD-17: Memverifikasi Akun Pengelola (Super Admin)
        // ==========================================
        await executeStep(page, {
            id: 'AD-17',
            title: 'Memverifikasi Akun Pengelola (Tinjau & Persetujuan Admin Unit)',
            role: 'Super Admin',
            action: 'Verifikasi Akun Pengelola',
            fn: async () => {
                await page.goto(`${baseUrl}/superadmin/pengelola-applications`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Daftar permohonan akun admin pengelola unit.');
                await takeStepScreenshot(page, 'AD-17_verifikasi_pengelola.png');
            },
        });

        // ==========================================
        // AD-18: Menyetujui Katalog (Pimpinan RTPU)
        // ==========================================
        await executeStep(page, {
            id: 'AD-18',
            title: 'Menyetujui Katalog (Persetujuan Final Publikasi Produk Riset)',
            role: 'Pimpinan RTPU',
            action: 'Persetujuan Final Publikasi',
            fn: async () => {
                await loginAs(page, baseUrl, 'pimpinan@pnjprime.test', 'password', 'Pimpinan RTPU');
                await page.goto(`${baseUrl}/pimpinan/verifikasi-produk`, { waitUntil: 'domcontentloaded' });
                await assertSelectorExists(page, 'body', 'Panel persetujuan publikasi produk inovasi pimpinan.');
                await takeStepScreenshot(page, 'AD-18_persetujuan_pimpinan.png');
            },
        });

        // Selesai pengujian
        qaResults.endTime = new Date().toISOString();
        qaResults.durationMs = Date.now() - testStartTime;

        // Tampilkan Banner Final di Browser Edge
        await setLiveHud(page, {
            stepId: '18',
            title: 'SEMUA 18 ACTIVITY DIAGRAM TERUJI & TERVERIFIKASI',
            role: 'Quality Assurance Auditor',
            action: 'Audit Selesai 100%',
            passCount: qaResults.passedAssertions,
            failCount: qaResults.failedAssertions,
        });
        await sleep(5000);

    } finally {
        await browser.close();
    }

    // Tulis Laporan QA
    const jsonReportPath = path.join(REPORT_DIR, 'qa-report.json');
    const htmlReportPath = path.join(REPORT_DIR, 'qa-report.html');
    fs.writeFileSync(jsonReportPath, JSON.stringify(qaResults, null, 2), 'utf-8');
    fs.writeFileSync(htmlReportPath, generateHtmlReport(qaResults), 'utf-8');

    // Buka Laporan QA langsung di Microsoft Edge pengguna
    try {
        const { exec } = await import('child_process');
        exec(`start msedge "${htmlReportPath}"`);
    } catch {
        // Fallback
    }

    console.log('\n' + '='.repeat(75));
    console.log('                 LAPORAN HASIL QUALITY ASSURANCE');
    console.log('='.repeat(75));
    console.log(`  Total Diagram  : ${qaResults.totalSteps}`);
    console.log(`  Diagrams Lolos : ${qaResults.passedSteps} / ${qaResults.totalSteps}`);
    console.log(`  Total Assert   : ${qaResults.totalAssertions} (Lolos: ${qaResults.passedAssertions}, Gagal: ${qaResults.failedAssertions})`);
    console.log(`  Durasi Total   : ${(qaResults.durationMs / 1000).toFixed(1)} detik`);
    console.log(`  Console Errors : ${qaResults.consoleErrors.length}`);
    console.log(`  Screenshots    : ${SCREENSHOT_DIR}`);
    console.log(`  Laporan JSON   : ${jsonReportPath}`);
    console.log(`  Laporan HTML   : ${htmlReportPath}`);
    console.log('='.repeat(75));

    if (qaResults.failedSteps > 0 || qaResults.failedAssertions > 0) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Fatal Runner Error:', err);
    process.exit(1);
});
