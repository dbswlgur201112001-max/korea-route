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
      document.title = `Card ${card.number} · ${card.title} | Korea Route`;
    } else {
      renderSelector(main, collection, storageOk);
      document.title = (isSelector ? 'Suwon NFC Cards' : 'Card not found') + ' | Korea Route';
    }
    document.documentElement.lang = 'en';
  }

  render();
})();
