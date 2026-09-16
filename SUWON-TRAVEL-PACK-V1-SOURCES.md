# SUWON TRAVEL PACK V1 — audit, research and content plan

Checked date for every row: **2026-09-16**. Base: `29bc077e49f7b7830adee3f9804253069315153f`.

## A. Audit before implementation

The three V2 renderers are separate and share `hw-*` presentation classes. They already create three self-check checkboxes, persist booleans under three distinct mission keys, and move the original collection status/actions into their layouts. 001 has a directly attached real image; 002/003 load real images off-DOM before replacing fallback art. All three WebP files exist on this base. `/t` and invalid-card rendering are separate.

Keep all original V2 renderers and storage functions. Add a presentation enhancement after V2 rendering that moves existing hero, mission, collection and action nodes into the pack order. Keep their event listeners and existing keys. Add only static content, route selection and scoped styling. Existing 001 photo framing guidance must be replaced in the rendered pack. Retain contextual visitor information behind a small disclosure rather than repeated large boxes.

## B. Source register

### Landmark and visitor facts

| Place | Claim used | Source | Checked date |
| --- | --- | --- | --- |
| Hwahongmun | Stone floodgate on Suwoncheon in Hwaseong; arches, stream and fortress are the three SEE subjects. | [SWCF facility guide](https://www.swcf.or.kr/english/?p=34&page=4), [Suwon City fortress exhibition](https://artsandculture.google.com/story/suwon-hwaseong-fortress-suwon-city/sQWBo3ZQ5R_CLQ?hl=en) | 2026-09-16 |
| Hwaseong Haenggung | Jeongjo used the temporary palace; a short introduction to palace life rather than a superlative. | [SWCF palace introduction](https://www.swcf.or.kr/english/?p=35) | 2026-09-16 |
| Shinpungnu / Bongsudang | Main gate and royal audience chamber. Retain established card spelling Shinpungnu (official English guide also uses Sinpungnu). | [SWCF building guide](https://www.swcf.or.kr/english/?p=37&page=2) | 2026-09-16 |
| Banghwasuryujeong | Built in 1794; lookout, command and pavilion roles; connection to surrounding landscape. | [SWCF pavilion entry](https://www.swcf.or.kr/english/?idx=681&mode=view&p=34&rIdx=99998857) | 2026-09-16 |
| Yongyeon | Pond next to the pavilion forms part of the experience; no precise photo position. | [Suwon City fortress exhibition](https://artsandculture.google.com/story/suwon-hwaseong-fortress-suwon-city/sQWBo3ZQ5R_CLQ?hl=en), [SWCF historical walking itinerary](https://www.swcf.or.kr/?p=124_write&receiptIdx=560&receiptYear=2024&totalReceiptEndYn=N) | 2026-09-16 |
| Fortress admission | Free. Do not promise a specific access schedule for every pavilion or path. | [Current Korean SWCF guide](https://www.swcf.or.kr/?p=65), [English guide](https://www.swcf.or.kr/english/?p=38) | 2026-09-16 |
| Palace visitor information | Regular 09:00–18:00, last admission 17:00, adult KRW 2,000. Seasonal 2026 night opening May 1–Nov 1, Fri–Sun/public holidays 18:00–21:30, last admission 21:00. | [Current Korean SWCF guide](https://www.swcf.or.kr/?p=65) | 2026-09-16 |
| Haenggung-dong | Neighbourhood streets with cafes and food options; choose a pause rather than list many shops. | [SWCF neighbourhood guide](https://www.swcf.or.kr/ebook/01/sub5_2.html), [KTO Haengnidan-gil](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=32eb7381-37db-4a49-bf72-9a93aa14d454) | 2026-09-16 |

**Conflict handling:** The English fortress guide lists 09:00–18:00 while the Korean guide describes open access. Pack 001/003 therefore show free admission with a current-information link, not a definitive opening/lighting schedule. Palace hours use the newer Korean notice; the English palace last-admission time and night season are older. No local business prices or opening times are copied into the pack.

### LOCAL PICKS — operational evidence, location and editorial reason

Evidence means listed as operating in sources checked on this date, not a promise the door is open when the visitor arrives. No on-site, telephone, English-menu, dietary or accessibility verification was performed. No ratings determine selection. Each card has exactly three picks: EAT, CAFE, LOCAL.

| Place | Claim / location / why selected | Sources and operational evidence | Checked date |
| --- | --- | --- | --- |
| Boyoung Mandu — North Gate main branch / 보영만두 북문본점 | Dumplings and jjolmyeon; 271 Paldal-ro. Food option for the northern fortress cluster, used on 001/003. English copy explains food type and identifies the exact branch. | [Diningcode listing](https://www.diningcode.com/profile.php?rid=qiiPwhoYeuEZ) shows the same address, menu and an active September schedule; [Tripadvisor listing](https://www.tripadvisor.co.kr/Restaurant_Review-g424960-d8880181-Reviews-Boyoung_Mandoo_North_Gate_Main-Suwon_Gyeonggi_do.html) independently lists the branch, address and operating hours. Tabling search also found this branch but full-page retrieval failed, so it is not relied on. | 2026-09-16 |
| Jung Jiyoung Coffee Roasters — Hwahongmun / 정지영커피로스터즈 화홍문점 | Coffee shop at 375 Suwoncheon-ro. A named coffee break after the stream/pond on 001/003, no quietness or rooftop access guarantee. | [Operator's current branch list](https://jungjiyoungcoffee.com/shopinfo/store.html) names branch, address and cafe use; [25 Aug 2026 operator interview](https://v.daum.net/v/20260825040210382) confirms the brand's current Hwahongmun and Haenggung branches. | 2026-09-16 |
| Jung Jiyoung Coffee Roasters — Haenggung main branch / 정지영커피로스터즈 행궁본점 | Coffee roaster/cafe at 42 Sinpung-ro. A coffee pause in the palace neighbourhood, used on 002. | [Operator's current branch list](https://jungjiyoungcoffee.com/shopinfo/store.html), [25 Aug 2026 operator interview](https://v.daum.net/v/20260825040210382). No hours carried over because listing/review times vary across branches. | 2026-09-16 |
| Jinmi Tongdak / 진미통닭 | Fried chicken at 21 Jeongjo-ro 800beon-gil, in the chicken-street area. A meal option after the palace, used on 002. No invented portion size, queue, price or ranking. | [Diningcode branch listing](https://www.diningcode.com/profile.php?rid=ZmukzrEgQ4Er) has the address, chicken menu and active September schedule; [Tripadvisor branch listing](https://www.tripadvisor.co.kr/Restaurant_Review-g424960-d9020798-Reviews-Jinmi_Tongdak-Suwon_Gyeonggi_do.html) confirms address and operating listing. [KTO indexed entry](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=de406e05-3db6-45d5-b99b-4159dc92a1b0) corroborates chicken-street context, but full page failed to open and is supplemental only. Same-name branches in Nowon/Icheon/Mangpo are excluded. | 2026-09-16 |
| Suwon Traditional Culture Center / 수원전통문화관 | Traditional-culture venue at 893 Jeongjo-ro (adjacent etiquette building at 887). A way to add local culture to the fortress/palace day, used on all three cards. Check the programme first; no walk-in class or language guarantee. | [SWCF operator introduction](https://www.swcf.or.kr/?p=155) gives address and purpose; [current SWCF events](https://www.swcf.or.kr/?p=29) list September 2026 Jin Suwon exhibitions and [current education calendar](https://www.swcf.or.kr/?p=30) lists September–October 2026 activities. These are multiple pages from the same operator, not independent organisations. | 2026-09-16 |

Not included: unverified newly opened cafes, a large generic cafe directory, exact business times/prices, and Suwon Museum of Art as a named pick (operator pages timed out during direct review). No commercial partnership, benefit or reservation capability is claimed.

### Geography and route reasoning

| Place / route | Claim / reasoning | Source | Checked date |
| --- | --- | --- | --- |
| Northern cluster | Hwahongmun, Yongyeon, Banghwasuryujeong and the traditional culture centre belong to a connected northern fortress visit. The historical guided sequence explicitly links pavilion → pond → gate; use it as geographic context, not as a currently bookable tour. | [SWCF access guide](https://www.swcf.or.kr/?p=68), [historical walking sequence](https://www.swcf.or.kr/?p=124_write&receiptIdx=560&receiptYear=2024&totalReceiptEndYn=N), [2026 heritage-night area](https://www.visitsuwon.or.kr/base/menu/baseView?menuLevel=2&menuNo=9) | 2026-09-16 |
| Palace → neighbourhood → northern cluster | Palace is on Jeongjo-ro 825; cafe/Haenggung-dong lies around Sinpung-ro; traditional centre is Jeongjo-ro 893, leading toward the northern cluster. Use area transitions, not a turn-by-turn path. | [SWCF visitor addresses](https://www.swcf.or.kr/?p=65), [neighbourhood guide](https://www.swcf.or.kr/ebook/01/sub5_2.html), [centre address](https://www.swcf.or.kr/?p=155), [coffee operator addresses](https://jungjiyoungcoffee.com/shopinfo/store.html) | 2026-09-16 |
| Complete day | Palace → Haenggung-dong → Hwahongmun → Yongyeon → Banghwasuryujeong. Editorial sequence combines palace, neighbourhood and adjacent northern sights; palace first allows admission planning. Meal/coffee is optional in the neighbourhood. | Above geographic evidence plus [SWCF day-trip guidance](https://www.swcf.or.kr/?p=66). This exact sequence is our editorial inference, not an official published itinerary. | 2026-09-16 |

The original numeric duration labels were not supported by field measurements and have been removed. V1 now uses SHORT / STANDARD / EXTENDED to describe itinerary scope, not completion time. Queues, full palace visits, exhibitions, classes and meals vary. No metres, minutes per leg, arrival estimates, walking polylines, coordinates or live routing are published. External maps search individual places only. The SHORT palace option is an interior sampler after admission, not a full palace tour. The three route arrays and stop sequences are unchanged; duration labels may be reconsidered only after field validation.

## C. Approved implementation content plan (autonomous editorial decision)

| Card | Theme / START | SEE (max 3) | PHOTO areas | LOCAL PICKS | NEXT |
| --- | --- | --- | --- | --- | --- |
| 001 | FOLLOW THE WATER. Pause near the water gate and notice how Suwoncheon passes through the fortress. | Arches; water; fortress view | Hwahongmun area; Suwoncheon public paths | Boyoung; Jung Jiyoung Hwahongmun; traditional centre | Banghwasuryujeong / Card 003; Haenggung-dong |
| 002 | STEP INTO JEONGJO’S SUWON. Start at the main entrance and look over the palace layout before going inside. | Shinpungnu; courtyards; Bongsudang | Palace courtyards; Shinpungnu area | Jinmi; Jung Jiyoung Haenggung; traditional centre | Haenggung-dong; Hwahongmun / Card 001 |
| 003 | PAUSE BY YONGYEON. Begin around Yongyeon and notice how the pavilion, wall and pond form one scene. | Pavilion; Yongyeon; fortress landscape | Yongyeon pond-side; pavilion area | Boyoung; Jung Jiyoung Hwahongmun; traditional centre | Hwahongmun / Card 001; Hwaseong Haenggung / Card 002 |

| Card | SHORT | STANDARD | EXTENDED |
| --- | --- | --- | --- |
| 001 | Hwahongmun → Yongyeon → Banghwasuryujeong | Hwahongmun → Banghwasuryujeong → Yongyeon → Jung Jiyoung Hwahongmun | Hwahongmun → Banghwasuryujeong → traditional centre → Haenggung-dong → Hwaseong Haenggung |
| 002 | Shinpungnu → palace courtyards → Bongsudang | Hwaseong Haenggung → Haenggung-dong → Jung Jiyoung Haenggung | Hwaseong Haenggung → Haenggung-dong → Hwahongmun → Yongyeon → Banghwasuryujeong |
| 003 | Banghwasuryujeong → Yongyeon → Hwahongmun | Banghwasuryujeong → Yongyeon → Hwahongmun → Jung Jiyoung Hwahongmun | Banghwasuryujeong → Hwahongmun → traditional centre → Haenggung-dong → Hwaseong Haenggung |

UI plan: compact real-card image; one hero CTA; four non-sticky anchors (START, ROUTE, LOCAL, COLLECTION); editorial rows rather than repeated boxes; one route panel visible at a time; three local disclosures with address and map link; two NEXT choices; existing mission and collection nodes reused; premium complete-day section only when the existing three-card completion predicate is true. No extra saved route key.

## Field verification still required

Walk all nine suggested sequences and assess actual duration with stops, crossings and current access. Check queue/meal time, business signage and entry, non-Korean ordering, menus, accessibility and programme booking/language. The source review establishes locations and operating evidence; it is not first-hand product validation or evidence that buyers value the pack at KRW 9,900.

## Premium polish follow-up

Scope: presentation changes after approved local commit `ef20d0eb03cccc57fab43c8d4f27408eb7844a7e`. No new travel facts or venues were researched or added in this follow-up. The source register and checked dates above are retained from the initial research, not a claim of renewed operating checks.

The five venue/branch identities, addresses, map searches and supporting links remain unchanged. Selection copy now connects each existing pick to the itinerary: northern-fortress meal, palace-to-chicken-street meal, stream-side coffee pause, palace-neighbourhood coffee pause, and traditional culture alongside the fortress visit. No promotion, benefit, price, opening-time or ranking claim was added. The displayed notice remains: “Checked 16 Sep 2026. Confirm today’s opening before setting off.”

PHOTO areas and route stop sequences are unchanged. Completion copy describes a collector route; it adds no time guarantee or extra unlock mechanism.
