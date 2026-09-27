const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers: 'block' });
const trip = (date = '2026-09-27', days = '3') => ({ start: 'Seoul', dest: 'Suwon', travelers: '2', days, date, time: '09:00', style: 'balanced' });
const raw = data => JSON.stringify(data);
const cases = [
  ['missing', null, null, '2026-09-27T03:00:00Z', 'NO_DATES', null],
  ['pre', raw(trip('2026-09-28')), null, '2026-09-27T03:00:00Z', 'PRE_TRIP', null],
  ['in', raw(trip('2026-09-26')), null, '2026-09-27T03:00:00Z', 'IN_TRIP', 2],
  ['last', raw(trip('2026-09-25')), null, '2026-09-27T03:00:00Z', 'LAST_DAY', 3],
  ['post', raw(trip('2026-09-23')), null, '2026-09-27T03:00:00Z', 'POST_TRIP', null],
  ['one day', raw(trip('2026-09-27', 1)), null, '2026-09-27T03:00:00Z', 'LAST_DAY', 1],
  ['month end', raw(trip('2026-01-31')), null, '2026-02-01T03:00:00Z', 'IN_TRIP', 2],
  ['year end', raw(trip('2026-12-31', 2)), null, '2027-01-01T03:00:00Z', 'LAST_DAY', 2],
  ['leap day', raw(trip('2028-02-29', 2)), null, '2028-03-01T03:00:00Z', 'LAST_DAY', 2],
  ['invalid leap', raw(trip('2026-02-29')), null, '2026-03-01T03:00:00Z', 'NO_DATES', null],
  ['local only', null, raw(trip()), '2026-09-27T03:00:00Z', 'IN_TRIP', 1],
  ['both same', raw(trip()), raw(trip()), '2026-09-27T03:00:00Z', 'IN_TRIP', 1],
  ['numeric/string days', raw(trip()), raw(trip('2026-09-27', 3)), '2026-09-27T03:00:00Z', 'IN_TRIP', 1],
  ['before KST midnight', raw(trip()), null, '2026-09-26T14:59:59Z', 'PRE_TRIP', null],
  ['at KST midnight', raw(trip()), null, '2026-09-26T15:00:00Z', 'IN_TRIP', 1],
  ['last midnight', raw(trip()), null, '2026-09-28T15:00:00Z', 'LAST_DAY', 3],
  ['after last midnight', raw(trip()), null, '2026-09-29T15:00:00Z', 'POST_TRIP', null],
  ...[undefined, 0, -1, 1.5, 11, 'NaN', '', null, true, '1e0', ' 2 '].map(days => ['invalid days '+String(days), raw({...trip(), days}), null, '2026-09-27T03:00:00Z', 'NO_DATES', null]),
  ...['20260927', '2026-9-27', '2026-04-31', '2026-13-01', '', '2026-09-27T00:00:00Z'].map(date => ['invalid date '+date, raw(trip(date)), null, '2026-09-27T03:00:00Z', 'NO_DATES', null]),
  ...['start', 'dest', 'date', 'days'].map(key => ['conflict '+key, raw(trip()), raw({...trip(), [key]: {start:'Busan', dest:'Busan', date:'2026-09-28', days:2}[key]}), '2026-09-27T03:00:00Z', 'NO_DATES', null]),
  ['malformed session', '{', raw(trip()), '2026-09-27T03:00:00Z', 'NO_DATES', null],
  ['malformed local', raw(trip()), '{', '2026-09-27T03:00:00Z', 'NO_DATES', null],
];
for (const timezoneId of ['Asia/Seoul', 'America/Los_Angeles']) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test('strict source matrix, KST boundaries and read-only storage', async ({ page }) => {
      await page.goto('/');
      for (const [name, session, local, now, state, day] of cases) {
        const result = await page.evaluate(({session,local,now}) => {
          for (const [store,key,value] of [[sessionStorage,'koreaRouteTrip',session],[localStorage,'koreaRouteSavedTrip',local]]) {
            if (value === null) store.removeItem(key); else store.setItem(key,value);
          }
          // An unrelated plan must never supply a missing or conflicting trip date.
          sessionStorage.setItem('koreaRoutePlan', JSON.stringify({ date:'2026-09-27', days:3 }));
          sessionStorage.setItem('koreaRouteSavedPlacePlan', JSON.stringify({ 'Suwon::place':{ day:2, order:0 } }));
          const before=JSON.stringify([Object.entries(sessionStorage),Object.entries(localStorage)]);
          const value=homeTripIntelligence(new Date(now));
          renderHomeTripSummary();
          return {value, summary:document.getElementById('todayTripSummary').innerText, unchanged:before===JSON.stringify([Object.entries(sessionStorage),Object.entries(localStorage)])};
        }, {session,local,now});
        expect(result.value.state, name).toBe(state);
        expect(result.value.day, name).toBe(day);
        expect(result.unchanged, name).toBe(true);
        if(name==='local only') {
          expect(result.summary).toContain('Seoul → Suwon');
          expect(result.summary).not.toContain('No trip saved yet');
        }
      }
    });
  });
}
for (const width of [360,390]) {
  test.describe(`${width}px Intelligence UI`, () => {
    test.use({ viewport:{width,height:844} });
    test('all states, three locales, existing shell and action destinations', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-09-27T03:00:00Z'));
      await page.goto('/');
      await page.getByRole('button',{name:'Got it',exact:true}).click();
      const region=page.locator('#todayTripSummary .today-plan-status');
      for (const [state,data,en,ko,ja,screen] of [
        ['NO_DATES',null,'Trip dates not confirmed','여행 날짜를 확인해 주세요','旅行日程を確認してください','planner'],
        ['PRE_TRIP',trip('2026-09-28'),'Before your saved trip','저장된 여행 전','保存した旅行の前','myTripHub'],
        ['IN_TRIP',trip('2026-09-26'),'Saved trip · Day 2 of 3','저장된 여행 · 3일 중 2일차','保存した旅行 · 3日中 2日目','moveHub'],
        ['LAST_DAY',trip('2026-09-25'),'Last day of your saved trip · Day 3','저장된 여행의 마지막 날 · 3일차','保存した旅行の最終日 · 3日目','moveHub'],
        ['POST_TRIP',trip('2026-09-23'),'Saved trip period ended','저장된 여행 기간이 지났어요','保存した旅行期間は終了しました','myTripHub'],
      ]) {
        await page.evaluate(data => {
          for(const [store,key] of [[sessionStorage,'koreaRouteTrip'],[localStorage,'koreaRouteSavedTrip']]) {
            if(data) store.setItem(key,JSON.stringify(data));else store.removeItem(key);
          }
          renderHomeTripSummary();
        },data);
        for (const [i,title] of [en,ko,ja].entries()) {
          await expect(region).toHaveAttribute('data-plan-state',state);
          await expect(region.locator('strong')).toHaveText(title);
          await expect(region).not.toContainText(/Departure day|출국일|帰国日/);
          if(state==='PRE_TRIP') await expect(region.locator('p')).toContainText(['September 28, 2026','2026년 9월 28일','2026年9月28日'][i]);
          if(i===2) await expect(region).not.toContainText(/Before your|Saved trip|Last day|Open My Trip|Check dates|Get there|September|AM|PM/);
          await expect(page.locator('#todayTripSummary h2')).toHaveText(['Trip overview','여행 요약','旅行サマリー'][i]);
          await expect(page.locator('#globalSearchBox')).toBeVisible();
          await expect(page.locator('#nearbyEssentials')).toBeVisible();
          await expect(page.locator('#home .v220-core-card')).toHaveCount(4);
          await expect(page.locator('#v60Tabbar button')).toHaveCount(4);
          expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
          await page.locator('#langBtn').click();
        }
        await region.getByRole('link').click();
        await expect(page.locator('#'+screen)).toHaveClass(/active/);
        await page.locator('#v60Tabbar').getByRole('button',{name:'Today',exact:true}).click();
        await expect(page.locator('#home')).toHaveClass(/active/);
        await expect(region).toHaveAttribute('data-plan-state',state);
      }
      // A new KST date takes effect on return, with no new timer or storage write.
      await page.clock.setFixedTime(new Date('2026-09-25T03:00:00Z'));
      await page.locator('#v60Tabbar').getByRole('button',{name:'My Trip',exact:true}).click();
      await page.locator('#v60Tabbar').getByRole('button',{name:'Today',exact:true}).click();
      await expect(region).toHaveAttribute('data-plan-state','LAST_DAY');
    });
  });
}
