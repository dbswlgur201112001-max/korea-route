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

function providerTotalCount(raw) {
  const n =
    raw?.response?.body?.totalCount ??
    raw?.body?.totalCount ??
    raw?.totalCount ??
    null;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : null;
}

function providerPageSize(raw, fallback) {
  const n =
    raw?.response?.body?.numOfRows ??
    raw?.body?.numOfRows ??
    raw?.numOfRows ??
    fallback;
  const parsed = Number(n);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

function rawItems(raw) {
  const items =
    raw?.response?.body?.items?.item ??
    raw?.body?.items?.item ??
    raw?.items?.item ??
    raw?.items ??
    raw?.data ??
    [];
  return Array.isArray(items) ? items : (items ? [items] : []);
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
      runYmd: String(item.run_ymd ?? item.runYmd ?? '').replace(/\D/g, '').slice(0, 8) || null,
      durationMinutes: minutesBetween(departureTime, arrivalTime),
      fare: Number(item.fare ?? item.adultFare ?? item.price ?? 0) || null,
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

  const runYmd = String(date || new Date().toISOString().slice(0, 10)).replaceAll('-', '');
  const departureDisplayName = CITY_STATIONS[from]?.ko || from;
  const arrivalDisplayName = CITY_STATIONS[to]?.ko || to;
  const departureName = korailQueryStationName(departureDisplayName);
  const arrivalName = korailQueryStationName(arrivalDisplayName);

  const query = new URLSearchParams();
  query.set('serviceKey', apiKey);
  query.set('returnType', 'JSON');

  const debugMode = req.query?.debug || '';
  const pageSize = 10000;
  const maxPages = 10;

  function diagnosticQueryFor(q) {
    return Array.from(q.entries())
      .map(([key,value]) => `${encodeURIComponent(key)}=${encodeURIComponent(key === 'serviceKey' ? '***' : value)}`)
      .join('&');
  }

  async function fetchRailPage(pageNo) {
    const pageQuery = new URLSearchParams(query);
    pageQuery.set('pageNo', String(pageNo));
    pageQuery.set('numOfRows', String(pageSize));
    const pageUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${pageQuery.toString()}`;
    const upstream = await fetch(pageUrl, { headers: { Accept: 'application/json' } });
    const bodyText = await upstream.text();
    let raw;
    try {
      raw = JSON.parse(bodyText);
    } catch {
      const error = new Error('The rail API returned a non-JSON response.');
      error.code = 'RAIL_UPSTREAM_NON_JSON';
      error.status = upstream.status;
      error.diagnosticQuery = diagnosticQueryFor(pageQuery);
      throw error;
    }
    if (!upstream.ok) {
      const error = new Error('The rail API returned an upstream error.');
      error.code = 'RAIL_UPSTREAM_ERROR';
      error.status = upstream.status;
      error.details = raw;
      error.diagnosticQuery = diagnosticQueryFor(pageQuery);
      throw error;
    }
    return {
      raw,
      normalized: normalizeItems(raw),
      diagnosticQuery: diagnosticQueryFor(pageQuery)
    };
  }

  try {
    const firstPage = await fetchRailPage(1);
    const providerCount = providerTotalCount(firstPage.raw) || firstPage.normalized.length;
    const effectivePageSize = providerPageSize(
      firstPage.raw,
      firstPage.normalized.length || pageSize
    );
    const totalPages = Math.max(1, Math.ceil(providerCount / effectivePageSize));
    const pagesToScan = Math.min(totalPages, maxPages);

    let scannedPages = 1;
    let fetchedCount = firstPage.normalized.length;
    let filteredTrains = filterNormalizedTrains(
      firstPage.normalized,
      departureName,
      arrivalName,
      runYmd
    );

    const diagnosticQueries = [firstPage.diagnosticQuery];
    const runDateCounts = {};
    const countRunDates = (trains) => {
      for(const train of (Array.isArray(trains) ? trains : [])){
        const day = trainRunDate(train);
        if(day) runDateCounts[day] = (runDateCounts[day] || 0) + 1;
      }
    };
    countRunDates(firstPage.normalized);

    const rawSamples = [];
    const pushRawSamples = (raw) => {
      for(const item of rawItems(raw)){
        if(rawSamples.length >= 5) break;
        rawSamples.push(item);
      }
    };
    pushRawSamples(firstPage.raw);

    if(debugMode !== 'all' && filteredTrains.length === 0){
      for(let pageNo = 2; pageNo <= pagesToScan; pageNo += 1){
        const page = await fetchRailPage(pageNo);
        scannedPages += 1;
        fetchedCount += page.normalized.length;
        diagnosticQueries.push(page.diagnosticQuery);
        countRunDates(page.normalized);
        pushRawSamples(page.raw);
        const matches = filterNormalizedTrains(
          page.normalized,
          departureName,
          arrivalName,
          runYmd
        );
        if(matches.length){
          filteredTrains = matches;
          break;
        }
        if(page.normalized.length < effectivePageSize) break;
      }
    }

    return res.status(200).json({
      configured: true,
      source: 'KORAIL_OPEN_API',
      sourceLabel: 'KORAIL Open API',
      route: {
        from, to,
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
      diagnosticQuery: diagnosticQueries[diagnosticQueries.length - 1],
      diagnosticQueries,
      providerCount,
      requestedPageSize: pageSize,
      effectivePageSize,
      maxPages,
      totalPages,
      scannedPages,
      fetchedCount,
      matchedCount: filteredTrains.length,
      rawSamples: debugMode === 'rawsample' ? rawSamples : undefined,
      rawSampleKeys: debugMode === 'rawsample'
        ? Array.from(new Set(rawSamples.flatMap((item) => Object.keys(item || {})))).sort()
        : undefined,
      runDateCounts: debugMode === 'rawsample' ? runDateCounts : undefined,
      trains: debugMode === 'all' ? firstPage.normalized : filteredTrains
    });
  } catch (error) {
    return res.status(502).json({
      error: 'RAIL_FETCH_FAILED',
      message: error?.message || 'Rail API request failed'
    });
  }
}
