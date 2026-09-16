# SUWON TRAVEL PACK V1 — premium polish QA and review

Branch: `feature/nfc-suwon-travel-pack-v1`

Base commit: `29bc077e49f7b7830adee3f9804253069315153f` (confirmed as remote main before branching)

Approved implementation before polish: `ef20d0eb03cccc57fab43c8d4f27408eb7844a7e`

Research sources file: [SUWON-TRAVEL-PACK-V1-SOURCES.md](SUWON-TRAVEL-PACK-V1-SOURCES.md)

## Delivered

- Three distinct themes and first actions within one pack order: HERO → START → SEE → MISSIONS → PHOTO → ROUTE → LOCAL → NEXT → COLLECTION → conditional COMPLETE → app tools.
- Four non-sticky navigation anchors, compact existing physical-card images, quieter navy/ivory/gold presentation, editorial rows and local disclosures.
- Nine scope-based route options (SHORT / STANDARD / EXTENDED) (three per card), 3–5 stops each; one route visible at a time; individual place-search links only.
- Three local picks per card, researched across five distinct venues/branches; no prices, opening schedules, ratings or benefits displayed. Addresses and branch names distinguish map searches.
- 001 photo framing/angle instructions removed from rendered content. All three photo sections name areas only.
- The Complete Suwon Route only when the existing three-card predicate is true; no extra unlock or account system.

Runtime edits are limited to `nfc-card-landing.js` and `nfc-card-landing.css`. The extension reuses original hero/image, mission DOM (including closures and handlers), collection DOM and home actions. It does not write storage. All original V2 functions are unchanged, plus one call to the new presentation helper. No framework, dependency, API, external content request, account, GPS, upload or new storage key was added.

All other tracked base files were byte-compared, including `index.html`, `sw.js`, `vercel.json`, `nfc-card.html`, `AGENTS.md`, APIs, vendor files, JSON and three actual WebP assets. They are unchanged. AGENTS.md's file table was not edited under the user's explicit prohibition.

## Executed automatic checks

```sh
KR_QA_JSDOM=/workspace/scratch/75af81662000/qa-runtime/node_modules/jsdom node tests/suwon-travel-pack-v1.test.cjs
node --check nfc-card-landing.js
node --check tests/suwon-travel-pack-v1.browser.spec.cjs
git diff --check
```

**23/23 checks passed**, process exit 0, using jsdom 30.0.1 in an external QA environment. No dependency or lockfile was added to the app. The attached package contains `DOM-TEST-RESULTS.txt` with the test output.

Coverage:

- All three Travel Pack skeletons, unique themes, three SEE subjects, three local picks, two NEXT options.
- Entire original NFC code recoverable byte-for-byte by removing the extension/hook. All non-runtime tracked files unchanged.
- `/t`, `/t/`, `/t/suwon-999`: identical baseline DOM and storage.
- Per-card seeded storage identical to base apart from the original tap increment. Existing three mission keys and collection shape preserved.
- Every card's missions 0/3 → 3/3, reload, uncheck and isolation from the other mission keys and collection.
- Collection 0/3 → 3/3, no duplicate records, firstTapAt preserved, tapCount increments; unrelated future-card IDs cannot unlock Suwon.
- Completion and day-route display on all collected-card pages; mission completion alone does not unlock them.
- SHORT / STANDARD / EXTENDED on every card, 3–5 stops, no numeric duration/distance/ETA promise, route selection does not write storage.
- Real image asset paths and bytes; **simulated** load/error handling on all three images.
- PHOTO text excludes angle, framing, time or coordinate guidance.
- HTTPS external link structure, map search URLs, local address/branch information, internal anchor targets, unique IDs, accessible label targets and limited live announcements.
- Malformed data and storage write failure preserve records and do not claim completion.

These checks validate DOM/storage behaviour. They do not prove pixel layout, actual WebP decoding in a browser, business doors open today, navigation through a map provider, or buyer willingness to pay KRW 9,900.

## Browser / Preview gate

During the initial implementation (before this polish), the supported browser was connected and a direct attempt to open the local card page returned `net::ERR_BLOCKED_BY_CLIENT`. The local test server was stopped afterward. No alternative browser engine or network workaround was used. This is an environment restriction, not an observed product failure.

`tests/suwon-travel-pack-v1.browser.spec.cjs` is provided for branch Preview execution. It covers all three cards at 360/390/430 px, real image loads, missing-image fallback, all route options, expanded local picks, console errors, mission reload/isolation, timestamps/taps, completion, selector/invalid routes and external action opening. The spec uses fresh contexts and blocks service workers to avoid stale assets. **Authored and syntax checked, not executed.** A separate normal-service-worker app smoke test remains required.

| Required report item | Live verdict |
| --- | --- |
| 001 TRAVEL PACK | UNTESTED |
| 002 TRAVEL PACK | UNTESTED |
| 003 TRAVEL PACK | UNTESTED |
| SHORT ROUTES | UNTESTED |
| STANDARD ROUTES | UNTESTED |
| EXTENDED ROUTES | UNTESTED |
| LOCAL PICKS | UNTESTED |
| PHOTO ZONE RULE | UNTESTED |
| MISSIONS | UNTESTED |
| MISSION STORAGE ISOLATION | UNTESTED |
| COLLECTION | UNTESTED |
| SUWON COMPLETE | UNTESTED |
| /t | UNTESTED |
| /t/suwon-999 | UNTESTED |
| MOBILE 360 | UNTESTED |
| MOBILE 390 | UNTESTED |
| MOBILE 430 | UNTESTED |
| REG-001 | UNTESTED |
| REG-002 | UNTESTED |
| REG-003 | UNTESTED |

REG-001/002/003 were not performed against this change because its browser-accessible Preview is unavailable. Do not infer PASS from protected-file equality. If Preview later becomes available, follow AGENTS.md's exact Move, language and My Trip flows. Classify ODsay hostname restrictions separately; compare pre-existing Japanese translation gaps with base before calling a new regression.

Preview URL: none. This polish was kept local as explicitly requested. No GitHub push, remote branch publication, PR creation, deployment or merge was attempted. The earlier implementation recorded a GitHub 403; this follow-up did not retry it.

Current review verdict: **UNTESTED for live UI; DO NOT MERGE pending ChatGPT review and live QA**. Local automated results are reported separately. REG-001/002/003 remain unexecuted; unchanged app bytes are evidence of scope control, not substitutes for those flows.

## Premium polish changes

| Before | After |
| --- | --- |
| 30 MIN / 1 HOUR / 2 HOURS | SHORT / STANDARD / EXTENDED |
| Start here | Your first move |
| See | Worth noticing |
| Three small missions | 3 Suwon moments |
| Choose your route | Choose your pace |
| Local picks | Selected for your visit |
| Next | Continue your Suwon journey |
| Emoji-based collected status | CARD 001 ADDED / CARD 001 IN YOUR COLLECTION (matching card number) |
| Suwon collection 1/3 | SUWON COLLECTION · 1 OF 3 |
| Suwon Complete! / unlocked full route | Your Suwon collection is complete / COLLECTOR ROUTE |
| Suwon Complete Day Route | The Complete Suwon Route |

Completion supporting copy: “Three cards. One curated day through Suwon.” The five-stop day sequence is unchanged. Section spacing increases by 2px; collection typography is quieter; the completion heading uses ivory instead of gold. No new effect, layout skeleton or network request.

Changed files: the two runtime files, the existing two Travel Pack tests, and the existing QA/source documents (six files).

### Storage and content evidence

The 23-test suite compares the full original NFC JavaScript against the base after removing only the presentation extension and its hook. It is byte-identical, covering storage keys, mission handlers, firstTapAt/tapCount and the three-ID completion predicate. All other tracked base files and physical images are byte-identical. Seeded storage outcomes also match the base for each card. The extension contains no localStorage/sessionStorage access; collection text uses the existing tap result only. No new key is introduced.

Existing mission progress announcements, checkbox handlers and LOOK/WALK/PHOTO instructions are unchanged; only the section title/introduction changes. Collection error handling and malformed-storage behaviour stay intact.

The rendered PHOTO sections pass the existing place-level rule test. Local pick names/branches, addresses and link targets are compared directly with approved commit ef20d0e on all three cards; the research-date and confirm-today notice is asserted exactly. All five distinct venues/branches remain. Source refresh and today's actual opening status were not newly verified.

## Editorial self-review and limitations

1. Search reduction: one first action, one visible itinerary and three need-based local options reduce browsing. Actual buyer usability is not yet tested.
2. Immediate action: a single Your first move CTA leads to one instruction; SEE has only three subjects.
3. Choice count: four anchors, three route choices, three collapsible local picks and two next places; no directory or grid of repeated promo boxes.
4. Value: itineraries and the complete-day plan add practical depth. KRW 9,900 value is a hypothesis requiring purchaser feedback, not a claimed finding.
5. Next card: NEXT names a card/location and map search; it does not collect on map click.
6. Completion: three-card ownership opens the combined five-stop day sequence; missions stay independent.
7. Density: original long WHY/quick/next material is replaced in the rendered pack, with visitor facts behind a disclosure. Visual refinement still needs browser inspection.
8. Evidence: sources and selection reasoning are in the source register. Conflicting fortress hours are omitted; no unknown business times/prices or walking measurements are invented.

Still requires field verification: all nine route sequences, measured durations and public access, crossings/closures, queue and meal time, actual business signs/operation, non-Korean ordering, programme availability/language/booking and accessibility. Local businesses can change after the research date. No physical NFC tap, camera-memory exercise or offline field trip was performed.

Do not publish a GitHub branch or create a PR before ChatGPT review. Do not merge until live Preview and REG checks are completed. No main commit or merge was performed.
