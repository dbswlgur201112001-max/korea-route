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
      service: item.trainTypeName ?? item.trainKindName ?? item.trn_knd_nm ?? item.train_type_nm ?? item.trainType ?? null,
      trainType: item.trainTypeName ?? item.trainKindName ?? item.trn_knd_nm ?? item.train_type_nm ?? item.trainType ?? null,
      departureStation: item.departureStationName ?? item.dptreStnNm ?? item.dptre_stn_nm ?? item.depPlaceNm ?? null,
      arrivalStation: item.arrivalStationName ?? item.arvlStnNm ?? item.arvl_stn_nm ?? item.arrPlaceNm ?? null,
      departureTime,
      arrivalTime,
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
  query.set('pageNo', '1');
  query.set('numOfRows', '100');

  const debugNoFilter = req.query?.debug === 'nofilter';
  if(!debugNoFilter){
    query.set('cond[dptre_stn_nm::LIKE]', `%${departureName}%`);
    query.set('cond[arvl_stn_nm::LIKE]', `%${arrivalName}%`);
  }

  query.set('cond[run_ymd::GTE]', runYmd);
  query.set('cond[run_ymd::LTE]', runYmd);

  const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${query.toString()}`;
  const diagnosticQuery = Array.from(query.entries())
    .map(([key,value]) => `${encodeURIComponent(key)}=${encodeURIComponent(key === 'serviceKey' ? '***' : value)}`)
    .join('&');

  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await upstream.text();
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: 'RAIL_UPSTREAM_NON_JSON',
        message: 'The rail API returned a non-JSON response.',
        status: upstream.status
      });
    }

    if (!upstream.ok) {
      return res.status(502).json({
        error: 'RAIL_UPSTREAM_ERROR',
        status: upstream.status,
        details: raw,
        diagnosticQuery
      });
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
        runYmd
      },
      diagnosticQuery,
      providerCount: providerTotalCount(raw),
      trains: normalizeItems(raw)
    });
  } catch (error) {
    return res.status(502).json({
      error: 'RAIL_FETCH_FAILED',
      message: error?.message || 'Rail API request failed'
    });
  }
}
