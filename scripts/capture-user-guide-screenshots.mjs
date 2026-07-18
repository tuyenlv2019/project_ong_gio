/**
 * Chụp ảnh màn hình thật từ ứng dụng cho tài liệu hướng dẫn end user.
 * Mỗi ảnh có badge số đỏ gắn trực tiếp lên vùng mô tả trong tài liệu.
 *
 * Yêu cầu: API (5273) và frontend Vite (5173) đang chạy.
 * Chạy: npm run capture-guide-screenshots
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../docs/huong-dan-su-dung/images');
const API = process.env.API_URL ?? 'http://localhost:5273';
const WEB = process.env.WEB_URL ?? 'http://localhost:5173';
const VIEWPORT = { width: 1600, height: 900 };
const SIDEBAR_WIDTH = 240;
const LAYOUT_GUTTER = 120;

async function widenForFullTable(page) {
  const tableWidth = await page.evaluate(() => {
    let max = 0;
    document.querySelectorAll('.brand-list-table table, .order-product-table table').forEach((table) => {
      max = Math.max(max, table.scrollWidth || table.offsetWidth || 0);
    });
    return max;
  });

  const viewportWidth = Math.min(
    3840,
    Math.max(VIEWPORT.width, tableWidth + SIDEBAR_WIDTH + LAYOUT_GUTTER),
  );

  await page.setViewportSize({ width: viewportWidth, height: VIEWPORT.height });

  await page.evaluate(() => {
    document.body.classList.add('guide-screenshot-expand');
    const styleId = 'guide-screenshot-expand-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .guide-screenshot-expand .ant-table-body,
        .guide-screenshot-expand .ant-table-content,
        .guide-screenshot-expand .ant-table-container,
        .guide-screenshot-expand .ant-table {
          overflow: visible !important;
          max-height: none !important;
        }
        .guide-screenshot-expand .layout-content,
        .guide-screenshot-expand .ant-card-body {
          overflow-x: visible !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.querySelectorAll('.ant-table-body').forEach((el) => {
      el.scrollLeft = 0;
    });
  });

  await page.waitForTimeout(500);
  await preparePage(page);
}

function parseCaptchaFromSvgBase64(imageBase64) {
  const svg = Buffer.from(imageBase64, 'base64').toString('utf8');
  return [...svg.matchAll(/<text[^>]*>([^<])<\/text>/g)].map((m) => m[1]).join('');
}

async function loginViaApi() {
  const captchaRes = await fetch(`${API}/api/auth/captcha`);
  if (!captchaRes.ok) throw new Error(`Captcha API lỗi: ${captchaRes.status}`);
  const captcha = await captchaRes.json();
  const captchaValue = parseCaptchaFromSvgBase64(captcha.imageBase64);

  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenDangNhap: 'admin',
      matKhau: 'admin123',
      captchaToken: captcha.token,
      captchaValue,
    }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error(`Login API lỗi: ${loginRes.status} ${err}`);
  }

  return loginRes.json();
}

async function preparePage(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = 'auto';
  });
}

async function waitBrandTheme(page) {
  await page.waitForFunction(() => {
    const sider = document.querySelector('.brand-sider');
    if (!sider) return true;
    const image = getComputedStyle(sider).backgroundImage;
    return image.includes('linear-gradient');
  }, { timeout: 15000 });
}

async function waitAppReady(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await waitBrandTheme(page);
  await page.waitForTimeout(1200);
  await preparePage(page);
}

async function waitForStableHeight(page, attempts = 6) {
  let lastHeight = 0;
  for (let i = 0; i < attempts; i += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (height === lastHeight && height > 0) return;
    lastHeight = height;
    await page.waitForTimeout(400);
  }
}

/** @typedef {{ label: string; x: number; y: number }} MarkerPoint */

/**
 * @param {import('playwright').Locator} locator
 * @param {string} label
 * @param {'top-left' | 'top-right' | 'center' | 'center-left' | 'bottom-left'} [anchor]
 * @returns {Promise<MarkerPoint | null>}
 */
async function markerFromLocator(locator, label, anchor = 'top-left') {
  const target = locator.first();
  if ((await target.count()) === 0) return null;
  const box = await target.boundingBox();
  if (!box) return null;

  const scroll = await locator.page().evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY,
  }));

  let x = box.x + scroll.x;
  let y = box.y + scroll.y;

  switch (anchor) {
    case 'top-right':
      x += box.width - 18;
      y -= 18;
      break;
    case 'center':
      x += box.width / 2 - 18;
      y += box.height / 2 - 18;
      break;
    case 'center-left':
      x -= 22;
      y += box.height / 2 - 18;
      break;
    case 'bottom-left':
      x -= 18;
      y += box.height - 18;
      break;
    default:
      x -= 18;
      y -= 18;
  }

  return { label, x: Math.max(4, x), y: Math.max(4, y) };
}

/**
 * @param {import('playwright').Page} page
 * @param {Array<Promise<MarkerPoint | null>>} markerPromises
 */
async function paintMarkers(page, markerPromises) {
  const markers = (await Promise.all(markerPromises)).filter(Boolean);
  await page.evaluate((items) => {
    document.getElementById('guide-annotation-style')?.remove();
    document.getElementById('guide-annotation-root')?.remove();

    const style = document.createElement('style');
    style.id = 'guide-annotation-style';
    style.textContent = `
      #guide-annotation-root {
        position: absolute;
        left: 0;
        top: 0;
        width: 0;
        height: 0;
        z-index: 2147483647;
        pointer-events: none;
      }
      .guide-marker-badge {
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #ff4d4f;
        color: #fff;
        font-family: Arial, Helvetica, sans-serif;
        font-weight: 800;
        font-size: 18px;
        line-height: 36px;
        text-align: center;
        border: 3px solid #fff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
      }
    `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'guide-annotation-root';
    document.body.appendChild(root);

    for (const item of items) {
      const badge = document.createElement('div');
      badge.className = 'guide-marker-badge';
      badge.textContent = item.label;
      badge.style.left = `${item.x}px`;
      badge.style.top = `${item.y}px`;
      root.appendChild(badge);
    }
  }, markers);

  return markers.length;
}

async function clearMarkers(page) {
  await page.evaluate(() => {
    document.getElementById('guide-annotation-root')?.remove();
    document.getElementById('guide-annotation-style')?.remove();
  });
}

/**
 * @param {import('playwright').Page} page
 * @param {string} name
 * @param {() => Array<Promise<MarkerPoint | null>>} buildMarkers
 */
async function shotPage(page, name, buildMarkers = () => [], options = {}) {
  if (options.widenTable) {
    await widenForFullTable(page);
  }

  await waitForStableHeight(page);
  await preparePage(page);

  const markerCount = await paintMarkers(page, buildMarkers());
  const file = path.join(OUT_DIR, name);

  await page.screenshot({
    path: file,
    fullPage: true,
    animations: 'disabled',
  });

  await clearMarkers(page);
  console.log(`  ✓ ${name} (${markerCount} số trên ảnh)`);
}

function loginMarkers(page) {
  return [
    markerFromLocator(page.getByPlaceholder('Tên đăng nhập'), '1'),
    markerFromLocator(page.locator('input[type="password"]').first(), '2'),
    markerFromLocator(page.getByPlaceholder(/Nhập ký tự|Đang tải captcha/), '3'),
    markerFromLocator(page.getByRole('button', { name: 'Đăng nhập' }), '4', 'center-left'),
  ];
}

function layoutMarkers(page) {
  return [
    markerFromLocator(page.locator('.brand-sider'), '1', 'top-right'),
    markerFromLocator(page.locator('.brand-sider-toggle'), '2'),
    markerFromLocator(page.locator('.brand-header-user'), '3', 'center-left'),
    markerFromLocator(page.locator('.layout-content'), '4', 'top-left'),
    markerFromLocator(page.locator('.site-footer--sidebar'), '5', 'top-left'),
  ];
}

function dashboardMarkers(page) {
  return [
    markerFromLocator(page.getByRole('button', { name: '+ Tạo đơn hàng' }), '1'),
    markerFromLocator(page.getByText('Tổng đơn hàng', { exact: true }), '2'),
    markerFromLocator(page.getByText('Doanh thu (hoàn thành)', { exact: true }), '3'),
    markerFromLocator(page.getByText('Sản phẩm', { exact: true }), '4'),
  ];
}

function ordersMarkers(page) {
  return [
    markerFromLocator(page.getByPlaceholder('Tìm kiếm trong danh sách...'), '1'),
    markerFromLocator(page.getByRole('button', { name: /Tạo đơn hàng/ }), '2'),
    markerFromLocator(page.locator('.brand-list-table .ant-table-thead'), '3', 'top-left'),
    markerFromLocator(page.locator('.brand-list-table .ant-select').first(), '4'),
    markerFromLocator(page.locator('.brand-list-table tbody tr').first().locator('td').last(), '5', 'center'),
  ];
}

function orderFormCreateMarkers(page) {
  return [
    markerFromLocator(page.locator('.order-order-info-card'), '1', 'top-left'),
    markerFromLocator(page.locator('.order-product-table'), '2', 'top-left'),
    markerFromLocator(page.getByText('Tổng trước thuế:', { exact: true }), '3'),
    markerFromLocator(page.getByRole('button', { name: 'Lưu đơn hàng' }), '4'),
  ];
}

function orderFormEditMarkers(page) {
  return [
    markerFromLocator(page.getByRole('heading', { name: 'Sửa đơn hàng' }), '1'),
    markerFromLocator(page.locator('.order-order-info-card'), '2', 'top-left'),
    markerFromLocator(page.locator('.order-product-table'), '3', 'top-left'),
    markerFromLocator(page.getByText('Tổng trước thuế:', { exact: true }), '4'),
    markerFromLocator(page.getByRole('button', { name: 'Lưu đơn hàng' }), '5'),
  ];
}

function materialsMarkers(page) {
  return [
    markerFromLocator(page.getByRole('button', { name: /Thêm loại tôn/ }), '1'),
    markerFromLocator(page.getByPlaceholder('Tìm kiếm trong danh sách...'), '2'),
    markerFromLocator(page.locator('.brand-list-table .ant-table'), '3', 'top-left'),
    markerFromLocator(page.locator('.brand-list-table tbody tr').first().locator('td').last(), '4', 'center'),
  ];
}

function productsListMarkers(page) {
  return [
    markerFromLocator(page.getByRole('button', { name: /Thêm sản phẩm/ }), '1'),
    markerFromLocator(page.getByPlaceholder('Tìm kiếm trong danh sách...'), '2'),
    markerFromLocator(page.locator('.brand-list-table .ant-table'), '3', 'top-left'),
    markerFromLocator(page.locator('.brand-list-table tbody tr').first().locator('td').last(), '4', 'center'),
  ];
}

function productModalMarkers(page) {
  const modal = page.locator('.ant-modal:visible');
  return [
    markerFromLocator(modal.getByLabel('Tên nhóm'), '1'),
    markerFromLocator(modal.locator('.ant-form-item').filter({ hasText: 'Ảnh minh họa' }), '2', 'top-left'),
    markerFromLocator(modal.locator('.ant-form-item').filter({ hasText: 'Công thức tính diện tích' }), '3', 'top-left'),
    markerFromLocator(modal.getByText('Tham số người dùng nhập', { exact: false }), '4'),
    markerFromLocator(modal.locator('.ant-modal-footer'), '5', 'bottom-left'),
  ];
}

function usersMarkers(page) {
  const firstRow = page.locator('.brand-list-table tbody tr.ant-table-row').first();
  return [
    markerFromLocator(page.getByRole('button', { name: /Thêm user/ }), '1'),
    markerFromLocator(page.locator('.brand-list-table .ant-table-thead'), '2', 'top-left'),
    markerFromLocator(firstRow.locator('td').nth(3), '3', 'center'),
    markerFromLocator(firstRow.locator('button').nth(1), '4'),
    markerFromLocator(firstRow.locator('td').last(), '5', 'center'),
  ];
}

function changePasswordMarkers(page) {
  const modal = page.locator('.ant-modal:visible');
  return [
    markerFromLocator(page.locator('.brand-header-user button'), '1'),
    markerFromLocator(modal.getByLabel('Mật khẩu hiện tại'), '2'),
    markerFromLocator(modal.getByLabel('Mật khẩu mới'), '3'),
    markerFromLocator(modal.getByLabel('Xác nhận mật khẩu mới'), '4'),
    markerFromLocator(modal.getByRole('button', { name: 'Lưu' }), '5'),
  ];
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log('Đăng nhập API...');
  const session = await loginViaApi();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'vi-VN',
    deviceScaleFactor: 1,
  });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('sidebarCollapsed', '0');
  }, { token: session.token, user: session.user });

  const page = await context.newPage();

  console.log('Chụp màn hình có đánh số...');

  const loginPage = await context.newPage();
  await loginPage.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(loginPage);
  await shotPage(loginPage, '01-dang-nhap.png', () => loginMarkers(loginPage));
  await loginPage.close();

  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.layout-content, .brand-header', { timeout: 15000 });
  await shotPage(page, '02-dashboard.png', () => dashboardMarkers(page));

  await page.goto(`${WEB}/don-hang`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.brand-list-table', { timeout: 15000 });
  await shotPage(page, '03-quan-ly-don-hang.png', () => ordersMarkers(page), { widenTable: true });

  await page.goto(`${WEB}/don-hang/tao-moi`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.order-product-cluster-card, .order-form-sticky-header', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shotPage(page, '04-form-don-hang-tao-moi.png', () => orderFormCreateMarkers(page), { widenTable: true });

  const ordersRes = await fetch(`${API}/api/bao-gia`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (ordersRes.ok) {
    const orders = await ordersRes.json();
    if (orders.length > 0) {
      await page.goto(`${WEB}/don-hang/${orders[0].id}`, { waitUntil: 'domcontentloaded' });
      await waitAppReady(page);
      await page.waitForSelector('.order-product-cluster-card, .order-form-sticky-header', { timeout: 20000 });
      await page.waitForTimeout(1500);
      await shotPage(page, '05-form-don-hang-sua.png', () => orderFormEditMarkers(page), { widenTable: true });
    }
  }

  await page.goto(`${WEB}/nguyen-lieu`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.brand-list-table', { timeout: 15000 });
  await shotPage(page, '06-quan-ly-nguyen-lieu.png', () => materialsMarkers(page), { widenTable: true });

  await page.goto(`${WEB}/san-pham`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.brand-list-table', { timeout: 15000 });
  await shotPage(page, '07-quan-ly-san-pham.png', () => productsListMarkers(page), { widenTable: true });

  try {
    const editProductBtn = page.locator('.brand-list-table tbody tr button').first();
    await editProductBtn.waitFor({ state: 'visible', timeout: 8000 });
    await editProductBtn.click();
    await page.waitForSelector('.ant-modal:visible', { timeout: 8000 });
    await page.waitForTimeout(800);
    await shotPage(page, '08-modal-san-pham.png', () => productModalMarkers(page));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  } catch (err) {
    console.warn('  ! Bỏ qua 08-modal-san-pham.png:', err.message);
  }

  await page.goto(`${WEB}/nguoi-dung`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.brand-list-table', { timeout: 15000 });
  await shotPage(page, '09-quan-ly-user.png', () => usersMarkers(page), { widenTable: true });

  try {
    await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
    await waitAppReady(page);
    await page.locator('.brand-header-user button').click();
    await page.getByText('Đổi mật khẩu').click();
    await page.waitForSelector('.ant-modal:visible', { timeout: 8000 });
    await page.waitForTimeout(600);
    await shotPage(page, '10-doi-mat-khau.png', () => changePasswordMarkers(page));
    await page.keyboard.press('Escape');
  } catch (err) {
    console.warn('  ! Bỏ qua 10-doi-mat-khau.png:', err.message);
  }

  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await waitAppReady(page);
  await page.waitForSelector('.brand-sider', { timeout: 15000 });
  await shotPage(page, '11-menu-he-thong.png', () => layoutMarkers(page));

  await browser.close();
  console.log(`\nHoàn tất. Ảnh lưu tại: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
