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

The 22 AGENTS.md keys plus koreaRouteAutoPersist are protected. Preserve the
{version, savedAt, data} backup schema, registered session keys, exclusion of
GPS/map-cache/walk-session data, and restore only when a session value is absent.
Preserve v11PersistTripData(), its writes to sessionStorage.koreaRouteTrip and
localStorage.koreaRouteSavedTrip, and immediate koreaRoutePersistSessionState().

The guard compares LF-normalized SHA-256 fingerprints of frozen product source,
including the entire index.html, against this baseline. This conservatively
rejects changes anywhere in storage logic or its call sites, even when names
remain present. Future product changes require a separately approved scope and
review of these fingerprints; never regenerate them merely to make checks pass.
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
