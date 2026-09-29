const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });
async function enter(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
}
for (const width of [360, 390, 430]) {
  test(`${width}px editorial Home: local photos, readable locales, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await enter(page);
    for (const language of ['en', 'ko', 'ja']) {
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      for (const element of await page.locator('.kr-home-hero [data-en], .kr-travel-pack [data-en], .kr-time-slip [data-en], .kr-destinations [data-en]').all()) {
        expect(await element.evaluate((el, language) => {
          const expected = document.createElement('span');
          expected.innerHTML = el.getAttribute('data-' + language);
          return expected.textContent === el.textContent;
        }, language)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const presentation = await page.evaluate(() => {
        const title = document.querySelector('#krHomeTitle');
        const cta = document.querySelector('.kr-home-hero button');
        const cards = [...document.querySelectorAll('.kr-destinations .v220-course-card')];
        const bounds = cards.map(card => card.getBoundingClientRect());
        return {
          titleLines: title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight),
          ctaHeight: cta.getBoundingClientRect().height,
          ctaRadius: parseFloat(getComputedStyle(cta).borderRadius),
          cardWidth: bounds[0].width / innerWidth,
          nextVisible: (innerWidth - bounds[1].left) / innerWidth,
          imageInsets: cards.map(card => parseFloat(getComputedStyle(card).paddingLeft)),
          photoBottom: document.querySelector('.kr-hero-photo').getBoundingClientRect().bottom,
        };
      });
      expect(presentation.titleLines).toBeLessThanOrEqual(2.05);
      expect(presentation.ctaHeight).toBeGreaterThanOrEqual(52);
      expect(presentation.ctaRadius).toBeLessThanOrEqual(12);
      expect(presentation.cardWidth).toBeGreaterThanOrEqual(.76);
      expect(presentation.cardWidth).toBeLessThanOrEqual(.82);
      expect(presentation.nextVisible).toBeGreaterThanOrEqual(.12);
      expect(presentation.nextVisible).toBeLessThanOrEqual(.18);
      expect(presentation.imageInsets).toEqual([0, 0, 0]);
      expect(presentation.photoBottom).toBeLessThan(600);
      await expect(page.locator('.kr-city-story')).toHaveCount(3);
      await expect(page.locator('#home .v220-core-card')).toHaveCount(4);
      await expect(page.locator('#v60Tabbar button')).toHaveCount(4);
      for (const id of ['globalSearchInput', 'nearbyEssentials', 'todayTripSummary']) {
        await expect(page.locator('#' + id)).toBeVisible();
      }
      await page.evaluate(async () => {
        await Promise.all([...document.querySelectorAll('.kr-home-editorial img')].map(img => {
          img.loading = 'eager'; return img.decode();
        }));
      });
      expect(await page.locator('.kr-home-editorial img').evaluateAll(images => images.every(img => img.naturalWidth >= 400))).toBe(true);
      for (const link of await page.locator('.kr-collectible-stack a').all()) {
        const box = await link.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      if (language !== 'ja') await page.locator('#langBtn').click();
    }
    expect(errors).toEqual([]);
  });

  test(`${width}px Home CTAs retain existing destinations, Suwon route and Back`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await enter(page);
    await page.locator('.kr-home-hero button').click();
    await expect(page.locator('#exploreHub')).toHaveClass(/active/);
    await page.goBack();
    await expect(page.locator('#home')).toHaveClass(/active/);
    for (const city of ['Seoul', 'Busan', 'Jeju']) {
      await page.locator('.kr-destinations button').filter({ has: page.locator('b', { hasText: city }) }).click();
      await expect(page.locator('#city')).toHaveClass(/active/);
      await page.goBack();
      await expect(page.locator('#home')).toHaveClass(/active/);
    }
    await page.getByRole('link', { name: 'Discover Suwon', exact: false }).click();
    await expect(page.locator('#suwonStartShell')).toBeVisible();
    await page.locator('#suwonStartShell .suwon-start-cta').click();
    await expect(page.locator('#suwonStartShell')).toHaveClass(/route-open/);
    expect(await page.locator('.kr-collectible-stack a').evaluateAll(links => links.map(a => a.getAttribute('href')))).toEqual(['/t/suwon-001', '/t/suwon-002', '/t/suwon-003']);
    await expect(page.locator('.kr-memory-link')).toHaveAttribute('href', '/t');
  });
}

test('visual Home reads existing storage without writes or automatic permissions', async ({ page }) => {
  await page.addInitScript(() => {
    window.permissionCalls = [];
    for (const name of ['getCurrentPosition', 'watchPosition']) {
      navigator.geolocation[name] = () => window.permissionCalls.push(name);
    }
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => {
      window.permissionCalls.push('media'); return Promise.reject(new Error('No permission expected'));
    };
  });
  await enter(page);
  const audit = await page.evaluate(() => {
    sessionStorage.setItem('koreaRouteTrip', '{"start":"Seoul","dest":"Suwon","date":"2026-09-29","days":3}');
    localStorage.setItem('koreaRouteSavedTrip', sessionStorage.getItem('koreaRouteTrip'));
    localStorage.setItem('koreaRouteExpenseLedger', '{"version":1,"records":[]}');
    const before = { local: { ...localStorage }, session: { ...sessionStorage } };
    let writes = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) { writes++; return original.apply(this, args); };
    try {
      for (const language of ['en', 'ko', 'ja']) { lang = language; renderHomeTripSummary(); }
      return { before, after: { local: { ...localStorage }, session: { ...sessionStorage } }, writes, permissions: window.permissionCalls };
    } finally { Storage.prototype.setItem = original; }
  });
  expect(audit.after).toEqual(audit.before);
  expect(audit.writes).toBe(0);
  expect(audit.permissions).toEqual([]);
});
