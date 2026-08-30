const CITY_STATIONS = {
  Seoul: { en: 'Seoul Station', ko: '서울역' },
  Suwon: { en: 'Suwon Station', ko: '수원역' },
  Chuncheon: { en: 'Chuncheon Station', ko: '춘천역' },
  Gangneung: { en: 'Gangneung Station', ko: '강릉역' },
  Daejeon: { en: 'Daejeon Station', ko: '대전역' },
  Gongju: { en: 'Gongju Station', ko: '공주역' },
  Jeonju: { en: 'Jeonju Station', ko: '전주역' },
  Yeosu: { en: 'Yeosu-Expo Station', ko: '여수엑스포역' },
  Suncheon: { en: 'Suncheon Station', ko: '순천역' },
  Gyeongju: { en: 'Singyeongju Station', ko: '신경주역' },
  Andong: { en: 'Andong Station', ko: '안동역' },
  Daegu: { en: 'Dongdaegu Station', ko: '동대구역' },
  Ulsan: { en: 'Ulsan Station', ko: '울산역' },
  Pohang: { en: 'Pohang Station', ko: '포항역' },
  Busan: { en: 'Busan Station', ko: '부산역' }
};

function korailQueryStationName(name) {
  return String(name || '').trim().replace(/역$/, '');
}

function seoulTodayYmd(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    const map = {};
    for (const part of parts) {
      if (part.type !== 'literal') map[part.type] = part.value;
    }
    if (map.year && map.month && map.day) return `${map.year}-${map.month}-${map.day}`;
  } catch {}
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`;
}

function providerTotalCount(raw) {
  const n =
    raw?.response?.body?.totalCount ??
    raw?.body?.totalCount ??
    raw?.totalCount ??
    null;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : null;
}

function compactStationName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/역$/, '');
}

function compactRunDate(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(0, 8) : '';
}

function trainRunDate(train) {
  return compactRunDate(
    train?.runYmd ||
    train?.departureTime ||
    train?.arrivalTime ||
    ''
  );
}

function filterNormalizedTrains(trains, departureName, arrivalName, runYmd) {
  const from = compactStationName(departureName);
  const to = compactStationName(arrivalName);
  return (Array.isArray(trains) ? trains : []).filter((train) => {
    const dep = compactStationName(train?.departureStation);
    const arr = compactStationName(train?.arrivalStation);
    const day = trainRunDate(train);
    return dep === from && arr === to && day === runYmd;
  });
}

function minutesBetween(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

function normalizeItems(raw) {
  const items =
    raw?.response?.body?.items?.item ??
    raw?.body?.items?.item ??
    raw?.items?.item ??
    raw?.items ??
    raw?.data ??
    [];
  const arr = Array.isArray(items) ? items : (items ? [items] : []);

  return arr.map((item) => {
    const departureTime =
      item.trainPlanDepartureDateTime ??
      item.trainPlanDptreDt ??
      item.trn_plan_dptre_dt ??
      item.train_plan_dptre_dt ??
      item.departureDateTime ??
      item.dptreDt ??
      item.depTime ??
      null;

    const arrivalTime =
      item.trainPlanArrivalDateTime ??
      item.trainPlanArvlDt ??
      item.trn_plan_arvl_dt ??
      item.train_plan_arvl_dt ??
      item.arrivalDateTime ??
      item.arvlDt ??
      item.arrTime ??
      null;

    return {
      trainNo: item.trainNo ?? item.trnNo ?? item.trn_no ?? item.train_no ?? item.trainNumber ?? null,
      service:
        item.trainTypeName ??
        item.trainKindName ??
        item.trainClassName ??
        item.trn_knd_nm ??
        item.trn_clsf_nm ??
        item.train_type_nm ??
        item.train_kind_nm ??
        item.trainType ??
        item.trn_knd_cd ??
        item.trn_clsf_cd ??
        null,
      trainType:
        item.trainTypeName ??
        item.trainKindName ??
        item.trainClassName ??
        item.trn_knd_nm ??
        item.trn_clsf_nm ??
        item.train_type_nm ??
        item.train_kind_nm ??
        item.trainType ??
        item.trn_knd_cd ??
        item.trn_clsf_cd ??
        null,
      departureStation: String(item.departureStationName ?? item.dptreStnNm ?? item.dptre_stn_nm ?? item.depPlaceNm ?? '').trim() || null,
      arrivalStation: String(item.arrivalStationName ?? item.arvlStnNm ?? item.arvl_stn_nm ?? item.arrPlaceNm ?? '').trim() || null,
      departureTime,
      arrivalTime,
      runYmd: compactRunDate(item.run_ymd ?? item.runYmd ?? departureTime ?? arrivalTime),
      durationMinutes: minutesBetween(departureTime, arrivalTime),
      // travelerTrainRunPlan2 is schedule/operation-plan data. Do not invent a fare
      // until a verified fare field/source is connected.
      fare: null,
      seatStatus: null
    };
  }).filter((x) => x.departureTime || x.arrivalTime || x.trainNo);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { from, to, date } = req.query || {};
  if (!from || !to) {
    return res.status(400).json({ error: 'MISSING_ROUTE', message: 'from and to are required' });
  }

  const apiKey = process.env.KORAIL_SERVICE_KEY;
  const apiUrl = process.env.KORAIL_API_URL;

  if (!apiKey || !apiUrl) {
    return res.status(503).json({
      error: 'RAIL_API_NOT_CONFIGURED',
      code: 'RAIL_API_NOT_CONFIGURED',
      configured: false,
      message: 'Set KORAIL_SERVICE_KEY and KORAIL_API_URL in Vercel environment variables.'
    });
  }

  const runYmd = String(date || seoulTodayYmd()).replaceAll('-', '');
  const departureDisplayName = CITY_STATIONS[from]?.ko || from;
  const arrivalDisplayName = CITY_STATIONS[to]?.ko || to;
  const departureName = korailQueryStationName(departureDisplayName);
  const arrivalName = korailQueryStationName(arrivalDisplayName);
  const debugMode = req.query?.debug || '';

  const PAGE_SIZE = 1000;
  const FETCH_TIMEOUT_MS = 4500;

  function buildFilteredQuery(pageNo = 1) {
    const q = new URLSearchParams();
    q.set('serviceKey', apiKey);
    q.set('returnType', 'JSON');
    q.set('pageNo', String(pageNo));
    q.set('numOfRows', String(PAGE_SIZE));
    q.set('cond[dptre_stn_nm::EQ]', departureName);
    q.set('cond[arvl_stn_nm::EQ]', arrivalName);
    // EQ previously produced inconsistent zero-row results on this provider.
    // Use an exact one-day range instead, while still filtering upstream.
    q.set('cond[run_ymd::GTE]', runYmd);
    q.set('cond[run_ymd::LTE]', runYmd);
    return q;
  }

  function diagnosticQueryFor(q) {
    return Array.from(q.entries())
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(key === 'serviceKey' ? '***' : value)}`)
      .join('&');
  }

  async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchFilteredPage(pageNo = 1) {
    const q = buildFilteredQuery(pageNo);
    const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${q.toString()}`;
    const upstream = await fetchWithTimeout(url);
    const bodyText = await upstream.text();

    let raw;
    try {
      raw = JSON.parse(bodyText);
    } catch {
      const error = new Error('The rail API returned a non-JSON response.');
      error.code = 'RAIL_UPSTREAM_NON_JSON';
      error.status = upstream.status;
      error.diagnosticQuery = diagnosticQueryFor(q);
      throw error;
    }

    if (!upstream.ok) {
      const error = new Error('The rail API returned an upstream error.');
      error.code = 'RAIL_UPSTREAM_ERROR';
      error.status = upstream.status;
      error.details = raw;
      error.diagnosticQuery = diagnosticQueryFor(q);
      throw error;
    }

    return {
      raw,
      normalized: normalizeItems(raw),
      diagnosticQuery: diagnosticQueryFor(q)
    };
  }

  try {
    // One server-filtered request replaces the old broad page-search strategy.
    const first = await fetchFilteredPage(1);
    const providerCount = providerTotalCount(first.raw) ?? first.normalized.length;

    // Keep a local verification pass so malformed/ignored upstream filters can never
    // leak unrelated routes/dates into the UI. With route+date cond filters, normal
    // result sets should comfortably fit in one 1000-row page.
    const filteredTrains = filterNormalizedTrains(
      first.normalized,
      departureName,
      arrivalName,
      runYmd
    );

    return res.status(200).json({
      configured: true,
      source: 'KORAIL_OPEN_API',
      sourceLabel: 'KORAIL Open API',
      route: {
        from,
        to,
        fromStation: CITY_STATIONS[from]?.en || from,
        toStation: CITY_STATIONS[to]?.en || to,
        date: date || null
      },
      query: {
        departureStation: departureName,
        arrivalStation: arrivalName,
        runYmd,
        debugMode
      },
      strategy: 'server-cond-filter',
      pageSize: PAGE_SIZE,
      fetchTimeoutMs: FETCH_TIMEOUT_MS,
      providerCount,
      fetchedCount: first.normalized.length,
      matchedCount: filteredTrains.length,
      diagnosticQuery: first.diagnosticQuery,
      truncated: providerCount > first.normalized.length,
      trains: filteredTrains
    });
  } catch (error) {
    return res.status(502).json({
      error: 'RAIL_FETCH_FAILED',
      code: error?.code || 'RAIL_FETCH_FAILED',
      message: error?.message || 'Rail API request failed',
      diagnosticQuery: error?.diagnosticQuery || null
    });
  }
}
