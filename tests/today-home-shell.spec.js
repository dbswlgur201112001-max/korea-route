const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });
for (const width of [360, 390]) {
  test.describe(`${width}px Today shell`, () => {
    test.use({ viewport: { width, height: 844 } });
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      const tips = page.getByRole('button', { name: 'Got it', exact: true });
      await expect(tips).toBeVisible();
      await tips.click();
      await expect(page.locator('#home')).toHaveClass(/active/);
    });

    test('four actions and four tabs retain existing destinations and Back', async ({ page }) => {
      const nav = page.locator('#v60Tabbar');
      const actions = page.locator('#home .v220-core-card');
      await expect(actions).toHaveCount(4);
      await expect(actions.locator('b')).toHaveText(['Get there', 'Nearby', 'Scan & translate', 'Help']);
      await expect(nav.locator('button')).toHaveText(['Today', 'Explore', 'Wallet', 'My Trip']);
      for (const card of await actions.all()) {
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      for (const [label, screen, active] of [
        ['Get there', 'moveHub', 'Today'], ['Nearby', 'city', 'Explore'],
        ['Scan & translate', 'helperHub', 'Today'], ['Help', 'helperHub', 'Today'],
      ]) {
        await actions.filter({ has: page.locator('b', { hasText: label }) }).click();
        await expect(page.locator(`#${screen}`)).toHaveClass(/active/);
        await expect(nav.locator('button.active')).toHaveText(active);
        if (label === 'Scan & translate') await expect(page.locator('#helperHub')).toHaveClass(/v118-tools-open/);
        if (label === 'Help') await expect(page.locator('#helperHub')).not.toHaveClass(/v118-tools-open/);
        await nav.getByRole('button', { name: 'Today', exact: true }).click();
        await expect(page.locator('#home')).toHaveClass(/active/);
      }
      for (const [label, screen] of [['Explore', 'exploreHub'], ['Wallet', 'walletHub'], ['My Trip', 'myTripHub']]) {
        await nav.getByRole('button', { name: label, exact: true }).click();
        await expect(page.locator(`#${screen}`)).toHaveClass(/active/);
        await expect(nav.locator('button.active')).toHaveText(label);
        await nav.getByRole('button', { name: 'Today', exact: true }).click();
        await expect(page.locator('#home')).toHaveClass(/active/);
      }
      await actions.filter({ has: page.locator('b', { hasText: 'Get there' }) }).click();
      await expect(page.locator('#moveHub')).toHaveClass(/active/);
      await page.goBack();
      await expect(page.locator('#home')).toHaveClass(/active/);
    });

    test('explicit EN / KO / JA shell labels', async ({ page }) => {
      const cases = [
        [['Get there', 'Nearby', 'Scan & translate', 'Help'], ['Today', 'Explore', 'Wallet', 'My Trip']],
        [['이동하기', '주변 찾기', '사진·번역', '도움'], ['오늘', '둘러보기', '지갑', '내 여행']],
        [['移動する', '周辺をさがす', '撮影・翻訳', 'ヘルプ'], ['今日', '探索', 'ウォレット', 'マイ旅行']],
      ];
      for (const [i, [actions, tabs]] of cases.entries()) {
        await expect(page.locator('#home .v220-core-card b')).toHaveText(actions);
        await expect(page.locator('#v60Tabbar button')).toHaveText(tabs);
        const lang = ['en', 'ko', 'ja'][i];
        for (const el of await page.locator('#home .v220-core-card [data-en], #v60Tabbar [data-en]').all()) {
          const expected = await el.getAttribute(`data-${lang}`);
          expect(expected).not.toBeNull();
          await expect(el).toHaveText(expected);
        }
        if (i < 2) await page.locator('#langBtn').click();
      }
      await page.screenshot({ path: test.info().outputPath(`today-${width}-ja.png`), fullPage: true });
    });
  });
}
