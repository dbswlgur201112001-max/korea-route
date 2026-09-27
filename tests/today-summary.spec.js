const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });
const seed = {
  koreaRouteTrip: { start: 'Seoul', dest: 'Suwon', days: 4, people: 2 },
  koreaRouteStayArea: { city: 'Suwon', id: 'suwon-station', nameEn: 'Suwon Station Area', nameKo: '수원역 권역' },
  koreaRouteWallet: { city: 'Suwon', style: 'balanced', days: 4, people: 2, total: 320000 },
  koreaRouteTripChecklist: { passport: true, payment: true },
  koreaRouteSavedPlaces: [{ key: 'Suwon::Hwaseong', city: 'Suwon', en: 'Hwaseong', ko: '화성', lat: 37.28, lng: 127.01 }],
};
const labels = [
  ['Trip overview', ['Route', 'Stay', 'Budget', 'Checklist', 'Saved places'], 'Open My Trip', 'Not set'],
  ['여행 요약', ['이동', '숙소', '예산', '체크리스트', '저장 장소'], '내 여행 열기', '미설정'],
  ['旅行サマリー', ['移動', '宿泊', '予算', 'チェックリスト', '保存した場所'], 'マイ旅行を開く', '未設定'],
];
async function start(page, data = {}) {
  await page.addInitScript(data => { for (const [key, value] of Object.entries(data)) sessionStorage.setItem(key, JSON.stringify(value)); }, data);
  await page.goto('/');
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
}
for (const width of [360, 390]) {
  test.describe(`${width}px read-only Today summary`, () => {
    test.use({ viewport: { width, height: 844 } });
    test('empty state is localized, preserves shell and opens Planner', async ({ page }) => {
      await start(page);
      const card = page.locator('#todayTripSummary');
      const empty = [
        ['No trip saved yet', 'Add a plan to see your trip summary here.', 'Add a plan'],
        ['아직 저장된 여행이 없어요', '일정을 추가하면 여기에서 여행 요약을 볼 수 있어요.', '일정 추가'],
        ['保存された旅行はまだありません', '予定を追加すると、ここで旅行の概要を確認できます。', '予定を追加'],
      ];
      for (let i = 0; i < 3; i++) {
        await expect(card).toBeVisible();
        await expect(card.locator('h2')).toHaveText(labels[i][0]);
        await expect(card.locator('h3')).toHaveText(empty[i][0]);
        await expect(card).toContainText(empty[i][1]);
        await expect(card.getByRole('button')).toHaveText(empty[i][2]);
        await expect(card.locator('dl')).toHaveCount(0);
        await expect(page.locator('#globalSearchBox')).toBeVisible();
        await expect(page.locator('#nearbyEssentials')).toBeVisible();
        await expect(page.locator('#home .v220-core-card')).toHaveCount(4);
        await expect(page.locator('#v60Tabbar button')).toHaveCount(4);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        if (i < 2) await page.locator('#langBtn').click();
      }
      await card.getByRole('button', { name: '予定を追加' }).click();
      await expect(page.locator('#planner')).toHaveClass(/active/);
    });
    test('existing storage values, explicit locales and My Trip entry', async ({ page }) => {
      await start(page, seed);
      const card = page.locator('#todayTripSummary');
      for (let i = 0; i < 3; i++) {
        await expect(card.locator('h2')).toHaveText(labels[i][0]);
        await expect(card.locator('dt')).toHaveText(labels[i][1]);
        await expect(card.locator('dd')).toHaveText([
          'Seoul → Suwon', ['Suwon Station Area · Suwon', '수원역 권역 · Suwon', 'Suwon Station エリア · Suwon'][i], 'KRW 320000', '2 / 6', '1',
        ]);
        await expect(card.getByRole('button')).toHaveText(labels[i][2]);
        if (i === 2) await expect(card).not.toContainText(/Trip overview|Route|Stay|Budget|Checklist|Saved places|Open My Trip|Not set/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        if (i < 2) await page.locator('#langBtn').click();
      }
      // The renderer itself must not write any existing or new storage keys.
      expect(await page.evaluate(() => {
        const before = JSON.stringify([Object.entries(sessionStorage), Object.entries(localStorage)]);
        renderHomeTripSummary();
        return before === JSON.stringify([Object.entries(sessionStorage), Object.entries(localStorage)]);
      })).toBe(true);
      await page.screenshot({ path: test.info().outputPath(`summary-${width}-ja.png`), fullPage: true });
      await card.getByRole('button').click();
      await expect(page.locator('#myTripHub')).toHaveClass(/active/);
    });
    test('Today return refreshes changed data and not-set fields without defaults', async ({ page }) => {
      await start(page, { koreaRouteTrip: seed.koreaRouteTrip });
      const card = page.locator('#todayTripSummary');
      for (let i = 0; i < 3; i++) {
        await expect(card.locator('dd')).toHaveText(['Seoul → Suwon', labels[i][3], labels[i][3], labels[i][3], '0']);
        if (i < 2) await page.locator('#langBtn').click();
      }
      await card.getByRole('button').click();
      await expect(page.locator('#myTripHub')).toHaveClass(/active/);
      await page.evaluate(() => sessionStorage.setItem('koreaRouteTrip', JSON.stringify({ start: 'Suwon', dest: 'Busan' })));
      await page.locator('#v60Tabbar').getByRole('button', { name: '今日', exact: true }).click();
      await expect(card.locator('dd').first()).toHaveText('Suwon → Busan');
      await expect(page.locator('#myTripTodayCard')).toHaveCount(1);
      await expect(page.locator('#myTripOfflineSnapshot')).toHaveCount(1);
    });
  });
}
