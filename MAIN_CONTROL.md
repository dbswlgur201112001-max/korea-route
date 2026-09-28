# KOREA ROUTE MAIN CONTROL V1

This control layer exists to protect the current KOREA ROUTE production baseline while V2 is developed incrementally.

## Roles

- **Chat = Command / approval gate**
  - interprets the master brief and feature matrix
  - classifies work as EXISTING / MODIFY / NEW
  - chooses one narrowly scoped task at a time
  - reviews evidence and decides whether the task may advance
  - never treats generated code alone as PASS

- **Work = Research / browser QA / evidence**
  - compares specification, repository, Preview, and mobile behavior
  - validates actual HTTPS Preview behavior with service-worker precautions
  - runs Q01-Q24 and REG-001/002/003 evidence checks
  - does not modify Production

- **Codex = Patch generator**
  - reads AGENTS.md and the baseline before editing
  - may run only against an existing non-Production branch/ref; `main`/`master` are rejected
  - edits only the checked-out working tree
  - produces a patch artifact
  - cannot push, create PRs, merge, deploy, promote, or change domains

## Approval gates

1. **BASELINE** - protected files, storage keys, persistence bridge, NFC routing and JSON data are present.
2. **PATCH** - Codex generates the smallest patch only.
3. **STATIC GUARD** - baseline guard passes after the patch.
4. **SMOKE** - existing mobile smoke suite passes.
5. **PREVIEW** - a real HTTPS Preview exists. Production is not used as the test target for unapproved changes.
6. **REGRESSION** - REG-001, REG-002 and REG-003 are executed on the Preview according to AGENTS.md.
7. **WORK QA** - relevant master-pack Q checks are executed and evidence recorded.
8. **USER APPROVAL** - only the user can authorize PR/merge/promotion.

## Current baseline

- Repository: `dbswlgur201112001-max/korea-route`
- Production branch: `main`
- Baseline commit: `aa4ccfa115b3a8e65ae0846e44b67c8a32cdf6bb`
- Production domain: `korea-route.com`
- Existing product files are not changed by this foundation patch.

## Foundation scope and static evidence

Only MAIN_CONTROL.md, main-control/baseline.json, scripts/main-control-guard.js,
.github/workflows/main-control-qa.yml and .github/workflows/ai-dev-command.yml
belong to this foundation change. Do not apply APPLY_PLAN.md from the bundle.

The original 22 AGENTS.md keys plus koreaRouteAutoPersist and koreaRouteExpenseLedger
are protected: 24 protectedStorageKeys. koreaRouteOfflineTrip remains the existing
snapshot key and is not newly counted in this inventory. Preserve the
{version, savedAt, data} backup schema, registered session keys, exclusion of
GPS/map-cache/walk-session data, and restore only when a session value is absent.
Preserve v11PersistTripData(), its writes to sessionStorage.koreaRouteTrip and
localStorage.koreaRouteSavedTrip, and immediate koreaRoutePersistSessionState().

The guard compares LF-normalized SHA-256 fingerprints of selected storage
declarations/functions in index.html, not the entire index.html. Other product
code may receive minimal approved feature-branch changes. Storage contract
changes require a dedicated approved task; never regenerate fingerprints merely
to make checks pass. Other frozen runtime/data/API/NFC/vendor files retain their
existing fingerprints.

Storage contract revision 2 adds koreaRouteExpenseLedger (schema version 1,
maximum 500 records), canonical in localStorage and separate from Budget Wallet.
It is not created on startup or included in the 16-key session auto-persist.
Offline Copy includes its valid raw JSON string inside the existing data object.
Missing legacy or invalid ledger snapshot values preserve the current ledger;
a valid empty ledger explicitly replaces it. Existing session restore removal
semantics are unchanged. Freshness and the existing polling/debounce track this
local ledger without a new timer. The auto-persist storageContract.version stays 1.

Static PASS means source/inventory checks passed, not working storage, routes,
or UI. Only actual browser evidence can establish behavior. The existing smoke
suite checks shell/data availability and does not cover REG-001/002/003.

Keep the current koreaRouteHostAllowed() implementation unchanged. The old
KR-ISSUE-004 description is not evidence of a current hostname defect. Report
ODsay failures from actual browser evidence; unexecuted checks remain UNTESTED.

The manual patch generator accepts existing non-production branches (including
refs/heads/ notation), not tags or arbitrary commit expressions. Checkout fails
for missing branches. It retains pre-edit guard/inventory snapshots, forbids
control-file edits, and uploads a patch only after static and smoke checks.
It has no publishing job. The foundation branch may be committed/pushed only
under the user's explicit authorization; that is not a workflow capability.

## Hard prohibitions

- No direct push to `main`.
- No automatic PR creation.
- No automatic merge.
- No Production deploy/promotion.
- No domain changes.
- No storage-key renaming or persistence-schema migration without a dedicated approved task.
- No full rewrite of `index.html`.
- No automatic acceptance of OCR/AI output as authoritative travel, payment, or refund data.

## Stage 4B — Memory foundation inventory and deployment contract

Runtime: `memory.html`, `memory.js`, `memory.css`. Server API: `api/memory-auth.js`,
`api/memory-data.js`, `api/memory-media.js`. Shared server: `server/memory/core.js`,
`server/memory/media.js`. Migration: `supabase/migrations/20260928085936_memory_foundation.sql`.
Tests: `tests/time-slip-{db,api,shell}.spec.js`; pinned PGlite 0.5.8 executes actual PostgreSQL
constraints/RLS locally with synthetic auth/storage schemas. This is not remote Supabase Auth/Storage QA.

A dedicated KOREA ROUTE STAGING project has NOT been identified. No migration was applied remotely.
Custom SMTP: NOT CONFIGURED. REMOTE_SUPABASE: BLOCKED_PENDING_SETUP.
Do not reuse another project's Supabase or create paid resources without approval.

Preview server-only environment contract (never commit values):
- MEMORY_ENV=staging; VERCEL_ENV must not be production.
- SUPABASE_URL: exact dedicated staging project origin.
- MEMORY_STAGING_PROJECT_REF: same explicitly approved staging project reference.
- SUPABASE_PUBLISHABLE_KEY; SUPABASE_SECRET_KEY: server-side only.
- MEMORY_COOKIE_KEY: cryptographically random 32-byte hex key; rotation signs out sessions.
- MEMORY_APP_ORIGIN: exact HTTPS Preview origin, no trailing slash. Same-origin write checks.

Configure Custom SMTP and allow only the exact Preview callback. The Magic Link email template must
link to `{{ .RedirectTo }}#token_hash={{ .TokenHash }}`. The server supplies RedirectTo with a random
state query. The browser immediately removes the fragment/query and requires a confirmation click;
it POSTs the one-time hash. A short-lived encrypted HttpOnly flow cookie binds verification to the
requesting browser. Opening in another browser requires requesting a new link there. Never use the
default implicit-token URL template. No access/refresh token is returned to browser JavaScript.
Encrypted session cookies use __Host-, Secure, HttpOnly and SameSite=Lax. Session checks validate
with Auth and active-account RLS; refresh stays server-side. No email, token, note or signed URL logs.

Journey ownership uses a composite foreign key. UNIQUE(journey_id,card_id) preserves return visits.
DB server timestamps/revisions, plain-text constraints and column-level grants protect ownership.
No cloud migration of existing local data. No Memory condition is added to Suwon Complete.
Private `travel-memories` bucket paths are user UUID/memory UUID/media UUID.extension.
Authenticated users have no Storage upload/delete policy and no direct media row writes.
Upload reservation and finalize endpoints deliberately return MEDIA_UPLOAD_NOT_ENABLED in 4B.
The five-photo/one-video schema limit is present; byte limits, file sniffing and signed upload issuance
must be implemented and validated in 4C/4D BEFORE enabling uploads. No actual media upload UI exists.
Signed read authorization rechecks ownership via user JWT/RLS and issues a 60-second private URL.
Such URLs are bearer credentials until expiry; deletion/sign-out cannot recall a previously issued URL.

Memory deletion records a durable operation, tombstones the memory, removes Storage objects, then
removes metadata. Storage failure retains rows and operation for retry; repeating delete is idempotent.
The internal account-delete worker blocks RLS first, deletes memories/objects and journeys, then
soft-deletes Auth identity. No public account-delete endpoint is exposed before reauthentication UX.
Operation records remain for retry/audit; hard purge/retention policy is a later explicit decision.
No background scheduler is installed. Pending operations require an authorized retry.

SW change: bypass Memory/Auth documents/assets before navigation caching so private HTML cannot
replace the general offline index. Existing cross-origin/API exclusions and travel/NFC offline flow remain.
No Memory HTML or signed URLs are added to CORE. API responses send no-store at browser/CDN levels.
The static shell has no user data, no inline code, a restrictive CSP and no-referrer/noindex.
Before remote release: dedicated project approval, migration apply, custom SMTP, exact callback allowlist,
real A/B/anonymous REST+Storage tests, expired link/logout/refresh tests, and Preview browser QA required.

Approved baseline changes: runtime/API/migration inventory additions; SHA updates only for sw.js,
AGENTS.md inventory and package.json test dependency. Existing storage fingerprints are unchanged.

An internal signed-upload helper is prepared and mock-tested for owned reserved rows only.
It is not invoked by any public endpoint in 4B. Storage provider upload-token lifetime and byte/MIME
policy require remote verification in 4C before exposing it. No real signed upload or upload occurred.
