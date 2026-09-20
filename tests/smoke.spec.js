const { test, expect } = require('@playwright/test');

const requiredJsonFiles = [
  'air-quality-help.json',
  'cash-and-convenience.json',
  'dietary-map.json',
  'foreigner-access.json',
  'hospital-help.json',
  'indoor-transfer-guide.json',
  'kiosk-help.json',
  'payment-access.json',
  'pre-arrival.json',
  'price-baseline.json',
  'solo-safety.json',
  'taxi-fare.json',
  'two-way-talk.json',
];

test.describe('KOREA ROUTE baseline smoke', () => {
  test('home page loads on a mobile viewport', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(response, 'home page should return a response').not.toBeNull();
    expect(response.ok(), 'home page should return HTTP 2xx').toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(0);
  });

  test('PWA manifest and service worker are reachable', async ({ request }) => {
    const manifestResponse = await request.get('/manifest.json');
    expect(manifestResponse.ok()).toBeTruthy();

    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Korea Route');
    expect(manifest.start_url).toBe('/');

    const serviceWorkerResponse = await request.get('/sw.js');
    expect(serviceWorkerResponse.ok()).toBeTruthy();
  });

  test('required travel data files are present and valid JSON', async ({ request }) => {
    for (const file of requiredJsonFiles) {
      const response = await request.get('/' + file);
      expect(response.ok(), file + ' should be reachable').toBeTruthy();
      await expect(async () => response.json()).not.toThrow();
    }
  });

  test('NFC card landing shell loads', async ({ page }) => {
    const response = await page.goto('/nfc-card.html', {
      waitUntil: 'domcontentloaded',
    });

    expect(response, 'NFC page should return a response').not.toBeNull();
    expect(response.ok(), 'NFC page should return HTTP 2xx').toBeTruthy();
    await expect(page.locator('#kr-card-main')).toBeVisible();
  });
});
