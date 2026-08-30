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

function scanMatchDiagnostics(trains, departureName, arrivalName, runYmd) {
  const from = compactStationName(departureName);
  const to = compactStationName(arrivalName);
  let dateCount = 0;
  let routeCount = 0;
  let matchedCount = 0;
  let sawTargetDate = false;
  let sawAfterTargetDate = false;
  const dateSamples = [];
  const routeSamples = [];

  for(const train of (Array.isArray(trains) ? trains : [])){
    const dep = compactStationName(train?.departureStation);
    const arr = compactStationName(train?.arrivalStation);
    const day = trainRunDate(train);

    if(day === runYmd){
      sawTargetDate = true;
      dateCount += 1;
      if(dateSamples.length < 5) dateSamples.push(train);
    }else if(sawTargetDate && day && day > runYmd){
      sawAfterTargetDate = true;
    }

    if(dep === from && arr === to){
      routeCount += 1;
      if(routeSamples.length < 5) routeSamples.push(train);
      if(day === runYmd) matchedCount += 1;
    }
  }

  return {
    dateCount,
    routeCount,
    matchedCount,
    sawTargetDate,
    sawAfterTargetDate,
    dateSamples,
    routeSamples
  };
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

  const debugMode = req.query?.debug || '';
  const PAGE_SIZE = 1000;
  const MAX_BINARY_STEPS = 8;
  const FETCH_TIMEOUT_MS = 4500;

  function diagnosticQueryFor(q) {
    return Array.from(q.entries())
      .map(([key,value]) => `${encodeURIComponent(key)}=${encodeURIComponent(key === 'serviceKey' ? '***' : value)}`)
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

  async function fetchBroadPage(pageNo) {
    const q = new URLSearchParams();
    q.set('serviceKey', apiKey);
    q.set('returnType', 'JSON');
    q.set('pageNo', String(pageNo));
    q.set('numOfRows', String(PAGE_SIZE));

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

    if(!upstream.ok){
      const error = new Error('The rail API returned an upstream error.');
      error.code = 'RAIL_UPSTREAM_ERROR';
      error.status = upstream.status;
      error.details = raw;
      error.diagnosticQuery = diagnosticQueryFor(q);
      throw error;
    }

    return {
      pageNo,
      raw,
      normalized: normalizeItems(raw),
      diagnosticQuery: diagnosticQueryFor(q)
    };
  }

  function pageDateRange(trains) {
    const days = (Array.isArray(trains) ? trains : [])
      .map(trainRunDate)
      .filter(Boolean)
      .sort();
    return {
      min: days[0] || null,
      max: days[days.length - 1] || null
    };
  }

  try {
    const first = await fetchBroadPage(1);
    const providerCount = providerTotalCount(first.raw) || first.normalized.length;
    const totalPages = Math.max(1, Math.ceil(providerCount / PAGE_SIZE));

    let fetchedCount = first.normalized.length;
    let scannedPages = 1;
    const diagnosticQueries = [first.diagnosticQuery];
    const pageRanges = [{ pageNo: 1, ...pageDateRange(first.normalized) }];

    let targetPages = [];
    const firstRange = pageRanges[0];

    if(firstRange.min && firstRange.max && runYmd >= firstRange.min && runYmd <= firstRange.max){
      targetPages = [first];
    }else if(totalPages > 1){
      const last = await fetchBroadPage(totalPages);
      fetchedCount += last.normalized.length;
      scannedPages += 1;
      diagnosticQueries.push(last.diagnosticQuery);

      const lastRange = { pageNo: totalPages, ...pageDateRange(last.normalized) };
      pageRanges.push(lastRange);

      const ascending =
        firstRange.min && lastRange.min
          ? firstRange.min <= lastRange.min
          : true;

      let low = 1;
      let high = totalPages;
      let steps = 0;

      while(low <= high && steps < MAX_BINARY_STEPS){
        const mid = Math.floor((low + high) / 2);

        let page;
        if(mid === 1) page = first;
        else if(mid === totalPages) page = last;
        else {
          page = await fetchBroadPage(mid);
          fetchedCount += page.normalized.length;
          scannedPages += 1;
          diagnosticQueries.push(page.diagnosticQuery);
        }

        const range = pageDateRange(page.normalized);
        pageRanges.push({ pageNo: mid, ...range });
        steps += 1;

        if(range.min && range.max && runYmd >= range.min && runYmd <= range.max){
          targetPages = [page];

          // Date rows can straddle a page boundary. Check immediate neighbors only.
          for(const neighborNo of [mid - 1, mid + 1]){
            if(neighborNo < 1 || neighborNo > totalPages) continue;
            const neighbor = await fetchBroadPage(neighborNo);
            fetchedCount += neighbor.normalized.length;
            scannedPages += 1;
            diagnosticQueries.push(neighbor.diagnosticQuery);

            const neighborRange = pageDateRange(neighbor.normalized);
            pageRanges.push({ pageNo: neighborNo, ...neighborRange });

            if(neighborRange.min && neighborRange.max &&
               runYmd >= neighborRange.min && runYmd <= neighborRange.max){
              targetPages.push(neighbor);
            }
          }
          break;
        }

        if(!range.min || !range.max) break;

        if(ascending){
          if(runYmd < range.min) high = mid - 1;
          else low = mid + 1;
        }else{
          if(runYmd > range.max) high = mid - 1;
          else low = mid + 1;
        }
      }
    }

    const targetDateRows = targetPages.flatMap(p =>
      p.normalized.filter(train => trainRunDate(train) === runYmd)
    );

    const filteredTrains = filterNormalizedTrains(
      targetDateRows,
      departureName,
      arrivalName,
      runYmd
    );

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
      strategy: 'date-page-binary-search',
      pageSize: PAGE_SIZE,
      maxBinarySteps: MAX_BINARY_STEPS,
      fetchTimeoutMs: FETCH_TIMEOUT_MS,
      providerCount,
      totalPages,
      scannedPages,
      fetchedCount,
      targetDateCount: targetDateRows.length,
      matchedCount: filteredTrains.length,
      targetPageNumbers: targetPages.map(p => p.pageNo),
      pageRanges: debugMode === 'pagediag' ? pageRanges : undefined,
      diagnosticQuery: diagnosticQueries[diagnosticQueries.length - 1] || null,
      diagnosticQueries: debugMode === 'pagediag' ? diagnosticQueries : undefined,
      trains: filteredTrains
    });
  } catch (error) {
    return res.status(502).json({
      error: 'RAIL_FETCH_FAILED',
      message: error?.message || 'Rail API request failed'
    });
  }
}
