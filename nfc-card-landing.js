/* Suwon NFC/QR entry. Existing collection and mission storage contracts preserved. */
(function () {
  'use strict';

  let language = 'en';
  try { const saved = localStorage.getItem('koreaRouteLang'); if (['en','ko','ja'].includes(saved)) language = saved; } catch (_) {}
  const text = (en, ko, ja) => language === 'ko' ? ko : language === 'ja' ? ja : en;
  // Presentation dictionary only. Storage values and map queries remain unchanged.
  const translations = {
    'Hwahongmun':['화홍문','華虹門'], 'HWAHONGMUN':['화홍문','華虹門'],
    'Hwaseong Haenggung':['화성행궁','華城行宮'], 'HWASEONG HAENGGUNG':['화성행궁','華城行宮'],
    'Banghwasuryujeong':['방화수류정','訪花隨柳亭'], 'BANGHWASURYUJEONG':['방화수류정','訪花隨柳亭'],
    'Haenggung-dong':['행궁동','行宮洞'], 'Suwoncheon walk':['수원천 산책','水原川の散策'],
    'Yongyeon':['용연','龍淵'], 'Suwoncheon':['수원천','水原川'], 'Shinpungnu':['신풍루','新豊楼'], 'Bongsudang':['봉수당','奉寿堂'],
    'SUWON':['수원','水原'], 'SUWON COLLECTION':['수원 컬렉션','水原コレクション'],
    'Which card do you have?':['수원 카드 컬렉션','水原カードコレクション'],
    'Card not found':['카드를 찾을 수 없어요','カードが見つかりません'],
    'Tap a card below to open its travel page.':['카드를 열면 이 브라우저의 컬렉션에 추가됩니다.','カードを開くと、このブラウザのコレクションに追加されます。'],
    'This NFC card address is not in the current Suwon collection.':['현재 수원 컬렉션에 없는 카드 주소입니다.','このカードのアドレスは現在の水原コレクションにありません。'],
    'Your collection could not be read in this browser. Your existing collection has not been changed.':['컬렉션을 읽을 수 없습니다. 기존 기록은 변경하지 않았습니다.','コレクションを読み込めません。既存の記録は変更していません。'],
    'Your collection could not be saved or read in this browser. Your existing collection has not been changed.':['컬렉션을 저장하거나 읽을 수 없습니다. 기존 기록은 변경하지 않았습니다.','コレクションを保存・読み込みできません。既存の記録は変更していません。'],
    "🏆 Suwon Complete! You've collected all 3 cards.":['🏆 수원 컬렉션 완성! 카드 3장을 모두 모았어요.','🏆 水原コレクション完成！3枚のカードがそろいました。'],
    'View Suwon cards':['수원 카드 보기','水原カードを見る'], 'Open Korea Route':['코리아 루트 열기','Korea Routeを開く'],
    'Start with LOOK':['먼저 둘러보기','まずは見てみる'], 'Why visit':['이 장소의 이야기','この場所の物語'],
    'Quick visit info':['방문 정보','訪問情報'], 'Don’t miss':['살펴볼 곳','見どころ'],
    'Photo spot':['사진 남기기','写真を残す'], 'PHOTO ZONE':['사진 남기기','写真を残す'],
    'Explore next':['주변 더 둘러보기','周辺も見てみる'], 'Three small missions':['세 가지 작은 미션','3つの小さなミッション'],
    'Look. Walk. Make a memory. Check each one when you’re done.':['보고, 걷고, 추억을 남겨보세요. 마치면 직접 체크하세요.','見て、歩いて、思い出を残しましょう。終わったら自分でチェックしてください。'],
    'LOOK':['보기','見る'], 'WALK':['걷기','歩く'], 'PHOTO':['사진','撮る'],
    'Self-checked, saved in this browser. No GPS check or photo upload.':['직접 체크한 기록은 이 브라우저에 저장됩니다. GPS 확인이나 사진 업로드는 없습니다.','自分でチェックした記録をこのブラウザに保存します。GPS確認や写真のアップロードはありません。'],
    'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.':['이번 화면에서만 체크할 수 있습니다. 저장할 수 없어 기존 기록은 유지했습니다.','チェックは今回の画面だけに反映されます。保存できないため、既存の記録は維持しました。'],
    'Your Suwon collection':['나의 수원 컬렉션','水原のマイコレクション'],
    'Collected':['수집됨','収集済み'], 'Still to discover':['미수집','未収集'], 'Status unavailable':['상태 확인 불가','状態を確認できません'],
    'One place, one card, one more memory. Mission checks are separate from card collecting.':['장소마다 카드 한 장, 추억 하나. 미션 체크와 카드 수집은 별개입니다.','1つの場所に1枚のカード、1つの思い出。ミッションのチェックとカード収集は別です。'],
    'Keep travelling with Korea Route':['코리아 루트로 여행 이어가기','Korea Routeで旅を続ける'],
    'Open Korea Route, then choose Find a route, Explore nearby or My Trip from the home screen.':['코리아 루트 홈에서 이동, 주변 탐색, 내 여행을 이용하세요.','Korea Routeのホームから移動、周辺探索、マイ旅行を利用できます。'],
    'Visitor information & review notes':['방문 정보와 확인 사항','訪問情報と確認事項'],
    'Official visitor information':['공식 방문 안내','公式の訪問案内'],
    'Check current visitor information before your visit.':['방문 전 최신 안내를 확인하세요.','訪問前に最新の案内を確認してください。'],
    'Check current visitor information before your visit. Seasonal dates may change.':['방문 전 최신 안내를 확인하세요. 계절 운영 일정은 변경될 수 있습니다.','訪問前に最新の案内を確認してください。季節営業の日程は変更される場合があります。'],
    'Pause here and take in Hwahongmun’s stone arches and waterway.':['이곳에서 잠시 멈춰 화홍문의 돌 아치와 물길을 살펴보세요.','ここで少し立ち止まり、華虹門の石造アーチと水路を眺めてみましょう。'],
    'A historic water gate in Hwaseong Fortress':['수원화성의 역사적인 수문','水原華城の歴史ある水門'],
    'Stone arches over Suwoncheon Stream':['수원천 위에 놓인 돌 아치','水原川に架かる石のアーチ'],
    'A place to pause, look and follow the water':['잠시 멈춰 물길을 바라보는 곳','立ち止まって水の流れを眺める場所'],
    'Continue toward Banghwasuryujeong · Card 003':['방화수류정으로 이어가기 · 카드 003','訪花隨柳亭へ続く · カード003'],
    'Cost':['입장료','入場料'], 'Free fortress admission':['성곽 관람 무료','城郭の観覧は無料'],
    'Official visitor guide · checked 15 Sep 2026':['공식 안내 · 2026년 9월 15일 확인','公式案内 · 2026年9月15日確認'],
    'Best time':['방문 제안','訪問のヒント'], 'Daylight for an easy first look':['처음 둘러볼 때는 밝은 낮에','初めて見るなら明るい時間に'],
    'Editorial suggestion · not an opening-hours claim':['방문 제안이며 운영시간 안내가 아닙니다','訪問の提案であり、営業時間の案内ではありません'],
    'Time needed':['체류 시간','滞在時間'], 'Flexible stop':['자유롭게 머무르기','自分のペースで滞在'],
    'No fixed visit duration is claimed':['정해진 소요시간을 안내하지 않습니다','所要時間は定めていません'],
    'Walking difficulty':['보행 여건','歩行環境'], 'Check the path on site':['현장에서 길 확인','現地で道を確認'],
    'Steps and accessibility have not yet been surveyed':['계단과 접근성은 아직 현장 조사 전입니다','階段やバリアフリー状況は現地調査前です'],
    'The arches':['돌 아치','石のアーチ'], 'Look at the repeating stone openings. Which details catch your eye?':['이어지는 돌 아치를 보세요. 어떤 부분이 눈에 들어오나요?','連なる石のアーチを見てみましょう。どんな細部が目に留まりますか。'],
    'The waterway':['물길','水の流れ'], 'Notice how the stream passes through the gate. Watch from an open public path.':['개방된 공공 보행로에서 수문을 지나는 물길을 살펴보세요.','開放された公共の道から、水門を通る流れを眺めてください。'],
    'The next view':['다음 풍경','次の風景'], 'Look for the way toward Banghwasuryujeong, then check the map before setting off.':['방화수류정 방향을 찾고 출발 전 지도를 확인하세요.','訪花隨柳亭への方向を探し、出発前に地図を確認してください。'],
    'Try framing the stone arches and the stream in one photo from an open public path. Choose your own angle and keep the walkway clear.':['개방된 보행로에서 아치와 물길을 함께 담아보세요. 통행을 막지 않는 곳에서 촬영하세요.','開放された道からアーチと流れを一枚に収めてみましょう。通行を妨げない場所で撮影してください。'],
    'Field note · The exact viewpoint is not pinned yet. Use an open public path, keep the walkway clear and choose the angle that works for you.':['현장 안내 · 촬영 지점은 지정하지 않았습니다. 개방된 보행로에서 통행을 방해하지 않는 구도를 선택하세요.','現地メモ · 撮影地点は指定していません。開放された道で通行を妨げない構図を選んでください。'],
    'Choose one next stop. There’s no need to do everything.':['다음에 갈 곳을 골라보세요. 모두 둘러볼 필요는 없습니다.','次に行く場所を選びましょう。すべて回る必要はありません。'],
    'Trade the water-gate view for a pavilion stop.':['수문 다음에는 정자 풍경을 살펴보세요.','水門の次は亭の風景を眺めてみましょう。'],
    'Look around the pavilion area and make time for another pause.':['정자 주변을 둘러보고 잠시 쉬어가세요.','亭の周辺を見て、ひと息ついてみましょう。'],
    'Follow the stream':['물길 따라가기','川沿いを歩く'], 'Keep the water as the thread of your walk.':['물길을 따라 산책을 이어가세요.','水の流れに沿って散策を続けましょう。'],
    'Choose a short stroll along an open section of the stream.':['개방된 하천 구간에서 짧게 걸어보세요.','開放された川沿いの区間で少し歩いてみましょう。'],
    'Explore the neighbourhood':['주변 동네 둘러보기','周辺の街を歩く'],
    'Take a break from the fortress and explore the surrounding streets.':['성곽을 벗어나 주변 거리를 둘러보세요.','城郭から少し離れて周辺の通りを歩いてみましょう。'],
    'Wander at your own pace; choose any stops after checking them on site.':['현장에서 확인하며 자신의 속도로 둘러보세요.','現地の様子を確認しながら自分のペースで歩きましょう。'],
    'Make the palace your next landmark.':['궁궐을 다음 목적지로 골라보세요.','次の目的地に宮殿を選んでみましょう。'],
    'Plan a separate palace visit; confirm admission and opening times first.':['궁궐 방문 전 입장 안내와 운영시간을 확인하세요.','宮殿を訪れる前に入場案内と営業時間を確認してください。'],
    'Map links search for the place. They do not verify a walking route or collect another card.':['지도 링크는 장소 검색용입니다. 도보 경로를 검증하거나 다른 카드를 수집하지 않습니다.','地図リンクは場所の検索用です。徒歩ルートの確認や別のカードの収集は行いません。'],
    'Pause and observe the stone arches and the water passing through them.':['잠시 멈춰 돌 아치와 그 사이로 흐르는 물을 보세요.','立ち止まって石のアーチと、その間を流れる水を眺めましょう。'],
    'Follow an open public route toward Banghwasuryujeong. Check signs and the map first.':['표지판과 지도를 먼저 확인하고 개방된 길로 방화수류정 방향을 걸어보세요.','案内板と地図を確認してから、開放された道で訪花隨柳亭の方向へ歩きましょう。'],
    'Take your own Hwahongmun photo and keep it on your phone.':['화홍문 사진을 찍어 자신의 휴대전화에 남겨보세요.','華虹門の写真を撮り、自分のスマートフォンに残しましょう。'],
    'Step through the gate and into King Jeongjo’s Suwon.':['문을 지나 정조의 수원 이야기를 만나보세요.','門をくぐり、正祖の水原の物語に触れてみましょう。'],
    'A temporary palace used by King Jeongjo':['정조가 머물렀던 행궁','正祖が滞在した行宮'],
    'A place he stayed when visiting his father’s tomb':['아버지의 묘를 방문할 때 머물던 곳','父の墓を訪れる際に滞在した場所'],
    'Shinpungnu, the main gate':['정문 신풍루','正門の新豊楼'],
    'Royal residence and historical administrative functions':['왕의 거처와 행정 기능을 갖춘 공간','王の滞在と行政の役割を持った空間'],
    'Regular hours':['일반 관람시간','通常の観覧時間'], 'Daytime visits':['주간 관람','昼間の観覧'],
    'Last admission':['마지막 입장','最終入場'], 'Regular daytime admission':['일반 주간 입장','通常の昼間入場'],
    'Adult admission':['성인 입장료','大人の入場料'], 'Check current visitor information':['최신 방문 안내 확인','最新の訪問案内を確認'],
    '2026 night opening · seasonal':['2026 계절 야간 개장','2026年の季節夜間公開'],
    'May 1 – Nov 1, 2026 · Friday–Sunday and public holidays':['2026년 5월 1일~11월 1일 · 금~일요일 및 공휴일','2026年5月1日〜11月1日 · 金〜日曜・祝日'],
    '18:00–21:30 · Last admission 21:00':['18:00–21:30 · 마지막 입장 21:00','18:00–21:30 · 最終入場21:00'],
    'Pause at the main gate before you enter.':['입장 전 정문을 잠시 살펴보세요.','入場前に正門を眺めてみましょう。'],
    'Palace courtyards':['궁궐 마당','宮殿の中庭'], 'Follow the open visitor route through the complex.':['개방된 관람 동선을 따라 둘러보세요.','開放された観覧ルートに沿って歩いてください。'],
    'Look for one of the key buildings inside the palace.':['궁궐 안의 주요 전각을 찾아보세요.','宮殿内の主要な建物を探してみましょう。'],
    'Pause at Shinpungnu and notice the two-story gate before entering.':['입장 전 신풍루의 2층 문루를 살펴보세요.','入場前に新豊楼の二層の門を眺めてみましょう。'],
    'Follow the open visitor route through the palace courtyards.':['개방된 관람 동선을 따라 궁궐 마당을 걸어보세요.','開放された観覧ルートに沿って宮殿の中庭を歩きましょう。'],
    'Photograph a palace detail or courtyard view and keep it on your phone.':['궁궐의 작은 장식이나 마당을 찍어 자신의 휴대전화에 남겨보세요.','宮殿の細部や中庭を撮り、自分のスマートフォンに残しましょう。'],
    'Choose your next Suwon stop.':['다음에 둘러볼 수원 장소를 골라보세요.','次に見る水原の場所を選びましょう。'],
    'Continue into the surrounding streets and choose a stop on site.':['주변 거리로 이어가며 현장에서 들를 곳을 골라보세요.','周辺の通りへ進み、現地で立ち寄る場所を選びましょう。'],
    'Change the palace view for stone arches and the stream.':['궁궐 다음에는 돌 아치와 물길을 만나보세요.','宮殿の次は石のアーチと川の流れを眺めましょう。'],
    'Make the pavilion your next place to pause and look around.':['정자에서 잠시 멈춰 주변을 둘러보세요.','亭でひと息つき、周辺を見てみましょう。'],
    'These map links search for places. Walking times and exact routes are not verified; opening a map does not collect a card.':['지도 링크는 장소 검색용입니다. 도보 시간과 정확한 경로는 미검증이며 지도를 열어도 카드가 수집되지 않습니다.','地図リンクは場所の検索用です。徒歩時間と正確な経路は未確認です。地図を開いてもカードは収集されません。'],
    'The last place on this suggested route: Banghwasuryujeong and Yongyeon.':['이 후보 코스의 마지막 풍경 장소, 방화수류정과 용연을 만나보세요.','このルート候補の最後の場所、訪花隨柳亭と龍淵の景色を楽しみましょう。'],
    'Built in 1794 within Suwon Hwaseong Fortress':['1794년에 수원화성에 세워진 건축물','1794年に水原華城内に建てられた建築物'],
    'A lookout, command post and pavilion in one':['망루, 지휘소, 정자의 역할을 함께한 곳','見張り台、指揮所、亭の役割を兼ねた場所'],
    'Architecture shaped to fit the surrounding landscape':['주변 지형과 어우러지는 건축','周辺の地形に調和した建築'],
    'Yongyeon pond is part of the scene around the pavilion':['정자 주변 풍경을 이루는 용연','亭の周辺の景色をつくる龍淵'],
    'Hwaseong Fortress admission':['수원화성 관람료','水原華城の観覧料'], 'Free':['무료','無料'],
    'Current official visitor information':['현재 공식 방문 안내','現在の公式訪問案内'],
    'Fortress viewing':['성곽 관람','城郭の観覧'], 'Open access':['개방 관람','開放観覧'],
    'Official guide: night viewing is possible':['공식 안내: 야간 관람 가능','公式案内：夜間の観覧が可能'],
    'The pavilion itself':['정자 건축','亭の建築'],
    'Notice how the structure combines a fortress function with a place to pause and look out.':['성곽 기능과 전망을 즐기는 공간이 어떻게 어우러지는지 보세요.','城郭の機能と景色を眺める空間がどう組み合わさっているか見てみましょう。'],
    'Spend a moment around the pond-side area.':['연못 주변에서 잠시 머물러보세요.','池の周辺でひと息ついてみましょう。'],
    'The fortress surroundings':['주변 성곽','周辺の城郭'], 'Look at how the pavilion, wall and landscape connect.':['정자와 성곽, 주변 풍경의 연결을 살펴보세요.','亭と城壁、風景のつながりを眺めましょう。'],
    'Leave a photo memory around Yongyeon or the pavilion area.':['용연이나 정자 주변에서 찍은 사진을 자신의 휴대전화에 남겨보세요.','龍淵や亭の周辺で撮った写真を、自分のスマートフォンに残しましょう。'],
    'Yongyeon pond-side area':['용연 주변','龍淵の周辺'], 'Around Banghwasuryujeong pavilion':['방화수류정 주변','訪花隨柳亭の周辺'],
    'Pause and notice how the pavilion, fortress wall and landscape meet.':['잠시 멈춰 정자와 성곽, 풍경이 만나는 모습을 보세요.','立ち止まって亭と城壁、風景が出会う様子を眺めましょう。'],
    'Take a short walk around the open public area near Yongyeon and Banghwasuryujeong.':['용연과 방화수류정 주변의 개방된 공공 구역을 걸어보세요.','龍淵と訪花隨柳亭付近の開放された公共エリアを歩きましょう。'],
    'Take a photo around Yongyeon or the pavilion and keep it on your phone.':['용연이나 정자 주변에서 사진 한 장을 찍어 자신의 휴대전화에 남겨보세요.','龍淵や亭の周辺で写真を一枚撮り、自分のスマートフォンに残しましょう。'],
    'Continue the fortress story with the water gate and stream.':['수문과 물길을 따라 성곽 이야기를 이어가세요.','水門と川に沿って城郭の物語を続けましょう。'],
    'Pond surroundings':['연못 주변','池の周辺'], 'Stay with the landscape and explore the public area around the pond.':['풍경을 보며 연못 주변 공공 구역을 둘러보세요.','景色を眺めながら池の周辺の公共エリアを歩きましょう。'],
    'Add a palace visit to your Suwon journey. Check visitor information before entering.':['궁궐 방문을 더해보세요. 입장 전 방문 안내를 확인하세요.','宮殿にも立ち寄ってみましょう。入場前に訪問案内を確認してください。'],
    'Suwon Cultural Foundation · fortress information':['수원문화재단 · 성곽 안내','水原文化財団・城郭案内'],
    'Official visitor information · admission':['공식 방문 안내 · 입장료','公式訪問案内・入場料'],
    'Water-gate context and fortress admission checked against the official guide on 15 Sep 2026. Lighting, visit duration, accessibility and the photo viewpoint need review.':['수문 이야기와 성곽 입장 안내는 2026년 9월 15일 공식 안내로 확인했습니다. 조명, 소요시간, 접근성, 촬영 지점은 추가 확인이 필요합니다.','水門の背景と城郭の入場案内は2026年9月15日に公式案内で確認しました。照明、滞在時間、アクセス、撮影地点は追加確認が必要です。'],
    'Suwon Cultural Foundation · palace history':['수원문화재단 · 행궁 역사','水原文化財団・行宮の歴史'],
    'Official visitor information · hours and admission':['공식 안내 · 관람시간 및 입장료','公式案内・観覧時間と入場料'],
    '2026 seasonal night opening':['2026 계절 야간 개장','2026年の季節夜間公開'],
    'Checked 15 Sep 2026. Regular and seasonal admission times are shown separately. Confirm the latest notice before visiting.':['2026년 9월 15일 확인. 일반·계절 입장시간은 구분해 안내합니다. 방문 전 최신 공지를 확인하세요.','2026年9月15日確認。通常と季節営業の入場時間を分けて表示しています。訪問前に最新のお知らせを確認してください。'],
    'Suwon Cultural Foundation · pavilion history':['수원문화재단 · 정자 역사','水原文化財団・亭の歴史'],
    'Official fortress visitor information':['공식 성곽 방문 안내','公式の城郭訪問案内'],
    'History and current fortress visitor information checked 16 Sep 2026. Check the latest visitor notices before your visit.':['역사 및 성곽 방문 안내는 2026년 9월 16일 확인했습니다. 방문 전 최신 공지를 확인하세요.','歴史と城郭の訪問案内は2026年9月16日に確認しました。訪問前に最新のお知らせを確認してください。']
  };
  function translate(value) {
    const s = String(value);
    if (language === 'en') return s;
    if (translations[s]) return translations[s][language === 'ko' ? 0 : 1];
    let m;
    if ((m = s.match(/^(\d)\/3 missions complete/))) return text('',m[1]+'/3 미션 완료',m[1]+'/3 ミッション完了');
    if ((m = s.match(/^(?:SUWON COLLECTION |Collected so far: |🎴 New card collected! \(|Already collected · Suwon )(\d)\/3/))) return text('','수원 컬렉션 '+m[1]+'/3','水原コレクション '+m[1]+'/3');
    if (s === 'SUWON COLLECTION · unavailable') return text('','수원 컬렉션 · 확인 불가','水原コレクション・確認できません');
    if ((m = s.match(/^(?:SUWON CARD |Card )(\d{3})$/))) return text('','수원 카드 '+m[1],'水原カード '+m[1]);
    if ((m = s.match(/^(\d{3}) (.+)$/))) return m[1]+' '+translate(m[2]);
    if ((m = s.match(/^SUWON (\d{3}) · (.+)$/))) return text('','수원 ','水原 ')+m[1]+' · '+translate(m[2]);
    if ((m = s.match(/^Find (.+)$/))) return translate(m[1])+text('',' 지도 보기','の地図を見る');
    return s;
  }

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const storageKey = 'koreaRouteCardCollection';
  const cards = [
    {
      id: 'suwon-001',
      number: '001',
      title: 'Hwahongmun',
      korean: '화홍문',
      label: 'Hwahongmun (001)',
      subtitle: 'The Floodgate on Suwoncheon Stream',
      body: 'Hwahongmun is a beautiful stone floodgate where the Suwoncheon stream flows through Suwon Hwaseong Fortress. Free to visit, open anytime — especially lovely lit up at night. Right next to Banghwasuryujeong pavilion (Card 003).',
      badges: ['FREE', 'Open anytime']
    },
    {
      id: 'suwon-002',
      number: '002',
      title: 'Hwaseong Haenggung',
      korean: '화성행궁',
      label: 'Hwaseong Haenggung (002)',
      subtitle: 'The Royal Palace of King Jeongjo',
      body: 'Hwaseong Haenggung is the largest royal detached palace in Korea, built for King Jeongjo. Admission required. A great place to see traditional guard-changing ceremonies and Joseon-era architecture.',
      badges: ['Admission 2,000 KRW (adult)', '09:00–18:00 (summer) / 09:00–17:00 (winter)', 'Open every day']
    },
    {
      id: 'suwon-003',
      number: '003',
      title: 'Banghwasuryujeong',
      korean: '방화수류정',
      label: 'Banghwasuryujeong (003)',
      subtitle: 'The Pavilion by Yongyeon Pond',
      body: 'Banghwasuryujeong is one of the most photographed spots on Suwon Hwaseong Fortress — a pavilion overlooking Yongyeon pond. Free to visit, open anytime. Just steps from Hwahongmun (Card 001).',
      badges: ['FREE', 'Open anytime']
    }
  ];
  const suwonIds = new Set(cards.map(item => item.id));
  const cardId = path.startsWith('/t/') ? path.slice(3) : '';
  const card = cards.find(item => item.id === cardId) || null;
  const isSelector = path === '/t';

  function readCollection() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return [];
    const collection = JSON.parse(raw);
    const ids = new Set();
    if (!Array.isArray(collection) || !collection.every(item => {
      if (!item || typeof item.id !== 'string' || !item.id ||
          typeof item.firstTapAt !== 'string' || !Number.isFinite(Date.parse(item.firstTapAt)) ||
          !Number.isSafeInteger(item.tapCount) || item.tapCount < 1 || ids.has(item.id)) return false;
      ids.add(item.id);
      return true;
    })) throw new Error('Invalid card collection');
    return collection;
  }

  function firstTapTime() {
    return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, -1) + '+09:00';
  }

  function suwonProgress(collection) {
    return collection.filter(item => suwonIds.has(item.id)).length;
  }

  function isSuwonComplete(collection) {
    return cards.every(item => collection.some(entry => entry.id === item.id));
  }

  function recordTap() {
    const collection = readCollection();
    if (!card) return { collection, isNew: false };
    const previous = collection.find(item => item.id === card.id);
    if (previous) {
      if (previous.tapCount === Number.MAX_SAFE_INTEGER) throw new Error('Tap count limit');
      previous.tapCount += 1;
    } else {
      collection.push({ id: card.id, firstTapAt: firstTapTime(), tapCount: 1 });
    }
    localStorage.setItem(storageKey, JSON.stringify(collection));
    return { collection, isNew: !previous };
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = translate(text);
    return node;
  }

  function cardLink(item) {
    const link = element('a', 'kr-card-choice');
    link.href = '/t/' + item.id;
    const num = element('span', 'kr-card-choice-num', item.number);
    const copy = element('span', 'kr-card-choice-copy');
    copy.appendChild(element('b', '', item.title));
    copy.appendChild(element('small', '', item.korean));
    link.append(num, copy);
    return link;
  }

  function renderSelector(main, collection, storageOk) {
    main.appendChild(element('p', 'kr-card-kicker', 'SUWON COLLECTION'));
    main.appendChild(element('h1', '', isSelector ? 'Which card do you have?' : 'Card not found'));
    main.appendChild(element('p', 'kr-card-subtitle', isSelector
      ? 'Tap a card below to open its travel page.'
      : 'This NFC card address is not in the current Suwon collection.'));

    const status = element('div', storageOk ? 'kr-card-status' : 'kr-card-status kr-card-storage-error');
    status.setAttribute('role', 'status');
    status.appendChild(element('p', '', storageOk
      ? `Collected so far: ${suwonProgress(collection)}/3`
      : 'Your collection could not be read in this browser. Your existing collection has not been changed.'));
    main.appendChild(status);

    const links = element('nav', 'kr-card-choices');
    links.setAttribute('aria-label', text('Suwon cards','수원 카드','水原カード'));
    cards.forEach(item => links.appendChild(cardLink(item)));
    main.appendChild(links);
  }

  function renderCard(main, result) {
    const art = element('section', 'kr-card-art');
    art.setAttribute('aria-label', translate('Card '+card.number)+': '+translate(card.title));
    art.appendChild(element('span', 'kr-card-art-city', 'SUWON'));
    art.appendChild(element('strong', 'kr-card-art-number', card.number));
    art.appendChild(element('b', 'kr-card-art-title', card.title.toUpperCase()));
    art.appendChild(element('small', 'kr-card-art-korean', card.korean));
    main.appendChild(art);

    main.appendChild(element('p', 'kr-card-kicker', `SUWON CARD ${card.number}`));
    const heading = element('h1');
    heading.appendChild(document.createTextNode(card.title + ' '));
    heading.appendChild(element('span', 'kr-card-hangul', `(${card.korean})`));
    main.appendChild(heading);
    main.appendChild(element('p', 'kr-card-subtitle', card.subtitle));
    main.appendChild(element('p', 'kr-card-description', card.body));

    const badges = element('ul', 'kr-card-badges');
    card.badges.forEach(text => badges.appendChild(element('li', '', text)));
    main.appendChild(badges);

    const status = element('div', result ? 'kr-card-status' : 'kr-card-status kr-card-storage-error');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    if (result) {
      const progress = suwonProgress(result.collection);
      status.appendChild(element('p', '', result.isNew
        ? `🎴 New card collected! (${progress}/3)`
        : `Already collected · Suwon ${progress}/3`));
      if (isSuwonComplete(result.collection)) {
        status.classList.add('kr-card-complete');
        status.appendChild(element('p', '', "🏆 Suwon Complete! You've collected all 3 cards."));
      }
    } else {
      status.appendChild(element('p', '', 'Your collection could not be saved or read in this browser. Your existing collection has not been changed.'));
    }
    main.appendChild(status);

    const actions = element('div', 'kr-card-actions');
    const all = element('a', 'kr-card-secondary', 'View Suwon cards');
    all.href = '/t';
    const home = element('a', 'kr-card-home', 'Open Korea Route');
    home.href = '/';
    actions.append(all, home);
    main.appendChild(actions);
  }

  // Hwahongmun V2 only. Existing collection writer and the other cards stay unchanged.
  function renderHwahongmunV2(main, result) {
    const status = main.querySelector('.kr-card-status');
    const actions = main.querySelector('.kr-card-actions');
    main.replaceChildren();
    main.classList.add('kr-hwahongmun-v2');
    const shell = document.getElementById('kr-card-landing');
    // Announce collection/mission changes, not the entire long travel guide.
    shell.removeAttribute('aria-live');

    function section(id, title) {
      const node = element('section', 'hw-section');
      node.id = id;
      node.setAttribute('aria-labelledby', id + '-title');
      const heading = element('h2', '', title);
      heading.id = id + '-title';
      node.appendChild(heading);
      main.appendChild(node);
      return node;
    }
    function link(text, href, className = 'hw-link') {
      const node = element('a', className, text);
      node.href = href;
      return node;
    }
    function mapLink(text, query) {
      const node = link(text, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query + ', Suwon, South Korea'));
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
      node.setAttribute('aria-label', translate(text) + (language==='ko'?' (새 탭에서 Google Maps 열기)':language==='ja'?'（新しいタブでGoogle Mapsを開く）':' (opens Google Maps in a new tab)'));
      return node;
    }
    function fieldNote(text) {
      return element('p', 'hw-review', 'Field note · ' + text);
    }

    const hero = element('section', 'hw-hero');
    hero.setAttribute('aria-labelledby', 'hw-title');
    hero.appendChild(element('p', 'hw-eyebrow', 'SUWON CARD 001'));
    const title = element('h1', '', 'HWAHONGMUN');
    title.id = 'hw-title';
    title.appendChild(element('span', 'hw-korean', '화홍문'));
    hero.appendChild(title);
    hero.appendChild(element('p', 'hw-intro', 'Pause here and take in Hwahongmun’s stone arches and waterway.'));
    const art = element('figure', 'hw-card-image');
    const artImage = element('img', 'hw-card-image-art');
    artImage.src = '/nfc-suwon-001-hwahongmun.webp';
    artImage.alt = translate('Card 001')+' · '+translate('Hwahongmun');
    artImage.width = 468;
    artImage.height = 742;
    artImage.loading = 'eager';
    artImage.decoding = 'async';
    art.appendChild(artImage);
    art.appendChild(element('figcaption', '', 'SUWON 001 · HWAHONGMUN'));
    hero.appendChild(art);
    hero.appendChild(link('Start with LOOK', '#hw-missions', 'hw-primary'));
    main.appendChild(hero);

    const why = section('hw-why', 'Why visit');
    const reasons = element('ul', 'hw-reasons');
    ['A historic water gate in Hwaseong Fortress', 'Stone arches over Suwoncheon Stream', 'A place to pause, look and follow the water', 'Continue toward Banghwasuryujeong · Card 003'].forEach(text => reasons.appendChild(element('li', '', text)));
    why.appendChild(reasons);

    const quick = section('hw-quick', 'Quick visit info');
    const facts = element('dl', 'hw-facts');
    [
      ['Cost', 'Free fortress admission', 'Official visitor guide · checked 15 Sep 2026'],
      ['Best time', 'Daylight for an easy first look', 'Editorial suggestion · not an opening-hours claim'],
      ['Time needed', 'Flexible stop', 'No fixed visit duration is claimed'],
      ['Walking difficulty', 'Check the path on site', 'Steps and accessibility have not yet been surveyed']
    ].forEach(([label, value, note]) => {
      const item = element('div');
      item.appendChild(element('dt', '', label));
      item.appendChild(element('dd', '', value));
      item.appendChild(element('dd', 'hw-fact-note', note));
      facts.appendChild(item);
    });
    quick.appendChild(facts);

    const miss = section('hw-dont-miss', 'Don’t miss');
    const sights = element('ol', 'hw-sights');
    [
      ['The arches', 'Look at the repeating stone openings. Which details catch your eye?'],
      ['The waterway', 'Notice how the stream passes through the gate. Watch from an open public path.'],
      ['The next view', 'Look for the way toward Banghwasuryujeong, then check the map before setting off.']
    ].forEach(([name, copy]) => {
      const item = element('li');
      item.append(element('h3', '', name), element('p', '', copy));
      sights.appendChild(item);
    });
    miss.appendChild(sights);

    const photo = section('hw-photo', 'Photo spot');
    photo.appendChild(element('p', '', 'Try framing the stone arches and the stream in one photo from an open public path. Choose your own angle and keep the walkway clear.'));
    photo.appendChild(fieldNote('The exact viewpoint is not pinned yet. Use an open public path, keep the walkway clear and choose the angle that works for you.'));

    const next = section('hw-next', 'Explore next');
    next.appendChild(element('p', 'hw-lead', 'Choose one next stop. There’s no need to do everything.'));
    const destinations = [
      ['Banghwasuryujeong', 'Card 003', 'Trade the water-gate view for a pavilion stop.', 'Look around the pavilion area and make time for another pause.', 'Find Banghwasuryujeong', 'Banghwasuryujeong'],
      ['Suwoncheon walk', 'Follow the stream', 'Keep the water as the thread of your walk.', 'Choose a short stroll along an open section of the stream.', 'Find Suwoncheon', 'Suwoncheon Stream'],
      ['Haenggung-dong', 'Explore the neighbourhood', 'Take a break from the fortress and explore the surrounding streets.', 'Wander at your own pace; choose any stops after checking them on site.', 'Find Haenggung-dong', 'Haenggung-dong'],
      ['Hwaseong Haenggung', 'Card 002', 'Make the palace your next landmark.', 'Plan a separate palace visit; confirm admission and opening times first.', 'Find Hwaseong Haenggung', 'Hwaseong Haenggung']
    ];
    destinations.forEach(([name, tag, whyGo, experience, action, query]) => {
      const item = element('article', 'hw-next-card');
      item.appendChild(element('p', 'hw-next-tag', tag));
      item.appendChild(element('h3', '', name));
      item.appendChild(element('p', '', whyGo));
      item.appendChild(element('p', 'hw-experience', experience));
      item.appendChild(mapLink(action, query));
      next.appendChild(item);
    });
    next.appendChild(element('p', 'hw-note', 'Map links search for the place. They do not verify a walking route or collect another card.'));

    const missions = section('hw-missions', 'Three small missions');
    missions.appendChild(element('p', 'hw-lead', 'Look. Walk. Make a memory. Check each one when you’re done.'));
    const missionKey = 'koreaRouteHwahongmunMissionsV2';
    const missionIds = ['look', 'walk', 'photo'];
    let checked = { look: false, walk: false, photo: false };
    let canSave = true;
    try {
      const raw = localStorage.getItem(missionKey);
      if (raw !== null) {
        const saved = JSON.parse(raw);
        if (!saved || Array.isArray(saved) || Object.keys(saved).length !== 3 || !missionIds.every(id => typeof saved[id] === 'boolean')) throw new Error('Invalid mission record');
        checked = saved;
      }
    } catch (_) { canSave = false; }
    const progress = element('p', 'hw-mission-progress');
    progress.setAttribute('role', 'status');
    const saveNote = element('p', 'hw-note');
    function updateMissionStatus() {
      const count = missionIds.filter(id => checked[id]).length;
      progress.textContent = translate(count === 3 ? '3/3 missions complete. A little Suwon memory, made by you.' : `${count}/3 missions complete`);
      saveNote.textContent = canSave
        ? 'Self-checked, saved in this browser. No GPS check or photo upload.'
        : 'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.';
      saveNote.textContent = translate(saveNote.textContent);
    }
    [
      ['look', 'LOOK', 'Pause and observe the stone arches and the water passing through them.'],
      ['walk', 'WALK', 'Follow an open public route toward Banghwasuryujeong. Check signs and the map first.'],
      ['photo', 'PHOTO', 'Take your own Hwahongmun photo and keep it on your phone.']
    ].forEach(([id, title, text]) => {
      const label = element('label', 'hw-mission');
      const input = element('input');
      input.type = 'checkbox';
      input.id = 'hw-mission-' + id;
      input.checked = checked[id];
      input.setAttribute('aria-labelledby', input.id + '-title');
      input.setAttribute('aria-describedby', input.id + '-text');
      const copy = element('span');
      const name = element('strong', '', title); name.id = input.id + '-title';
      const detail = element('span', '', text); detail.id = input.id + '-text';
      copy.append(name, detail);
      input.addEventListener('change', () => {
        checked[id] = input.checked;
        if (canSave) {
          try { localStorage.setItem(missionKey, JSON.stringify(checked)); }
          catch (_) { canSave = false; }
        }
        updateMissionStatus();
      });
      label.append(input, copy);
      missions.appendChild(label);
    });
    updateMissionStatus();
    missions.append(progress, saveNote);

    const collection = section('hw-collection', 'Your Suwon collection');
    collection.appendChild(element('p', 'hw-collection-count', result ? `SUWON COLLECTION ${suwonProgress(result.collection)}/3` : 'SUWON COLLECTION · unavailable'));
    collection.appendChild(status);
    const list = element('ul', 'hw-collection-list');
    cards.forEach(item => {
      const owned = result && result.collection.some(entry => entry.id === item.id);
      const row = element('li');
      row.appendChild(element('b', '', `${item.number} ${item.title}`));
      row.appendChild(element('span', '', result ? (owned ? 'Collected' : 'Still to discover') : 'Status unavailable'));
      list.appendChild(row);
    });
    collection.appendChild(list);
    collection.appendChild(element('p', 'hw-note', 'One place, one card, one more memory. Mission checks are separate from card collecting.'));

    const open = section('hw-open', 'Keep travelling with Korea Route');
    open.appendChild(element('p', '', 'Open Korea Route, then choose Find a route, Explore nearby or My Trip from the home screen.'));
    open.appendChild(actions);
    const sources = element('details', 'hw-sources');
    sources.appendChild(element('summary', '', 'Visitor information & review notes'));
    sources.appendChild(link('Suwon Cultural Foundation · fortress information', 'https://www.swcf.or.kr/english/?p=31'));
    sources.appendChild(link('Official visitor information · admission', 'https://www.swcf.or.kr/english/?p=38'));
    sources.appendChild(element('p', '', 'Water-gate context and fortress admission checked against the official guide on 15 Sep 2026. Lighting, visit duration, accessibility and the photo viewpoint need review.'));
    open.appendChild(sources);
  }

  // HAENGGUNG V2 ONLY: isolated renderer; original 001 and collection code stay intact.
  function renderHaenggungV2(main, result) {
    const status = main.querySelector('.kr-card-status');
    const actions = main.querySelector('.kr-card-actions');
    const fallbackArt = main.querySelector('.kr-card-art');
    main.replaceChildren();
    // Reuse the existing V2 style class without changing any 001 CSS.
    main.classList.add('kr-hwahongmun-v2', 'kr-haenggung-v2');
    const shell = document.getElementById('kr-card-landing');
    // Announce collection/mission changes, not the entire long travel guide.
    shell.removeAttribute('aria-live');

    function section(id, title) {
      const node = element('section', 'hw-section');
      node.id = id;
      node.setAttribute('aria-labelledby', id + '-title');
      const heading = element('h2', '', title);
      heading.id = id + '-title';
      node.appendChild(heading);
      main.appendChild(node);
      return node;
    }
    function link(text, href, className = 'hw-link') {
      const node = element('a', className, text);
      node.href = href;
      return node;
    }
    function mapLink(text, query) {
      const node = link(text, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query + ', Suwon, South Korea'));
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
      node.setAttribute('aria-label', translate(text) + (language==='ko'?' (새 탭에서 Google Maps 열기)':language==='ja'?'（新しいタブでGoogle Mapsを開く）':' (opens Google Maps in a new tab)'));
      return node;
    }

    const hero = element('section', 'hw-hero');
    hero.setAttribute('aria-labelledby', 'hg-title');
    hero.appendChild(element('p', 'hw-eyebrow', 'SUWON CARD 002'));
    const title = element('h1', '', 'HWASEONG HAENGGUNG');
    title.id = 'hg-title';
    title.appendChild(element('span', 'hw-korean', '화성행궁'));
    hero.appendChild(title);
    hero.appendChild(element('p', 'hw-intro', 'Step through the gate and into King Jeongjo’s Suwon.'));
    const art = element('figure', 'hg-card-visual');
    art.appendChild(fallbackArt);
    hero.appendChild(art);
    // Keep the current art visible until the real image successfully decodes.
    // Failed/missing images are never attached, so no broken-image UI appears.
    const artImage = element('img', 'hg-card-image-art');
    artImage.alt = translate('Card 002')+' · '+translate('Hwaseong Haenggung');
    artImage.decoding = 'async';
    artImage.addEventListener('load', () => {
      if (!artImage.naturalWidth) return;
      art.classList.add('hg-has-image');
      art.replaceChildren(artImage, element('figcaption', '', 'SUWON 002 · HWASEONG HAENGGUNG'));
    }, { once: true });
    artImage.addEventListener('error', () => { /* Existing card art remains visible. */ }, { once: true });
    artImage.src = '/nfc-suwon-002-hwaseong-haenggung.webp';
    hero.appendChild(link('Start with LOOK', '#hg-missions', 'hw-primary'));
    main.appendChild(hero);

    const why = section('hg-why', 'Why visit');
    const reasons = element('ul', 'hw-reasons');
    ['A temporary palace used by King Jeongjo', 'A place he stayed when visiting his father’s tomb', 'Shinpungnu, the main gate', 'Royal residence and historical administrative functions'].forEach(text => reasons.appendChild(element('li', '', text)));
    why.appendChild(reasons);

    const quick = section('hg-quick', 'Quick visit info');
    const facts = element('dl', 'hw-facts');
    [
      ['Regular hours', '09:00–18:00', 'Daytime visits'],
      ['Last admission', '17:00', 'Regular daytime admission'],
      ['Adult admission', 'KRW 2,000', 'Check current visitor information']
    ].forEach(([label, value, note]) => {
      const item = element('div');
      item.appendChild(element('dt', '', label));
      item.appendChild(element('dd', '', value));
      item.appendChild(element('dd', 'hw-fact-note', note));
      facts.appendChild(item);
    });
    quick.appendChild(facts);
    const seasonal = element('div', 'hg-seasonal');
    seasonal.appendChild(element('h3', '', '2026 night opening · seasonal'));
    seasonal.appendChild(element('p', '', 'May 1 – Nov 1, 2026 · Friday–Sunday and public holidays'));
    seasonal.appendChild(element('p', '', '18:00–21:30 · Last admission 21:00'));
    quick.appendChild(seasonal);
    quick.appendChild(element('p', 'hw-note', 'Check current visitor information before your visit. Seasonal dates may change.'));
    quick.appendChild(link('Official visitor information', 'https://www.swcf.or.kr/?p=65'));

    const miss = section('hg-dont-miss', 'Don’t miss');
    const sights = element('ol', 'hw-sights');
    [
      ['Shinpungnu', 'Pause at the main gate before you enter.'],
      ['Palace courtyards', 'Follow the open visitor route through the complex.'],
      ['Bongsudang', 'Look for one of the key buildings inside the palace.']
    ].forEach(([name, copy]) => {
      const item = element('li');
      item.append(element('h3', '', name), element('p', '', copy));
      sights.appendChild(item);
    });
    miss.appendChild(sights);

    const missions = section('hg-missions', 'Three small missions');
    missions.appendChild(element('p', 'hw-lead', 'Look. Walk. Make a memory. Check each one when you’re done.'));
    const missionKey = 'koreaRouteHaenggungMissionsV2';
    const missionIds = ['look', 'walk', 'photo'];
    let checked = { look: false, walk: false, photo: false };
    let canSave = true;
    try {
      const raw = localStorage.getItem(missionKey);
      if (raw !== null) {
        const saved = JSON.parse(raw);
        if (!saved || Array.isArray(saved) || Object.keys(saved).length !== 3 || !missionIds.every(id => typeof saved[id] === 'boolean')) throw new Error('Invalid mission record');
        checked = saved;
      }
    } catch (_) { canSave = false; }
    const progress = element('p', 'hw-mission-progress');
    progress.setAttribute('role', 'status');
    const saveNote = element('p', 'hw-note');
    function updateMissionStatus() {
      const count = missionIds.filter(id => checked[id]).length;
      progress.textContent = translate(count === 3 ? '3/3 missions complete. A little Suwon memory, made by you.' : `${count}/3 missions complete`);
      saveNote.textContent = canSave
        ? 'Self-checked, saved in this browser. No GPS check or photo upload.'
        : 'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.';
      saveNote.textContent = translate(saveNote.textContent);
    }
    [
      ['look', 'LOOK', 'Pause at Shinpungnu and notice the two-story gate before entering.'],
      ['walk', 'WALK', 'Follow the open visitor route through the palace courtyards.'],
      ['photo', 'PHOTO', 'Photograph a palace detail or courtyard view and keep it on your phone.']
    ].forEach(([id, title, text]) => {
      const label = element('label', 'hw-mission');
      const input = element('input');
      input.type = 'checkbox';
      input.id = 'hg-mission-' + id;
      input.checked = checked[id];
      input.setAttribute('aria-labelledby', input.id + '-title');
      input.setAttribute('aria-describedby', input.id + '-text');
      const copy = element('span');
      const name = element('strong', '', title); name.id = input.id + '-title';
      const detail = element('span', '', text); detail.id = input.id + '-text';
      copy.append(name, detail);
      input.addEventListener('change', () => {
        checked[id] = input.checked;
        if (canSave) {
          try { localStorage.setItem(missionKey, JSON.stringify(checked)); }
          catch (_) { canSave = false; }
        }
        updateMissionStatus();
      });
      label.append(input, copy);
      missions.appendChild(label);
    });
    updateMissionStatus();
    missions.append(progress, saveNote);

    const next = section('hg-next', 'Explore next');
    next.appendChild(element('p', 'hw-lead', 'Choose your next Suwon stop.'));
    [
      ['Haenggung-dong', 'Explore the neighbourhood', 'Continue into the surrounding streets and choose a stop on site.', 'Find Haenggung-dong'],
      ['Hwahongmun', 'Card 001', 'Change the palace view for stone arches and the stream.', 'Find Hwahongmun'],
      ['Banghwasuryujeong', 'Card 003', 'Make the pavilion your next place to pause and look around.', 'Find Banghwasuryujeong']
    ].forEach(([name, tag, copy, action]) => {
      const item = element('article', 'hw-next-card');
      item.append(element('p', 'hw-next-tag', tag), element('h3', '', name), element('p', '', copy), mapLink(action, name));
      next.appendChild(item);
    });
    next.appendChild(element('p', 'hw-note', 'These map links search for places. Walking times and exact routes are not verified; opening a map does not collect a card.'));

    const collection = section('hg-collection', 'Your Suwon collection');
    collection.appendChild(element('p', 'hw-collection-count', result ? `SUWON COLLECTION ${suwonProgress(result.collection)}/3` : 'SUWON COLLECTION · unavailable'));
    collection.appendChild(status);
    const list = element('ul', 'hw-collection-list');
    cards.forEach(item => {
      const owned = result && result.collection.some(entry => entry.id === item.id);
      const row = element('li');
      row.appendChild(element('b', '', `${item.number} ${item.title}`));
      row.appendChild(element('span', '', result ? (owned ? 'Collected' : 'Still to discover') : 'Status unavailable'));
      list.appendChild(row);
    });
    collection.appendChild(list);
    collection.appendChild(element('p', 'hw-note', 'One place, one card, one more memory. Mission checks are separate from card collecting.'));

    const open = section('hg-open', 'Keep travelling with Korea Route');
    open.appendChild(element('p', '', 'Open Korea Route, then choose Find a route, Explore nearby or My Trip from the home screen.'));
    open.appendChild(actions);
    const sources = element('details', 'hw-sources');
    sources.appendChild(element('summary', '', 'Visitor information & review notes'));
    sources.appendChild(link('Suwon Cultural Foundation · palace history', 'https://www.swcf.or.kr/english/?p=35'));
    sources.appendChild(link('Official visitor information · hours and admission', 'https://www.swcf.or.kr/?p=65'));
    sources.appendChild(link('2026 seasonal night opening', 'https://www.swcf.or.kr/?p=260'));
    sources.appendChild(element('p', '', 'Checked 15 Sep 2026. Regular and seasonal admission times are shown separately. Confirm the latest notice before visiting.'));
    open.appendChild(sources);
  }

  // BANGHWASURYUJEONG V2 ONLY: preserve the original renderers and collection code.
  function renderBanghwasuryujeongV2(main, result) {
    const status = main.querySelector('.kr-card-status');
    const actions = main.querySelector('.kr-card-actions');
    const fallbackArt = main.querySelector('.kr-card-art');
    main.replaceChildren();
    // Reuse the existing V2 style class without changing any 001/002 CSS.
    main.classList.add('kr-hwahongmun-v2', 'kr-banghwasuryujeong-v2');
    const shell = document.getElementById('kr-card-landing');
    // Announce collection/mission changes, not the entire long travel guide.
    shell.removeAttribute('aria-live');

    function section(id, title) {
      const node = element('section', 'hw-section');
      node.id = id;
      node.setAttribute('aria-labelledby', id + '-title');
      const heading = element('h2', '', title);
      heading.id = id + '-title';
      node.appendChild(heading);
      main.appendChild(node);
      return node;
    }
    function link(text, href, className = 'hw-link') {
      const node = element('a', className, text);
      node.href = href;
      return node;
    }
    function mapLink(text, query) {
      const node = link(text, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query + ', Suwon, South Korea'));
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
      node.setAttribute('aria-label', translate(text) + (language==='ko'?' (새 탭에서 Google Maps 열기)':language==='ja'?'（新しいタブでGoogle Mapsを開く）':' (opens Google Maps in a new tab)'));
      return node;
    }

    const hero = element('section', 'hw-hero');
    hero.setAttribute('aria-labelledby', 'bg-title');
    hero.appendChild(element('p', 'hw-eyebrow', 'SUWON CARD 003'));
    const title = element('h1', '', 'BANGHWASURYUJEONG');
    title.id = 'bg-title';
    title.appendChild(element('span', 'hw-korean', '방화수류정'));
    hero.appendChild(title);
    hero.appendChild(element('p', 'hw-intro', 'The last place on this suggested route: Banghwasuryujeong and Yongyeon.'));
    const art = element('figure', 'bg-card-visual');
    art.appendChild(fallbackArt);
    hero.appendChild(art);
    // Keep the current art visible until the real image successfully loads.
    // Failed/missing images are never attached, so no broken-image UI appears.
    const artImage = element('img', 'bg-card-image-art');
    artImage.alt = translate('Card 003')+' · '+translate('Banghwasuryujeong');
    artImage.width = 468;
    artImage.height = 742;
    artImage.loading = 'eager';
    artImage.decoding = 'async';
    artImage.addEventListener('load', () => {
      if (!artImage.naturalWidth) return;
      art.classList.add('bg-has-image');
      art.replaceChildren(artImage, element('figcaption', '', 'SUWON 003 · BANGHWASURYUJEONG'));
    }, { once: true });
    artImage.addEventListener('error', () => { /* Existing card art remains visible. */ }, { once: true });
    artImage.src = '/nfc-suwon-003-banghwasuryujeong.webp';
    hero.appendChild(link('Start with LOOK', '#bg-missions', 'hw-primary'));
    main.appendChild(hero);

    const why = section('bg-why', 'Why visit');
    const reasons = element('ul', 'hw-reasons');
    ['Built in 1794 within Suwon Hwaseong Fortress', 'A lookout, command post and pavilion in one', 'Architecture shaped to fit the surrounding landscape', 'Yongyeon pond is part of the scene around the pavilion'].forEach(text => reasons.appendChild(element('li', '', text)));
    why.appendChild(reasons);

    const quick = section('bg-quick', 'Quick visit info');
    const facts = element('dl', 'hw-facts');
    [
      ['Hwaseong Fortress admission', 'Free', 'Current official visitor information'],
      ['Fortress viewing', 'Open access', 'Official guide: night viewing is possible']
    ].forEach(([label, value, note]) => {
      const item = element('div');
      item.appendChild(element('dt', '', label));
      item.appendChild(element('dd', '', value));
      item.appendChild(element('dd', 'hw-fact-note', note));
      facts.appendChild(item);
    });
    quick.appendChild(facts);
    quick.appendChild(element('p', 'hw-note', 'Check current visitor information before your visit.'));
    quick.appendChild(link('Official visitor information', 'https://www.visitsuwon.or.kr/base/contents/view?contentsNo=11&menuLevel=3&menuNo=19'));

    const miss = section('bg-dont-miss', 'Don’t miss');
    const sights = element('ol', 'hw-sights');
    [
      ['The pavilion itself', 'Notice how the structure combines a fortress function with a place to pause and look out.'],
      ['Yongyeon', 'Spend a moment around the pond-side area.'],
      ['The fortress surroundings', 'Look at how the pavilion, wall and landscape connect.']
    ].forEach(([name, copy]) => {
      const item = element('li');
      item.append(element('h3', '', name), element('p', '', copy));
      sights.appendChild(item);
    });
    miss.appendChild(sights);

    const photo = section('bg-photo-zone', 'PHOTO ZONE');
    photo.appendChild(element('p', 'hw-lead', 'Leave a photo memory around Yongyeon or the pavilion area.'));
    const zones = element('ul', 'hw-reasons');
    ['Yongyeon pond-side area', 'Around Banghwasuryujeong pavilion'].forEach(text => zones.appendChild(element('li', '', text)));
    photo.appendChild(zones);

    const missions = section('bg-missions', 'Three small missions');
    missions.appendChild(element('p', 'hw-lead', 'Look. Walk. Make a memory. Check each one when you’re done.'));
    const missionKey = 'koreaRouteBanghwasuryujeongMissionsV2';
    const missionIds = ['look', 'walk', 'photo'];
    let checked = { look: false, walk: false, photo: false };
    let canSave = true;
    try {
      const raw = localStorage.getItem(missionKey);
      if (raw !== null) {
        const saved = JSON.parse(raw);
        if (!saved || Array.isArray(saved) || Object.keys(saved).length !== 3 || !missionIds.every(id => typeof saved[id] === 'boolean')) throw new Error('Invalid mission record');
        checked = saved;
      }
    } catch (_) { canSave = false; }
    const progress = element('p', 'hw-mission-progress');
    progress.setAttribute('role', 'status');
    const saveNote = element('p', 'hw-note');
    function updateMissionStatus() {
      const count = missionIds.filter(id => checked[id]).length;
      progress.textContent = translate(count === 3 ? '3/3 missions complete. A little Suwon memory, made by you.' : `${count}/3 missions complete`);
      saveNote.textContent = canSave
        ? 'Self-checked, saved in this browser. No GPS check or photo upload.'
        : 'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.';
      saveNote.textContent = translate(saveNote.textContent);
    }
    [
      ['look', 'LOOK', 'Pause and notice how the pavilion, fortress wall and landscape meet.'],
      ['walk', 'WALK', 'Take a short walk around the open public area near Yongyeon and Banghwasuryujeong.'],
      ['photo', 'PHOTO', 'Take a photo around Yongyeon or the pavilion and keep it on your phone.']
    ].forEach(([id, title, text]) => {
      const label = element('label', 'hw-mission');
      const input = element('input');
      input.type = 'checkbox';
      input.id = 'bg-mission-' + id;
      input.checked = checked[id];
      input.setAttribute('aria-labelledby', input.id + '-title');
      input.setAttribute('aria-describedby', input.id + '-text');
      const copy = element('span');
      const name = element('strong', '', title); name.id = input.id + '-title';
      const detail = element('span', '', text); detail.id = input.id + '-text';
      copy.append(name, detail);
      input.addEventListener('change', () => {
        checked[id] = input.checked;
        if (canSave) {
          try { localStorage.setItem(missionKey, JSON.stringify(checked)); }
          catch (_) { canSave = false; }
        }
        updateMissionStatus();
      });
      label.append(input, copy);
      missions.appendChild(label);
    });
    updateMissionStatus();
    missions.append(progress, saveNote);

    const next = section('bg-next', 'Explore next');
    next.appendChild(element('p', 'hw-lead', 'Choose your next Suwon stop.'));
    [
      ['Hwahongmun', 'Card 001', 'Continue the fortress story with the water gate and stream.', 'Find Hwahongmun'],
      ['Yongyeon', 'Pond surroundings', 'Stay with the landscape and explore the public area around the pond.', 'Find Yongyeon'],
      ['Haenggung-dong', 'Explore the neighbourhood', 'Continue into the surrounding streets and choose a stop on site.', 'Find Haenggung-dong'],
      ['Hwaseong Haenggung', 'Card 002', 'Add a palace visit to your Suwon journey. Check visitor information before entering.', 'Find Hwaseong Haenggung']
    ].forEach(([name, tag, copy, action]) => {
      const item = element('article', 'hw-next-card');
      item.append(element('p', 'hw-next-tag', tag), element('h3', '', name), element('p', '', copy), mapLink(action, name));
      next.appendChild(item);
    });
    next.appendChild(element('p', 'hw-note', 'These map links search for places. Walking times and exact routes are not verified; opening a map does not collect a card.'));

    const collection = section('bg-collection', 'Your Suwon collection');
    collection.appendChild(element('p', 'hw-collection-count', result ? `SUWON COLLECTION ${suwonProgress(result.collection)}/3` : 'SUWON COLLECTION · unavailable'));
    collection.appendChild(status);
    const list = element('ul', 'hw-collection-list');
    cards.forEach(item => {
      const owned = result && result.collection.some(entry => entry.id === item.id);
      const row = element('li');
      row.appendChild(element('b', '', `${item.number} ${item.title}`));
      row.appendChild(element('span', '', result ? (owned ? 'Collected' : 'Still to discover') : 'Status unavailable'));
      list.appendChild(row);
    });
    collection.appendChild(list);
    collection.appendChild(element('p', 'hw-note', 'One place, one card, one more memory. Mission checks are separate from card collecting.'));

    const open = section('bg-open', 'Keep travelling with Korea Route');
    open.appendChild(element('p', '', 'Open Korea Route, then choose Find a route, Explore nearby or My Trip from the home screen.'));
    open.appendChild(actions);
    const sources = element('details', 'hw-sources');
    sources.appendChild(element('summary', '', 'Visitor information & review notes'));
    sources.appendChild(link('Suwon Cultural Foundation · pavilion history', 'https://www.swcf.or.kr/english/?idx=681&mode=view&p=34&rIdx=99998857'));
    sources.appendChild(link('Official fortress visitor information', 'https://www.visitsuwon.or.kr/base/contents/view?contentsNo=11&menuLevel=3&menuNo=19'));
    sources.appendChild(element('p', '', 'History and current fortress visitor information checked 16 Sep 2026. Check the latest visitor notices before your visit.'));
    open.appendChild(sources);
  }

  let renderedState = null;
  function addSuwonFlow(main, collection, storageOk) {
    const route = element('a','kr-card-home',text('Back to Suwon route','수원 코스로 돌아가기','水原ルートに戻る'));
    route.href = '/?suwon=route';
    const nav = element('nav','suwon-card-flow');
    nav.setAttribute('aria-label',text('Suwon route','수원 코스','水原ルート'));
    nav.appendChild(route);
    const order = ['suwon-002','suwon-001','suwon-003'];
    const position = order.indexOf(cardId);
    const placeLink = (id, label) => {
      const item = cards.find(c=>c.id===id);
      const a = element('a','kr-card-secondary',label+' · '+translate(item.title)); a.href='/t/'+id; return a;
    };
    if(position>0) nav.appendChild(placeLink(order[position-1],text('Previous place','이전 장소','前の場所')));
    if(position>=0 && position<2) nav.appendChild(placeLink(order[position+1],text('Next place','다음 장소','次の場所')));
    if(card){const a=element('a','kr-card-secondary',text('View collection','컬렉션 보기','コレクションを見る'));a.href='/t';nav.appendChild(a);}
    main.prepend(nav);
    const note = element('p','hw-note',text('Card collection is stored in this browser. This is not visit verification. Mission checks are separate; collecting a card does not confirm a purchase.','카드 수집은 이 브라우저에 저장됩니다. 방문 인증이 아닙니다. 미션 체크는 별개이며 카드 수집은 구매를 증명하지 않습니다.','カード収集はこのブラウザに保存されます。訪問認証ではありません。ミッションのチェックは別で、カード収集は購入を証明しません。'));
    main.appendChild(note);
    if(!card && storageOk && isSuwonComplete(collection))main.querySelector('.kr-card-status').appendChild(element('h2','kr-card-complete',"🏆 Suwon Complete! You've collected all 3 cards."));
    if(!card)main.querySelectorAll('.kr-card-choice').forEach((link,i)=>{
      const item=cards[i]; const owned=collection.some(c=>c.id===item.id);
      link.classList.toggle('is-collected',storageOk&&owned);
      const image=element('img','suwon-collection-art');
      image.src={'suwon-001':'/nfc-suwon-001-hwahongmun.webp','suwon-002':'/nfc-suwon-002-hwaseong-haenggung.webp','suwon-003':'/nfc-suwon-003-banghwasuryujeong.webp'}[item.id];
      image.alt=''; image.loading='lazy';link.prepend(image);
      link.appendChild(element('span','suwon-owned',storageOk?(owned?'Collected':'Still to discover'):'Status unavailable'));
    });
  }
  function render() {
    const main = document.getElementById('kr-card-main');
    if (!main) return;
    main.replaceChildren();

    let result = null;
    let collection = [];
    let storageOk = true;
    if (renderedState) {
      ({result,collection,storageOk}=renderedState);
    } else try {
      if (card) {
        result = recordTap();
        collection = result.collection;
      } else {
        collection = readCollection();
      }
    } catch (_) {
      storageOk = false;
    }
    renderedState={result,collection,storageOk};

    if (card) {
      renderCard(main, result);
      if (card.id === 'suwon-001') renderHwahongmunV2(main, result);
      if (card.id === 'suwon-002') renderHaenggungV2(main, result);
      if (card.id === 'suwon-003') renderBanghwasuryujeongV2(main, result);
      document.title = translate('Card '+card.number)+' · '+translate(card.title)+' | Korea Route';
    } else {
      renderSelector(main, collection, storageOk);
      document.title = (isSelector ? text('Suwon NFC Cards','수원 NFC 카드','水原NFCカード') : translate('Card not found')) + ' | Korea Route';
    }
    addSuwonFlow(main,collection,storageOk);
    document.documentElement.lang = language;
    document.querySelector('.kr-card-brand small').textContent=text('NFC Travel Card','NFC 여행 카드','NFC旅行カード');
    document.querySelector('.kr-card-brand').setAttribute('aria-label',text('Open Korea Route home','코리아 루트 홈 열기','Korea Routeのホームを開く'));
  }

  const languages=element('select','suwon-card-language');
  languages.setAttribute('aria-label','Language / 언어 / 言語');
  [['en','English'],['ko','한국어'],['ja','日本語']].forEach(([value,label])=>{const option=element('option','',label);option.value=value;languages.appendChild(option);});
  languages.value=language;
  languages.addEventListener('change',()=>{
    language=languages.value;
    try{localStorage.setItem('koreaRouteLang',language);}catch(_){}
    render();
  });
  document.querySelector('.kr-card-header').appendChild(languages);
  render();
})();
