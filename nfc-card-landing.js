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
      node.setAttribute('aria-label', text + ' (opens Google Maps in a new tab)');
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
    artImage.alt = 'Korea Route Suwon 002 Hwaseong Haenggung card artwork';
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
      progress.textContent = count === 3 ? '3/3 missions complete. A little Suwon memory, made by you.' : `${count}/3 missions complete`;
      saveNote.textContent = canSave
        ? 'Self-checked, saved in this browser. No GPS check or photo upload.'
        : 'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.';
    }
    [
      ['look', 'LOOK', 'Pause at Shinpungnu and notice the two-story gate before entering.'],
      ['walk', 'WALK', 'Follow the open visitor route through the palace courtyards.'],
      ['photo', 'PHOTO', 'Choose one palace detail or courtyard view and make your own Suwon memory.']
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
      node.setAttribute('aria-label', text + ' (opens Google Maps in a new tab)');
      return node;
    }

    const hero = element('section', 'hw-hero');
    hero.setAttribute('aria-labelledby', 'bg-title');
    hero.appendChild(element('p', 'hw-eyebrow', 'SUWON CARD 003'));
    const title = element('h1', '', 'BANGHWASURYUJEONG');
    title.id = 'bg-title';
    title.appendChild(element('span', 'hw-korean', '방화수류정'));
    hero.appendChild(title);
    hero.appendChild(element('p', 'hw-intro', 'Pause by Yongyeon and see another side of Suwon Hwaseong.'));
    const art = element('figure', 'bg-card-visual');
    art.appendChild(fallbackArt);
    hero.appendChild(art);
    // Keep the current art visible until the real image successfully loads.
    // Failed/missing images are never attached, so no broken-image UI appears.
    const artImage = element('img', 'bg-card-image-art');
    artImage.alt = 'Korea Route Suwon 003 Banghwasuryujeong card artwork';
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
      progress.textContent = count === 3 ? '3/3 missions complete. A little Suwon memory, made by you.' : `${count}/3 missions complete`;
      saveNote.textContent = canSave
        ? 'Self-checked, saved in this browser. No GPS check or photo upload.'
        : 'Checks work for this visit only. Mission progress could not be saved; existing records were left unchanged.';
    }
    [
      ['look', 'LOOK', 'Pause and notice how the pavilion, fortress wall and landscape meet.'],
      ['walk', 'WALK', 'Take a short walk around the open public area near Yongyeon and Banghwasuryujeong.'],
      ['photo', 'PHOTO', 'Leave one photo memory around Yongyeon or the pavilion area.']
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

  // SUWON TRAVEL PACK V1: presentation only; V2 handlers and storage stay intact.
  function enhanceSuwonTravelPack(main, result) {
    const places = {
      gate: ['Hwahongmun', 'Hwahongmun'],
      pond: ['Yongyeon', 'Yongyeon Pond Banghwasuryujeong'],
      pavilion: ['Banghwasuryujeong', 'Banghwasuryujeong'],
      palace: ['Hwaseong Haenggung', 'Hwaseong Haenggung'],
      entrance: ['Shinpungnu', 'Shinpungnu Hwaseong Haenggung'],
      courts: ['Palace courtyards', 'Hwaseong Haenggung'],
      hall: ['Bongsudang', 'Bongsudang Hwaseong Haenggung'],
      neighbourhood: ['Haenggung-dong', 'Haenggung-dong'],
      culture: ['Suwon Traditional Culture Center', '수원전통문화관 정조로 893'],
      coffeeGate: ['Jung Jiyoung · Hwahongmun', '정지영커피로스터즈 화홍문점 수원천로 375'],
      coffeePalace: ['Jung Jiyoung · Haenggung', '정지영커피로스터즈 행궁본점 신풍로 42']
    };
    const picks = {
      dumplings: ['EAT', 'Boyoung Mandu', 'North Gate main branch', 'Dumplings and jjolmyeon noodles to make a meal of your northern fortress walk.', '271 Paldal-ro', '보영만두 북문본점 팔달로 271', 'https://www.diningcode.com/profile.php?rid=qiiPwhoYeuEZ'],
      chicken: ['EAT', 'Jinmi Tongdak', 'Suwon chicken street', 'Continue from the palace to Suwon’s chicken street for a fried-chicken meal.', '21 Jeongjo-ro 800beon-gil', '진미통닭 정조로800번길 21', 'https://www.diningcode.com/profile.php?rid=ZmukzrEgQ4Er'],
      coffeeGate: ['CAFE', 'Jung Jiyoung Coffee Roasters', 'Hwahongmun branch', 'A Suwoncheon-ro coffee stop that keeps your break close to the water-gate walk.', '375 Suwoncheon-ro', places.coffeeGate[1], 'https://jungjiyoungcoffee.com/shopinfo/store.html'],
      coffeePalace: ['CAFE', 'Jung Jiyoung Coffee Roasters', 'Haenggung main branch', 'A coffee stop on Sinpung-ro, keeping your palace visit and neighbourhood walk together.', '42 Sinpung-ro', places.coffeePalace[1], 'https://jungjiyoungcoffee.com/shopinfo/store.html'],
      culture: ['LOCAL', 'Suwon Traditional Culture Center', 'Traditional culture & exhibitions', 'Connect the fortress walk with Suwon’s traditional culture. Check the programme; activities may need booking.', '893 Jeongjo-ro', places.culture[1], 'https://www.swcf.or.kr/?p=155']
    };
    const plans = {
      'suwon-001': {
        theme: 'FOLLOW THE WATER', intro: 'A water gate, a stream, a place to begin.',
        start: 'Pause near the water gate and notice how Suwoncheon passes through the fortress.',
        context: 'Hwahongmun connects the fortress landscape with the stream below.',
        see: [['The arches', 'Notice the repeating stone openings.'], ['The water', 'Watch Suwoncheon pass through the gate.'], ['The fortress view', 'Look at the gate as part of the surrounding wall.']],
        photo: ['Hwahongmun area', 'Suwoncheon public paths'],
        routes: [
          ['Water & pavilion', ['gate','pond','pavilion'], 'Keep this a short look at the gate, pond and pavilion.'],
          ['A pause for coffee', ['gate','pavilion','pond','coffeeGate'], 'Add a coffee stop if there is space and time.'],
          ['From water to palace', ['gate','pavilion','culture','neighbourhood','palace'], 'Choose a brief culture stop, then continue toward the palace. A full palace visit needs extra time.']
        ], local: ['dumplings','coffeeGate','culture'],
        next: [['pavilion','CARD 003','Continue from the water gate to the pavilion and pond.'], ['neighbourhood','NEIGHBOURHOOD','Make room for a street walk and a break.']]
      },
      'suwon-002': {
        theme: 'STEP INTO JEONGJO’S SUWON', intro: 'A palace visit, then a neighbourhood to explore.',
        start: 'Start at the main entrance and look over the palace layout before going inside.',
        context: 'This temporary palace was used by King Jeongjo during visits to Suwon.',
        see: [['Shinpungnu', 'Begin with the palace’s main gate.'], ['The courtyards', 'Follow the open visitor route through the complex.'], ['Bongsudang', 'Look for the palace’s royal audience chamber.']],
        photo: ['Palace courtyards', 'Shinpungnu area'],
        routes: [
          ['A palace sampler', ['entrance','courts','hall'], 'A short visit after admission. Allow extra time for tickets and follow the open visitor route.'],
          ['Palace & coffee', ['palace','neighbourhood','coffeePalace'], 'Keep the palace visit focused, then choose a coffee break.'],
          ['Palace to pond', ['palace','neighbourhood','gate','pond','pavilion'], 'Continue toward the water gate and pond. Extend your visit if you want to explore the whole palace.']
        ], local: ['chicken','coffeePalace','culture'],
        next: [['neighbourhood','NEIGHBOURHOOD','Leave time for the streets around the palace.'], ['gate','CARD 001','Pick up the fortress story at the water gate.']]
      },
      'suwon-003': {
        theme: 'PAUSE BY YONGYEON', intro: 'A pavilion, a pond, a moment to slow down.',
        start: 'Begin around Yongyeon and notice how the pavilion, wall and pond form one scene.',
        context: 'Built in 1794, the pavilion combined lookout and command functions with a place to pause.',
        see: [['The pavilion', 'Notice the structure within its natural setting.'], ['Yongyeon', 'Spend a moment around the pond-side area.'], ['The fortress landscape', 'Look at how the pavilion, wall and landscape connect.']],
        photo: ['Yongyeon pond-side area', 'Around Banghwasuryujeong pavilion'],
        routes: [
          ['Pavilion, pond & gate', ['pavilion','pond','gate'], 'Stay with the northern fortress sights for a short visit.'],
          ['Water & a coffee break', ['pavilion','pond','gate','coffeeGate'], 'Continue to the gate, then decide whether to stop for coffee.'],
          ['Continue into Suwon', ['pavilion','gate','culture','neighbourhood','palace'], 'Add a brief culture stop and the palace neighbourhood. Allow extra time for a full palace visit.']
        ], local: ['dumplings','coffeeGate','culture'],
        next: [['gate','CARD 001','See how the water passes through the fortress.'], ['palace','CARD 002','Make the palace the next chapter. Check admission before setting off.']]
      }
    };
    const plan = plans[card.id];
    const shell = document.getElementById('kr-card-landing');
    shell.classList.add('kr-travel-pack-shell');
    main.classList.add('kr-travel-pack');
    const brandLine = shell.querySelector('.kr-card-brand small');
    if (brandLine) brandLine.textContent = 'SUWON TRAVEL PACK';

    function link(text, href, className = 'tp-link') {
      const node = element('a', className, text); node.href = href; return node;
    }
    function external(text, href) {
      const node = link(text, href); node.target = '_blank'; node.rel = 'noopener noreferrer';
      node.setAttribute('aria-label', text + ' (opens in a new tab)'); return node;
    }
    function mapLink(query, label = 'Open map') {
      return external(label, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query + ', Suwon, South Korea'));
    }
    function section(id, title) {
      const node = element('section', 'hw-section tp-section'); node.id = 'tp-' + id;
      const heading = element('h2', '', title); heading.id = node.id + '-title';
      node.setAttribute('aria-labelledby', heading.id); node.appendChild(heading); return node;
    }
    function stopList(ids) {
      const list = element('ol', 'tp-stops');
      ids.forEach(id => {
        const row = element('li'); row.appendChild(mapLink(places[id][1], places[id][0])); list.appendChild(row);
      }); return list;
    }

    // Move existing nodes: checkbox handlers, state and collection announcements survive.
    const hero = main.querySelector('.hw-hero');
    const missions = main.querySelector('[id$="-missions"]');
    const collection = main.querySelector('[id$="-collection"]');
    const actions = main.querySelector('.kr-card-actions');
    hero.querySelector('.hw-intro').textContent = plan.intro;
    hero.querySelector('.hw-eyebrow').after(element('p', 'tp-theme', plan.theme));
    const heroAction = hero.querySelector('.hw-primary');
    heroAction.textContent = 'Your first move'; heroAction.href = '#tp-start';
    const art = hero.querySelector('figure'); art.classList.add('tp-card-image');
    // V2 002/003 retain their original detached-image fallback. Add one for 001.
    if (card.id === 'suwon-001') {
      const img = art.querySelector('img');
      const fallback = () => {
        const label = element('div', 'tp-image-fallback');
        label.append(element('span', '', 'SUWON CARD 001'), element('strong', '', 'HWAHONGMUN'), element('span', '', '화홍문'));
        art.replaceChildren(label);
      };
      img.addEventListener('error', fallback, {once:true});
      if (img.complete && !img.naturalWidth) fallback();
    }
    const nav = element('nav', 'tp-nav'); nav.setAttribute('aria-label', 'Travel Pack sections');
    [['START','start'],['ROUTE','routes'],['LOCAL','local'],['COLLECTION','collection']].forEach(([label,id]) => nav.appendChild(link(label, '#tp-' + id)));

    const start = section('start', 'Your first move');
    start.append(element('p', 'tp-first-action', plan.start), element('p', 'tp-context', plan.context));
    const visit = element('details', 'tp-visit');
    visit.appendChild(element('summary', '', 'Before you go'));
    if (card.id === 'suwon-002') {
      visit.appendChild(element('p', '', 'Adult admission KRW 2,000 · Regular hours 09:00–18:00 · Last admission 17:00.'));
      visit.appendChild(element('p', '', '2026 seasonal night opening: May 1 – Nov 1, Friday–Sunday and public holidays. 18:00–21:30; last admission 21:00.'));
    } else {
      visit.appendChild(element('p', '', 'Free fortress admission. Check current notices for access to the places you plan to visit.'));
    }
    visit.appendChild(external('Current visitor information', 'https://www.swcf.or.kr/?p=65'));
    start.appendChild(visit);

    const see = section('see', 'Worth noticing');
    const sights = element('ol', 'tp-see-list');
    plan.see.forEach(([title, copy]) => { const row = element('li'); row.append(element('h3', '', title), element('p', '', copy)); sights.appendChild(row); });
    see.appendChild(sights);
    missions.id = 'tp-missions'; missions.classList.add('tp-section');
    missions.querySelector('h2').textContent = '3 Suwon moments';
    missions.querySelector('.hw-lead').textContent = 'Notice. Explore. Keep a memory. Check each moment when you’re done.';
    const photo = section('photo', 'Photo zone');
    photo.appendChild(element('p', '', 'Leave a photo memory here, in your own way.'));
    const zones = element('ul', 'tp-photo-areas');
    plan.photo.forEach(text => zones.appendChild(element('li', '', text))); photo.appendChild(zones);

    const routes = section('routes', 'Choose your pace');
    routes.appendChild(element('p', 'tp-context', 'Choose how much to explore, at your own pace. Allow time for stops.'));
    const choices = element('div', 'tp-route-choices'); choices.setAttribute('role','group'); choices.setAttribute('aria-label','Route pace');
    const panel = element('div', 'tp-route-panel'); panel.id = 'tp-route-panel';
    panel.setAttribute('aria-labelledby','tp-route-name');
    const routeButtons = [];
    function chooseRoute(index) {
      routeButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      const [name, stops, note] = plan.routes[index];
      const heading = element('h3', '', name); heading.id = 'tp-route-name';
      panel.replaceChildren(heading, stopList(stops), element('p', 'tp-context', note));
      panel.dataset.route = String(index);
    }
    ['SHORT','STANDARD','EXTENDED'].forEach((label,index) => {
      const button = element('button', '', label); button.type = 'button'; button.setAttribute('aria-controls',panel.id);
      button.addEventListener('click', () => chooseRoute(index)); routeButtons.push(button); choices.appendChild(button);
    });
    chooseRoute(0);
    routes.append(choices, panel, element('p','tp-small','Tap a stop to search it on the map. Follow local signs between stops.'));

    const local = section('local', 'Selected for your visit');
    local.appendChild(element('p', 'tp-context', 'One food stop, one coffee break, one local culture stop. Choose what you need.'));
    plan.local.forEach(id => {
      const [category,name,branch,copy,address,query,url] = picks[id];
      const item = element('details','tp-local-pick');
      const summary = element('summary');
      summary.append(element('span','tp-category',category), element('strong','',name), element('span','tp-branch',branch));
      item.append(summary,element('p','',copy),element('p','tp-address',address + ', Suwon'));
      const links = element('div','tp-local-actions'); links.append(mapLink(query),external('Visitor details',url));
      item.appendChild(links); local.appendChild(item);
    });
    local.appendChild(element('p','tp-small','Checked 16 Sep 2026. Confirm today’s opening before setting off.'));

    const next = section('next', 'Continue your Suwon journey');
    plan.next.forEach(([id,tag,copy]) => {
      const row = element('article','tp-next');
      row.append(element('p','tp-category',tag),element('h3','',places[id][0]),element('p','',copy),mapLink(places[id][1])); next.appendChild(row);
    });
    next.appendChild(element('p','tp-small','At the next place, tap its card to collect it. Opening a map does not collect a card.'));
    collection.id = 'tp-collection'; collection.classList.add('tp-section');
    collection.querySelector('h2').textContent = 'Suwon collection';
    // Presentation only: use the existing tap result; never read or write storage here.
    if (result) {
      collection.querySelector('.hw-collection-count').textContent = `SUWON COLLECTION · ${suwonProgress(result.collection)} OF 3`;
      const messages = collection.querySelectorAll('.kr-card-status p');
      messages[0].textContent = result.isNew ? `CARD ${card.number} ADDED` : `CARD ${card.number} IN YOUR COLLECTION`;
      if (messages[1]) messages[1].textContent = 'SUWON COLLECTION COMPLETE';
    }
    collection.querySelector('.hw-note').textContent = 'Your cards are collected separately from your Suwon moments.';
    const open = section('open', 'Your tools for the rest of the day');
    open.append(element('p','tp-context','Open Korea Route, then choose Find a route, Explore nearby or My Trip.'),actions);

    main.replaceChildren(hero,nav,start,see,missions,photo,routes,local,next,collection);
    if (result && isSuwonComplete(result.collection)) {
      const complete = section('complete', 'Your Suwon collection is complete');
      complete.classList.add('tp-complete');
      complete.appendChild(element('p','tp-collector-label','COLLECTOR ROUTE'));
      complete.appendChild(element('h3','','The Complete Suwon Route'));
      complete.appendChild(element('p','','Three cards. One curated day through Suwon.'));
      complete.appendChild(stopList(['palace','neighbourhood','gate','pond','pavilion']));
      complete.appendChild(element('p','tp-small','Start with palace admission, pause for food or coffee in Haenggung-dong, then continue toward the water. Allow time for queues and stops; check current access.'));
      main.appendChild(complete);
    }
    main.appendChild(open);
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
      if (card.id === 'suwon-002') renderHaenggungV2(main, result);
      if (card.id === 'suwon-003') renderBanghwasuryujeongV2(main, result);
      enhanceSuwonTravelPack(main, result);
      document.title = `Card ${card.number} · ${card.title} | Korea Route`;
    } else {
      renderSelector(main, collection, storageOk);
      document.title = (isSelector ? 'Suwon NFC Cards' : 'Card not found') + ' | Korea Route';
    }
    document.documentElement.lang = 'en';
  }

  render();
})();
