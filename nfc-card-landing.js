/* KR-FEAT-001 SAFE V2. Independent English-only NFC/QR entry. */
(function () {
  'use strict';

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
    if (text !== undefined) node.textContent = text;
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
    links.setAttribute('aria-label', 'Suwon cards');
    cards.forEach(item => links.appendChild(cardLink(item)));
    main.appendChild(links);
  }

  function renderCard(main, result) {
    const art = element('section', 'kr-card-art');
    art.setAttribute('aria-label', `Suwon card ${card.number}: ${card.title}`);
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
      node.setAttribute('aria-label', text + ' (opens Google Maps in a new tab)');
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
    hero.appendChild(element('p', 'hw-intro', 'Start here. Follow the water gate to one of Suwon’s most beautiful walks.'));
    const art = element('figure', 'hw-card-image');
    const artImage = element('img', 'hw-card-image-art');
    artImage.src = '/nfc-suwon-001-hwahongmun.webp';
    artImage.alt = 'Korea Route Suwon 001 Hwahongmun card artwork';
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
      progress.textContent = count === 3 ? '3/3 missions complete. A little Suwon memory, made by you.' : `${count}/3 missions complete`;
      saveNote.textContent = canSave
        ? 'Self-checked, saved in this browser. No GPS check or photo upload.'
        : 'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.';
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

  function render() {
    const main = document.getElementById('kr-card-main');
    if (!main) return;
    main.replaceChildren();

    let result = null;
    let collection = [];
    let storageOk = true;
    try {
      if (card) {
        result = recordTap();
        collection = result.collection;
      } else {
        collection = readCollection();
      }
    } catch (_) {
      storageOk = false;
    }

    if (card) {
      renderCard(main, result);
      if (card.id === 'suwon-001') renderHwahongmunV2(main, result);
      document.title = `Card ${card.number} · ${card.title} | Korea Route`;
    } else {
      renderSelector(main, collection, storageOk);
      document.title = (isSelector ? 'Suwon NFC Cards' : 'Card not found') + ' | Korea Route';
    }
    document.documentElement.lang = 'en';
  }

  render();
})();
