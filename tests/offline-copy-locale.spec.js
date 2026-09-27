const { test, expect } = require('@playwright/test');

// Isolated mobile contexts prevent old service workers and user data affecting QA.
test.use({ serviceWorkers: 'block', timezoneId: 'Asia/Seoul' });

for (const count of [0, 2]) {
  test(`Offline Copy localizes ${count} places and saved date across EN/KO/JA`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-27T03:16:00Z') });
    await page.addInitScript(({ count }) => {
      localStorage.setItem('koreaRouteLang', 'en');
      sessionStorage.setItem('koreaRouteLang', 'en');
      // Seed only saved places; the copy and timestamp are created through the UI.
      sessionStorage.setItem('koreaRouteSavedPlaces', JSON.stringify(
        Array.from({ length: count }, (_, i) => ({ id: `qa-${i}`, name: `QA place ${i}` }))
      ));
    }, { count });
    await page.goto('/');
    const tips = page.getByRole('button', { name: 'Got it', exact: true });
    if (await tips.isVisible()) await tips.click();
    await page.getByRole('button', { name: 'My Trip', exact: true }).click();
    const copy = page.locator('#myTripOfflineSnapshot');
    await copy.getByRole('button', { name: /^(Save offline copy|Update offline copy)$/ }).click();

    const cases = [
      { countText: `${count} places`, date: 'Last saved · Sep 27, 2026, 12:16 PM', next: 'EN / 한국어 / 日本語' },
      { countText: `${count}곳`, date: '마지막 저장 · 2026년 9월 27일 오후 12:16', next: '한국어 / 日本語 / EN' },
      { countText: `${count}か所`, date: '最終保存 · 2026年9月27日 12:16' },
    ];
    for (const entry of cases) {
      await expect(copy.locator('.offline-trip-badge')).toHaveText(entry.countText);
      await expect(copy.locator('.offline-trip-status')).toHaveText(entry.date);
      if (entry.next) await page.getByRole('button', { name: entry.next, exact: true }).click();
    }
    await expect(copy).not.toContainText(/places|No offline copy|Save now|Sep|AM|PM/);
  });
}
