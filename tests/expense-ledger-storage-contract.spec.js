const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block', timezoneId: 'Asia/Seoul' });
const key = 'koreaRouteExpenseLedger';
const record = {
  id: 'e51457a9-5e85-46da-8455-b504cfc43a85', storeName: 'Suwon shop',
  purchaseDate: '2026-09-27', amountKrw: 12000, refund: { status: 'UNVERIFIED' },
  note: '', createdAt: '2026-09-27T03:16:00.000Z', updatedAt: '2026-09-27T03:16:00Z',
};
const ledger = { version: 1, records: [record] };

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-27T03:16:00Z') });
  await page.goto('/');
});

test('startup, polling, auto-persist and reload do not create a ledger', async ({ page }) => {
  await page.clock.runFor(10000);
  expect(await page.evaluate(key => ({ local: localStorage.getItem(key), session: sessionStorage.getItem(key),
    registered: KOREA_ROUTE_PERSIST_SESSION_KEYS.includes(key), snapshot: buildOfflineTripSnapshot().data[key],
    backup: koreaRouteBuildPersistedState().data[key] }), key)).toEqual({ local: null, session: null, registered: false });
  await page.reload();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
});

test('validator accepts empty, boundary, future-date and refund records without writing or normalizing', async ({ page }) => {
  const result = await page.evaluate(({ key, record }) => {
    const variants = [{ version: 1, records: [] }, { version: 1, records: [record] }];
    for (const status of ['UNVERIFIED', 'CHECK_REQUIRED', 'STORE_CONFIRMED', 'REFUND_RECEIVED']) {
      variants.push({ version: 1, records: [{ ...record, refund: { status } }] });
    }
    const minimal = { ...record, purchaseDate: '9999-12-31', storeName: '  Shop  ', amountKrw: 1 };
    delete minimal.refund;
    variants.push({ version: 1, records: [minimal] }, { version: 1, records: [{ ...record,
      purchaseDate: '1900-01-01', storeName: '店'.repeat(100), note: 'a'.repeat(500), amountKrw: 999999999 }] });
    variants.push({ version: 1, records: Array.from({ length: 500 }, (_, i) => ({ ...record,
      id: `e51457a9-5e85-46da-8455-${String(i).padStart(12, '0')}`, purchaseDate: '2024-02-29' })) });
    return { unchanged: variants.every(value => JSON.stringify(parseKoreaRouteExpenseLedger(JSON.stringify(value))) === JSON.stringify(value)),
      local: localStorage.getItem(key), session: sessionStorage.getItem(key) };
  }, { key, record });
  expect(result).toEqual({ unchanged: true, local: null, session: null });
});

test('validator rejects malformed schemas, sensitive fields and invalid dates/amounts/timestamps', async ({ page }) => {
  const failures = await page.evaluate(record => {
    const samples = { null: 'null', array: '[]', broken: '{', wrongVersion: JSON.stringify({ version: 2, records: [] }),
      nonArray: JSON.stringify({ version: 1, records: {} }), topExtra: JSON.stringify({ version: 1, records: [], passportNumber: 'x' }),
      tooMany: JSON.stringify({ version: 1, records: Array(501).fill(record) }) };
    const changes = { id: ['bad', 123], storeName: ['', '   ', 'a'.repeat(101), 2],
      purchaseDate: ['2026-02-29', '2026-04-31', '2026-13-01', '1899-12-31', '2026-1-01', null],
      amountKrw: [1.5, 0, -1, 1000000000, '12000'], refund: [{ status: 'ELIGIBLE_HINT' }, { status: 'OTHER' },
        null, [], {}, { status: 'UNVERIFIED', cardNumber: 'x' }], note: ['a'.repeat(501), null],
      createdAt: ['2026-02-30T03:16:00Z', '2026-09-27', '2026-09-27T03:16:00+00:00', '2026-09-27T24:00:00Z'],
      updatedAt: ['bad', '2026-09-27T03:16:00'], passportNumber: ['x'], cardNumber: ['x'], authenticationCode: ['x'] };
    for (const [field, values] of Object.entries(changes)) values.forEach((value, i) => {
      samples[`${field}-${i}`] = JSON.stringify({ version: 1, records: [{ ...record, [field]: value }] });
    });
    for (const field of ['id', 'storeName', 'purchaseDate', 'amountKrw', 'note', 'createdAt', 'updatedAt']) {
      const missing = { ...record }; delete missing[field];
      samples[`missing-${field}`] = JSON.stringify({ version: 1, records: [missing] });
    }
    return Object.entries(samples).filter(([, raw]) => parseKoreaRouteExpenseLedger(raw) !== null).map(([name]) => name);
  }, record);
  expect(failures).toEqual([]);
});

test('snapshot includes only valid local ledger, preserves Budget and excludes ledger from auto-persist', async ({ page }) => {
  const result = await page.evaluate(({ key, ledger }) => {
    const budget = JSON.stringify({ city: 'Suwon', style: 'standard', days: 3, people: 2, total: 300000 });
    sessionStorage.setItem('koreaRouteWallet', budget);
    const raw = JSON.stringify(ledger); localStorage.setItem(key, raw);
    sessionStorage.setItem(key, 'stale session must never win');
    const snapshot = buildOfflineTripSnapshot();
    koreaRoutePersistSessionState();
    koreaRouteRestorePersistedSessionState();
    const backup = JSON.parse(localStorage.getItem('koreaRouteAutoPersist'));
    localStorage.setItem(key, '{bad');
    const invalidIncluded = Object.hasOwn(buildOfflineTripSnapshot().data, key);
    localStorage.removeItem(key);
    const absentIncluded = Object.hasOwn(buildOfflineTripSnapshot().data, key);
    return { included: snapshot.data[key], top: Object.keys(snapshot).sort(), budget: sessionStorage.getItem('koreaRouteWallet'),
      snapshotBudget: snapshot.data.koreaRouteWallet, backupBudget: backup.data.koreaRouteWallet,
      duplicated: Object.hasOwn(backup.data, key), invalidIncluded, absentIncluded, expectedBudget: budget };
  }, { key, ledger });
  expect(result.included).toBe(JSON.stringify(ledger));
  expect(result.top).toEqual(['data', 'savedAt', 'version']);
  expect(result.budget).toBe(result.expectedBudget);
  expect(result.snapshotBudget).toBe(result.expectedBudget);
  expect(result.backupBudget).toBe(result.expectedBudget);
  expect([result.duplicated, result.invalidIncluded, result.absentIncluded]).toEqual([false, false, false]);
});

test('restore preserves ledger for legacy/invalid copies, replaces valid/empty and keeps session removal policy', async ({ page }) => {
  const result = await page.evaluate(({ key, ledger }) => {
    const original = JSON.stringify(ledger);
    const replacement = JSON.stringify({ version: 1, records: [{ ...ledger.records[0], amountKrw: 7000 }] });
    const empty = JSON.stringify({ version: 1, records: [] });
    const budget = JSON.stringify({ city: 'Suwon', style: 'standard', days: 3, people: 2, total: 300000 });
    const cases = [undefined, '{bad', JSON.stringify({ version: 2, records: [] }),
      JSON.stringify({ version: 1, records: [{ ...ledger.records[0], passportNumber: 'x' }] }), replacement, empty];
    return cases.map(raw => {
      localStorage.setItem(key, original);
      sessionStorage.setItem('koreaRouteMoveVerify', 'must be removed');
      sessionStorage.setItem('koreaRouteWallet', budget);
      const data = { koreaRouteWallet: budget };
      if (raw !== undefined) data[key] = raw;
      localStorage.setItem('koreaRouteOfflineTrip', JSON.stringify({ version: 1, savedAt: '2026-09-27T03:16:00Z', data }));
      restoreOfflineTripSnapshot();
      return { actual: localStorage.getItem(key), expected: raw === replacement || raw === empty ? raw : original,
        sessionRemoved: sessionStorage.getItem('koreaRouteMoveVerify') === null,
        budgetPreserved: sessionStorage.getItem('koreaRouteWallet') === budget };
    });
  }, { key, ledger });
  for (const entry of result) {
    expect(entry.actual).toBe(entry.expected);
    expect(entry.sessionRemoved).toBe(true);
    expect(entry.budgetPreserved).toBe(true);
  }
});

test('local ledger changes reach freshness and existing polling/debounce without losing session tracking', async ({ page }) => {
  await page.clock.runFor(4000);
  await page.evaluate(({ key, ledger }) => {
    localStorage.setItem(key, JSON.stringify(ledger)); saveOfflineTripSnapshot();
    watchOfflineTripSessionChanges();
  }, { key, ledger });
  expect(await page.evaluate(() => offlineSnapshotFreshness().state)).toBe('current');
  await page.evaluate(key => {
    const changed = JSON.parse(localStorage.getItem(key)); changed.records[0].amountKrw = 15000;
    localStorage.setItem(key, JSON.stringify(changed));
  }, key);
  expect(await page.evaluate(() => offlineSnapshotFreshness().state)).toBe('changed');
  await page.clock.runFor(3500);
  expect(await page.evaluate(key => JSON.parse(readOfflineTripSnapshot().data[key]).records[0].amountKrw, key)).toBe(15000);
  expect(await page.evaluate(() => offlineSnapshotFreshness().state)).toBe('current');
  await page.evaluate(() => sessionStorage.setItem('koreaRouteWalkAlerts', '{"test":true}'));
  expect(await page.evaluate(() => offlineSnapshotFreshness().state)).toBe('changed');
  await page.clock.runFor(3500);
  expect(await page.evaluate(() => readOfflineTripSnapshot().data.koreaRouteWalkAlerts)).toBe('{"test":true}');
  await page.reload();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).records[0].amountKrw, key)).toBe(15000);
});
