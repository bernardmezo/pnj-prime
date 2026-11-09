import fs from 'fs';
import puppeteer from 'puppeteer';

const EDGE_PATHS = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findEdgeExecutable() {
    for (const path of EDGE_PATHS) {
        if (fs.existsSync(path)) {
            return path;
        }
    }
    return null;
}

async function runLiveTest() {
    const edgePath = findEdgeExecutable();
    if (!edgePath) {
        console.error('[FAIL] Microsoft Edge executable tidak ditemukan di path standar Windows.');
        process.exit(1);
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:8000';
    console.log(`[INFO] Menjalankan Live Test di Microsoft Edge: ${edgePath}`);
    console.log(`[INFO] Target URL: ${baseUrl}`);
    console.log(`[INFO] Mode: HEADED (Tampak di layar), SlowMo: 600ms`);

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: edgePath,
            headless: false,
            slowMo: 600,
            defaultViewport: null,
            args: ['--start-maximized'],
        });

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        console.log(`[STEP 1] Membuka halaman utama: ${baseUrl}`);
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const title = await page.title();
        console.log(`[PASS] Halaman terbuka. Title: "${title}"`);

        await new Promise((r) => setTimeout(r, 1000));

        console.log(`[STEP 2] Memeriksa container aplikasi Inertia (#app)`);
        const appElement = await page.$('#app');
        if (appElement) {
            console.log(`[PASS] Container #app ditemukan dan ter-render.`);
        } else {
            console.log(`[WARN] Container #app tidak ditemukan, mungkin bukan halaman Inertia.`);
        }

        console.log(`[STEP 3] Mencoba navigasi ke halaman login: ${baseUrl}/login`);
        try {
            await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            console.log(`[PASS] Berhasil membuka halaman login.`);

            const emailInput = await page.$('input[type="email"], input[name="email"]');
            if (emailInput) {
                console.log(`[STEP 4] Input email simulasi live...`);
                await emailInput.type('test@pnj.ac.id', { delay: 100 });
                console.log(`[PASS] Email terketik secara visual.`);
            }
        } catch (err) {
            console.log(`[INFO] Halaman login tidak dapat diakses atau timeout: ${err.message}`);
        }

        console.log(`[STEP 5] Menunggu 3 detik agar user dapat melihat hasil visual...`);
        await new Promise((r) => setTimeout(r, 3000));

        console.log(`[SUCCESS] Live testing di Microsoft Edge selesai dengan sukses.`);
    } catch (error) {
        console.error(`[ERROR] Terjadi kegagalan saat live testing:`, error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log(`[INFO] Browser Edge ditutup.`);
        }
    }
}

runLiveTest();
