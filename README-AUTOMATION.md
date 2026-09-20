# KOREA ROUTE Automation Foundation V1

This bundle is intentionally limited to QA/CI scaffolding. It does not change `index.html`, NFC behavior, storage keys, API data, routing, domains, or production configuration.

## Adds
- Playwright mobile smoke tests
- PWA manifest/service-worker reachability checks
- Required JSON data integrity checks
- NFC landing shell check
- GitHub Actions workflow for pull requests to `main`
- Ignore rules for local QA artifacts and secrets

## Safe application plan
1. Create branch `chore/automation-foundation-v1` from current `main`.
2. Copy these files into repository root, merging `package.json` rather than overwriting any newer changes.
3. Run `npm install`.
4. Run `npm run qa:smoke`.
5. Push branch only.
6. Open a draft PR if desired; do not merge until the user approves.

## Next phase
After baseline smoke passes, add automated versions of REG-001, REG-002 and REG-003 using stable selectors from the actual UI. Keep ODsay Preview-host limitations classified as `BLOCKED_ENV` until KR-ISSUE-004 is resolved, per AGENTS.md.
