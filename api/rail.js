export default async function handler(req, res) {
  try {
    const { from, to, date } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from, to 파라미터가 필요합니다.' });
    }

    const serviceKey = process.env.KORAIL_SERVICE_KEY;
    if (!serviceKey) {
      return res.status(500).json({ error: 'KORAIL_SERVICE_KEY 환경변수가 설정되지 않았습니다.' });
    }

    const runYmd = date || new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const params = new URLSearchParams({
      serviceKey,
      pageNo: '1',
      numOfRows: '20',
      returnType: 'JSON',
      'cond[run_ymd::GTE]': runYmd,
      'cond[run_ymd::LTE]': runYmd,
      'cond[dptre_stn_nm::EQ]': from,
      'cond[arvl_stn_nm::EQ]': to
    });

    const url = `https://apis.data.go.kr/B551457/run/v2/travelerTrainRunPlan2?${params.toString()}`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
