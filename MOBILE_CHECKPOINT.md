# KOREA ROUTE MOBILE CHECKPOINT

Updated: 2026-10-12

## Purpose
This branch is the portable handoff point for continuing KOREA ROUTE work from Codex Cloud/mobile without relying on the Windows OneDrive working copy.

## Repository / branch
- Repository: `dbswlgur201112001-max/korea-route`
- Handoff branch: `mobile/korea-route-handoff`
- Branch base / immutable target: `293ac0d4b1c8350c3ca4a664a86be47977dbd6db`
- Do not use the Cloud default `work` branch at `aa4ccfa115b3a8e65ae0846e44b67c8a32cdf6bb` as the validated baseline.
- `feature/home-redesign-v1` exists remotely and is one commit ahead of the validated target; do not substitute its head for the target below.

## Current validated pipeline state
- Original planning run: `779ec54e-9cc4-4354-b795-b0dcaf4f9a6d`
- Planning QA run: `0f923dfe-f71d-4e5b-b0a1-555381f15655`
- Reference implementation run: `542fb879-7d6c-4ddf-94cc-c1acaabe5865`
- Implementation QA run: `5ccfaf17-7f46-4e74-8e86-65bf7ac4f7ae`
- Target commit: `293ac0d4b1c8350c3ca4a664a86be47977dbd6db`
- Allowed file: `index.html`
- Proposed patch SHA-256: `b3570fe97168c62a8c9c36ce4154e73031b698d5e304361bd7f1e4c70ea34947`
- Patch applicability: PASS
- Implementation QA: PASS
- Apply ready: YES
- Final stage: `READY_FOR_SANDBOX_VALIDATION`
- Approval status: WAITING
- Patch applied: NO
- Source unchanged: YES
- Reference artifacts unchanged: YES
- Runtime / product tests / browser validation: NOT RUN

## Known blocker to verify before Sandbox
A previous handoff reported an execution/config target mismatch where the artifact target was `293ac0d4...` but an execution config target appeared as `21c05f5...`.
Before any Sandbox Validation:
1. Read the current config actually available in the execution environment.
2. Confirm its target commit is exactly `293ac0d4b1c8350c3ca4a664a86be47977dbd6db`.
3. If it differs, HOLD. Do not run Sandbox against another commit.
4. Do not recreate or guess missing local orchestrator artifacts. If the referenced run artifacts are unavailable in Cloud, report that limitation and stop at the handoff boundary.

## Next intended stage
`SANDBOX VALIDATION` only after target and artifact lineage are verified.

Expected validation order:
1. exact target / reference verification
2. strict patch application in isolated sandbox
3. Guard
4. product tests
5. browser QA / responsive screenshots
6. report results for user approval

## Safety / operating rules
- No merge to `main` without explicit user approval.
- No production deploy or production configuration change without explicit user approval.
- No permission / ACL / secret changes.
- No API fallback.
- Never add secrets, API keys, auth state, `.codex`, `.agents`, or private Windows paths to this branch.
- Preserve the existing KOREA ROUTE storage/NFC/i18n contracts unless a later approved task explicitly changes scope.
- When evidence is missing, fail closed instead of inferring success.
