// Static foundation guard, not a persistence behavior or browser test.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// CI can use pre-edit guard/inventory snapshots with these arguments.
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const inventory = path.resolve(process.argv[3] || path.join(root, 'main-control/baseline.json'));
const failures = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const digest = (text) => crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
const check = (condition, message) => { if (!condition) failures.push(message); };
// These baseline declarations have top-level, column-zero closing delimiters.
// Fail closed on missing/duplicate/changed declarations; never execute app code.
// Hash only the matched declaration, so unrelated HTML/JS remains editable.
const storageRegions = {
  KOREA_ROUTE_EXPENSE_LEDGER_KEY: /^const KOREA_ROUTE_EXPENSE_LEDGER_KEY=[^\n]+;$/gm,
  KOREA_ROUTE_AUTO_PERSIST_KEY: /^const KOREA_ROUTE_AUTO_PERSIST_KEY=[^\n]+;$/gm,
  KOREA_ROUTE_PERSIST_SESSION_KEYS: /^const KOREA_ROUTE_PERSIST_SESSION_KEYS=\[[\s\S]*?^\];$/gm,
  KOREA_ROUTE_PERSIST_EXCLUDED_KEYS: /^const KOREA_ROUTE_PERSIST_EXCLUDED_KEYS=new Set\(\[[\s\S]*?^\]\);$/gm,
};
for (const name of ['v11PersistTripData', 'koreaRoutePersistSessionState',
  'koreaRouteBuildPersistedState', 'koreaRouteRestorePersistedSessionState',
  'parseKoreaRouteExpenseLedger',
  'buildOfflineTripSnapshot',
  'restoreOfflineTripSnapshot',
  'offlineSnapshotComparableData',
  'currentOfflineComparableData',
  'offlineTripTrackedSessionFingerprint',
  'offlineTripStoredSnapshotFingerprint']) {
  storageRegions[name] = new RegExp(`^function ${name}\\([^\\n]*\\{[\\s\\S]*?^\\}`, 'gm');
}

try {
  const baseline = JSON.parse(fs.readFileSync(inventory, 'utf8'));
  const files = [...baseline.requiredRuntimeFiles, ...baseline.requiredVendorFiles,
    ...baseline.requiredDataFiles, ...baseline.requiredApiFiles];
  for (const file of files) check(exists(file), `Missing runtime file: ${file}`);
  for (const [file, expected] of Object.entries(baseline.frozenSourceSha256)) {
    check(exists(file), `Missing frozen source: ${file}`);
    if (exists(file)) check(digest(read(file)) === expected, `Baseline source changed: ${file}`);
  }
  check(!Object.hasOwn(baseline.frozenSourceSha256, 'index.html'), 'Whole index.html fingerprint is not allowed');
  for (const file of baseline.requiredDataFiles) {
    if (!exists(file)) continue;
    try { JSON.parse(read(file)); } catch { failures.push(`Invalid JSON: ${file}`); }
  }
  if (exists('index.html')) {
    const index = read('index.html').replace(/\r\n/g, '\n');
    // Function fingerprints cover the payload schema, null-only restore policy,
    // dual trip writes and immediate backup call, not just identifier presence.
    const fingerprints = baseline.storageSourceSha256 || {};
    check(Object.keys(fingerprints).length === Object.keys(storageRegions).length,
      'Storage contract fingerprint inventory mismatch');
    for (const [name, pattern] of Object.entries(storageRegions)) {
      const matches = [...index.matchAll(pattern)];
      check(matches.length === 1, `Missing or ambiguous storage contract: ${name}`);
      check(typeof fingerprints[name] === 'string' && /^[a-f0-9]{64}$/.test(fingerprints[name]),
        `Missing storage contract fingerprint: ${name}`);
      if (matches.length === 1) check(digest(matches[0][0]) === fingerprints[name], `Storage contract changed: ${name}`);
    }
    for (const key of baseline.protectedStorageKeys) check(index.includes(key), `Missing storage key: ${key}`);
    for (const fn of baseline.protectedFunctions) check(index.includes(fn), `Missing function: ${fn}`);
  }
  if (exists('AGENTS.md')) {
    for (const id of baseline.requiredRegressionIds) check(read('AGENTS.md').includes(id), `Missing regression: ${id}`);
  } else failures.push('Missing AGENTS.md');
  if (exists('vercel.json')) {
    const rewrites = JSON.parse(read('vercel.json')).rewrites || [];
    for (const source of ['/t', '/t/:path*']) {
      check(rewrites.some(x => x.source === source && x.destination === '/nfc-card.html'), `Missing NFC rewrite: ${source}`);
    }
  }
  if (exists('sw.js')) {
    for (const file of ['nfc-card.html', 'nfc-card-landing.js', 'nfc-card-landing.css', ...baseline.requiredDataFiles]) {
      check(read('sw.js').includes('/' + file), `Missing service worker reference: ${file}`);
    }
  }
  const workflow = '.github/workflows/ai-dev-command.yml';
  check(exists(workflow), 'Missing patch-only AI workflow');
  if (exists(workflow)) {
    const text = read(workflow);
    const forbidden = [
      [/\bgit\s+push\b/i, 'git push'],
      [/\bgit\s+(?:switch\s+-c|checkout\s+-b|branch\s+(?!-))/i, 'branch creation'],
      [/\bgh\s+pr\s+(?:create|merge)\b/i, 'PR creation/merge'],
      [/\b(?:contents|pull-requests)\s*:\s*write\b/i, 'write permission'],
      [/\bwrite-all\b/i, 'write-all permission'],
      [/\b(?:vercel\s+(?:deploy|promote|alias)|git\s+merge)\b/i, 'deployment/merge'],
    ];
    for (const [pattern, label] of forbidden) check(!pattern.test(text), `Forbidden AI workflow capability: ${label}`);
    check(/contents:\s*read\b/.test(text), 'Read-only contents permission missing');
    check(/persist-credentials:\s*false/.test(text), 'Checkout must not persist credentials');
    check(text.includes('refs/heads/*') && text.includes('main|master'), 'Production branch rejection missing');
  }
  if (failures.length) throw new Error(failures.join('\n- '));
  console.log('MAIN CONTROL STATIC GUARD: PASS');
  console.log(`Baseline: ${baseline.sourceCommit}`);
  console.log(`${files.length} runtime files; ${baseline.requiredDataFiles.length} valid data JSON files; ${baseline.protectedStorageKeys.length} protected keys`);
  console.log(`${Object.keys(baseline.frozenSourceSha256).length} baseline source fingerprints match (LF normalized)`);
  console.log(`${Object.keys(storageRegions).length} storage contract fingerprints match (LF normalized).`);
  console.log('Only selected storage declarations are frozen in index.html; other code, including host logic, is not verified.');
  console.log('Static workflow checks passed; these are not a general shell security proof.');
  console.log('BROWSER BEHAVIOR / REG-001 / REG-002 / REG-003: UNTESTED by this guard');
} catch (error) {
  console.error('MAIN CONTROL STATIC GUARD: FAIL\n- ' + error.message);
  process.exitCode = 1;
}
