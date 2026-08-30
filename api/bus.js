const CITY_TERMINALS = {
  Seoul: ['서울경부','서울센트럴','동서울'],
  Suwon: ['수원'],
  Incheon: ['인천'],
  Chuncheon: ['춘천'],
  Gangneung: ['강릉'],
  Sokcho: ['속초'],
  Daejeon: ['대전복합','유성'],
  Gongju: ['공주'],
  Jeonju: ['전주'],
  Yeosu: ['여수'],
  Suncheon: ['순천'],
  Gyeongju: ['경주'],
  Andong: ['안동'],
  Daegu: ['동대구','서대구'],
  Ulsan: ['울산'],
  Pohang: ['포항'],
  Busan: ['부산','부산서부'],
  Tongyeong: ['통영'],
  Geoje: ['고현']
};

function clean(value){
  return String(value||'').trim();
}

function normalizeItems(payload){
  const candidates = [
    payload?.items,
    payload?.data?.items,
    payload?.response?.body?.items?.item,
    payload?.response?.body?.items,
    payload?.body?.items?.item,
    payload?.body?.items
  ];
  let items = candidates.find(Array.isArray);
  if(!items){
    const single = candidates.find(v => v && typeof v === 'object');
    if(single) items = [single];
  }
  if(!Array.isArray(items)) return [];

  return items.map((it)=>({
    carrier: it.carrier || it.company || it.transportCompanyName || it.companyNm || it.busCompanyNm || '',
    departureTerminal: it.departureTerminal || it.depTerminal || it.depPlaceNm || it.departurePlaceName || '',
    arrivalTerminal: it.arrivalTerminal || it.arrTerminal || it.arrPlaceNm || it.arrivalPlaceName || '',
    departureTime: it.departureTime || it.depTime || it.depPlandTime || it.startTime || '',
    arrivalTime: it.arrivalTime || it.arrTime || it.arrPlandTime || it.endTime || '',
    fare: it.fare || it.adultFare || it.charge || it.price || null,
    busGrade: it.busGrade || it.grade || it.busGradeNm || ''
  })).filter(it => it.departureTime || it.arrivalTime || it.carrier);
}

module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');

  if(req.method!=='GET'){
    res.status(405).json({error:'Method not allowed'});
    return;
  }

  const from = clean(req.query?.from);
  const to = clean(req.query?.to);
  const date = clean(req.query?.date).replace(/[^\d]/g,'');

  if(!from || !to){
    res.status(400).json({error:'from and to are required'});
    return;
  }

  const serviceKey = clean(process.env.BUS_SERVICE_KEY);
  const apiUrl = clean(process.env.BUS_API_URL);

  if(!serviceKey || !apiUrl){
    res.status(200).json({
      configured:false,
      items:[],
      message:'BUS API is not configured. Set BUS_SERVICE_KEY and BUS_API_URL in Vercel.'
    });
    return;
  }

  const fromTerminal = CITY_TERMINALS[from]?.[0];
  const toTerminal = CITY_TERMINALS[to]?.[0];

  if(!fromTerminal || !toTerminal){
    res.status(200).json({configured:true,items:[],message:'No terminal mapping for this city pair.'});
    return;
  }

  // This adapter deliberately does NOT guess provider-specific parameter names.
  // Configure BUS_API_URL as a complete upstream endpoint that accepts the
  // generic query names below through your own proxy/adapter, or update only
  // this small mapping block after selecting a verified public bus API.
  const url = new URL(apiUrl);
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('fromTerminal', fromTerminal);
  url.searchParams.set('toTerminal', toTerminal);
  if(date) url.searchParams.set('date', date);
  url.searchParams.set('format','json');

  try{
    const upstream = await fetch(url.toString(), {headers:{'Accept':'application/json'}});
    const text = await upstream.text();
    let payload;
    try{ payload = JSON.parse(text); }
    catch{
      res.status(502).json({error:'Bus upstream did not return JSON',upstreamStatus:upstream.status});
      return;
    }

    if(!upstream.ok){
      res.status(502).json({
        error:'Bus upstream request failed',
        upstreamStatus:upstream.status,
        upstream: payload
      });
      return;
    }

    const items = normalizeItems(payload);
    res.status(200).json({configured:true,items});
  }catch(err){
    res.status(500).json({error:'Bus adapter error',message:String(err?.message||err)});
  }
};
