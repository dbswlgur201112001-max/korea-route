const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });
for (const width of [360, 390]) {
  test.describe(`${width}px Today search and nearby`, () => {
    test.use({ viewport: { width, height: 844 } });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.qaGeoCalls = [];
        for (const method of ['getCurrentPosition', 'watchPosition']) {
          navigator.geolocation[method] = (...args) => {
            window.qaGeoCalls.push(method);
            if (args[1]) args[1]({ code: 1, message: 'QA: location unavailable' });
          };
        }
      });
      await page.goto('/');
      await page.getByRole('button', { name: 'Got it', exact: true }).click();
      await expect(page.locator('#home')).toHaveClass(/active/);
    });

    test('search dispatch, nearby actions and Back reuse existing engines', async ({ page }) => {
      await expect(page.locator('#globalSearchBox')).toBeVisible();
      await expect(page.locator('#nearbyEssentials')).toBeVisible();
      for (const id of ['globalSearchBox', 'globalSearchInput', 'globalSearchResults', 'nearbyEssentials']) {
        await expect(page.locator(`#${id}`)).toHaveCount(1);
      }
      expect(await page.evaluate(() => window.qaGeoCalls)).toEqual([]);
      await page.evaluate(() => {
        window.qaCalls = [];
        for (const name of ['runGlobalSearchResult', 'v210QuickAction', 'showCityMapNearby']) {
          const original = window[name];
          window[name] = function (...args) {
            window.qaCalls.push([name, args[0]]);
            return original.apply(this, args);
          };
        }
      });
      await page.locator('#globalSearchInput').fill('Suwon');
      await expect(page.locator('#globalSearchResults')).toBeVisible();
      const city = page.locator('#globalSearchResultList button').filter({ has: page.locator('small', { hasText: 'Open city guide' }) }).first();
      await expect(city).toContainText('Suwon');
      await city.click();
      await expect(page.locator('#city')).toHaveClass(/active/);
      expect(await page.evaluate(() => window.qaCalls.some(c => c[0] === 'runGlobalSearchResult'))).toBe(true);
      await page.goBack();
      await expect(page.locator('#home')).toHaveClass(/active/);
      for (const [label, fn, category] of [['Toilet', 'v210QuickAction', 'toilets'], ['Food', 'v210QuickAction', 'food'], ['Cafe', 'showCityMapNearby', 'cafe']]) {
        await page.locator('#nearbyEssentials').getByRole('button', { name: label, exact: false }).click();
        await expect(page.locator('#city')).toHaveClass(/active/);
        await expect.poll(() => page.evaluate(([fn, category]) => window.qaCalls.some(c => c[0] === fn && c[1] === category), [fn, category])).toBe(true);
        await expect(page.locator('#city')).toHaveClass(/v60-map-mode/);
        // V203 consumes Back to close map/filter layers before leaving the screen.
        for (let back = 0; back < 3 && !(await page.locator('#home').isVisible()); back++) {
          await page.goBack();
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        }
        await expect(page.locator('#home')).toHaveClass(/active/);
      }
    });

    test('localized Today UI, no entry GPS and no horizontal overflow', async ({ page }) => {
      for (const [i, heading, labels, tabs] of [
        [0, 'Find anything fast', ['Toilet', 'Food', 'Cafe'], ['Today', 'Explore', 'Wallet', 'My Trip']],
        [1, '필요한 기능을 바로 찾기', ['화장실', '음식점', '카페'], ['오늘', '둘러보기', '지갑', '내 여행']],
        [2, '必要なものをすぐに検索', ['トイレ', '食事', 'カフェ'], ['今日', '探索', 'ウォレット', 'マイ旅行']],
      ]) {
        await expect(page.locator('#globalSearchBox .global-search-head b')).toHaveText(heading);
        await expect(page.locator('#nearbyEssentials .nearby-essential-btn span')).toHaveText(labels);
        await expect(page.locator('#v60Tabbar button')).toHaveText(tabs);
        await expect(page.locator('#home .v220-core-card')).toHaveCount(4);
        await page.locator('#globalSearchInput').fill('Suwon');
        const descriptions = [
          ['Open city guide', 'Suwon · destination card'],
          ['도시 가이드 열기', '수원 · 목적지 카드'],
          ['都市ガイドを開く', 'Suwon · 目的地カード'],
        ][i];
        await expect(page.locator('#globalSearchResultList small')).toHaveText([
          descriptions[0], descriptions[1], descriptions[1], descriptions[1],
        ]);
        if (i === 2) {
          await expect(page.locator('#globalSearchResults')).not.toContainText('Open city guide');
          await expect(page.locator('#globalSearchResults')).not.toContainText('destination card');
        }
        if (i === 2) await expect(page.locator('#nearbyEssentialsStatus')).toContainText('を中心に検索');
        await expect(page.locator('#globalSearchResultsLabel')).toHaveText(['SEARCH RESULTS', '검색 결과', '検索結果'][i]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        expect(await page.evaluate(() => window.qaGeoCalls)).toEqual([]);
        await page.screenshot({ path: test.info().outputPath(`today-search-${width}-${i}.png`), fullPage: true });
        if (i < 2) await page.locator('#langBtn').click();
      }
      // Japanese descriptions change only presentation; the same city result still opens Suwon.
      await test.info().attach('Japanese search result text', { body: await page.locator('#globalSearchResults').innerText(), contentType: 'text/plain' });
      await page.locator('#globalSearchResultList button').filter({ hasText: '都市ガイドを開く' }).click();
      await expect(page.locator('#city')).toHaveClass(/active/);
      await expect(page.locator('#city')).toHaveAttribute('data-current-city', 'Suwon');
      await page.goBack();
      await expect(page.locator('#home')).toHaveClass(/active/);
    });
  });
}

