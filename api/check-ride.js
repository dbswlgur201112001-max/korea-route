const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const rateMap = new Map();
const MAX_DATA_URL_CHARS = 3_000_000;
const FETCH_TIMEOUT_MS = 20_000;

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function clientIp(req) {
  const fwd = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req.headers?.['x-real-ip'] || 'unknown');
}

function rateAllowed(req) {
  const now = Date.now();
  const ip = clientIp(req);
  const current = rateMap.get(ip);
  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    rateMap.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  rateMap.set(ip, current);
  return current.count <= RATE_MAX;
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

function parseImageDataUrl(value) {
  const text = String(value || '');
  if (!text || text.length > MAX_DATA_URL_CHARS) return null;
  const match = text.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  const subtype = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
  return { mimeType: `image/${subtype}`, data: match[2] };
}

function cleanString(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function resultSchema() {
  return {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['MATCH', 'POSSIBLE', 'MISMATCH', 'UNCLEAR'] },
      vehicleType: { type: 'string', enum: ['train', 'bus', 'unknown'] },
      seenDestination: { type: 'string' },
      routeOrLine: { type: 'string' },
      platformOrStop: { type: 'string' },
      departureTime: { type: 'string' },
      summary: { type: 'string' },
      evidence: { type: 'array', items: { type: 'string' }, maxItems: 5 },
      advice: { type: 'string' }
    },
    required: ['status', 'vehicleType', 'seenDestination', 'routeOrLine', 'platformOrStop', 'departureTime', 'summary', 'evidence', 'advice']
  };
}

function buildPrompt({ mode, expectedTarget, expectedRoute, language }) {
  const answerLanguage = language === 'ko' ? 'Korean' : 'English';
  return `You are a conservative public-transport photo checker for a Korea travel app.
Analyze ONLY text and transport information that is visibly present in the image. Do not invent unreadable text and do not use general route knowledge to guess unseen stop sequences.

User says they are checking: ${mode === 'bus' ? 'BUS' : 'TRAIN'}
Expected destination: ${expectedTarget || '(not provided)'}
Expected line / route / train number: ${expectedRoute || '(not provided)'}

Classify using exactly one status:
- MATCH: visible evidence directly supports the expected destination and/or exact route/train identifier with no visible contradiction.
- POSSIBLE: some visible evidence is compatible, but the image cannot prove the user's destination is served.
- MISMATCH: visible text clearly contradicts the expected destination or route/train identifier.
- UNCLEAR: image is unreadable, missing useful transport information, or comparison cannot be made safely.

Important rules:
1. A terminal destination different from the user's intermediate stop is NOT automatically a mismatch. If the image does not prove the stop sequence, use POSSIBLE or UNCLEAR.
2. Never claim this is an official boarding confirmation.
3. If characters are too small or blurred, say so instead of guessing.
4. Keep evidence to short visible facts from the image.
5. Write summary, evidence and advice in ${answerLanguage}.
6. Advice must tell the user what to verify on the live sign/vehicle before boarding when confidence is not direct.
Return only the structured JSON requested by the schema.`;
}

function normalizeResult(raw) {
  const statuses = new Set(['MATCH', 'POSSIBLE', 'MISMATCH', 'UNCLEAR']);
  const vehicles = new Set(['train', 'bus', 'unknown']);
  return {
    status: statuses.has(raw?.status) ? raw.status : 'UNCLEAR',
    vehicleType: vehicles.has(raw?.vehicleType) ? raw.vehicleType : 'unknown',
    seenDestination: cleanString(raw?.seenDestination, 120),
    routeOrLine: cleanString(raw?.routeOrLine, 120),
    platformOrStop: cleanString(raw?.platformOrStop, 120),
    departureTime: cleanString(raw?.departureTime, 80),
    summary: cleanString(raw?.summary, 360),
    evidence: Array.isArray(raw?.evidence) ? raw.evidence.slice(0, 5).map(v => cleanString(v, 180)).filter(Boolean) : [],
    advice: cleanString(raw?.advice, 360)
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  if (!rateAllowed(req)) return send(res, 429, { error: 'RATE_LIMITED' });

  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return send(res, 503, { error: 'AI_NOT_CONFIGURED' });

  const body = parseBody(req);
  if (!body) return send(res, 400, { error: 'INVALID_JSON' });
  const image = parseImageDataUrl(body.imageDataUrl);
  if (!image) return send(res, 400, { error: 'INVALID_IMAGE' });

  const mode = body.mode === 'bus' ? 'bus' : 'train';
  const expectedTarget = cleanString(body.expectedTarget, 120);
  const expectedRoute = cleanString(body.expectedRoute, 80);
  const language = body.language === 'ko' ? 'ko' : 'en';
  if (!expectedTarget && !expectedRoute) return send(res, 400, { error: 'TARGET_REQUIRED' });

  const model = cleanString(process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite', 80);
  if (!/^[A-Za-z0-9._-]+$/.test(model)) return send(res, 500, { error: 'INVALID_MODEL_CONFIG' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: buildPrompt({ mode, expectedTarget, expectedRoute, language }) }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: resultSchema()
        }
      }),
      signal: controller.signal
    });

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const code = upstream.status === 429 ? 'RATE_LIMITED' : 'AI_UPSTREAM_FAILED';
      return send(res, upstream.status === 429 ? 429 : 502, { error: code, upstreamStatus: upstream.status });
    }
    const text = payload?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('').trim();
    if (!text) return send(res, 502, { error: 'AI_EMPTY_RESPONSE' });
    let parsed;
    try { parsed = JSON.parse(text); } catch { return send(res, 502, { error: 'AI_INVALID_JSON' }); }
    return send(res, 200, { ...normalizeResult(parsed), provider: 'Gemini', model });
  } catch (error) {
    if (error?.name === 'AbortError') return send(res, 504, { error: 'AI_TIMEOUT' });
    return send(res, 502, { error: 'AI_REQUEST_FAILED' });
  } finally {
    clearTimeout(timer);
  }
};
