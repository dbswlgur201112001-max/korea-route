module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다' });
  }

  const { message, context } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'message가 필요합니다' });
  }

  const model = 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  if (!process.env.GEMINI_API_KEY) {
    console.error('[gemini] GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.');
    return res.status(500).json({ error: '서버 설정 오류: API 키 없음' });
  }

  try {
    const response = await fetch(`${endpoint}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(message, context) }],
          },
        ],
      }),
    });

    const rawResponseText = await response.text();

    // 업스트림 상태와 응답 본문을 로그로 남긴다 (API 키는 절대 출력하지 않음)
    console.log('[gemini] model:', model);
    console.log('[gemini] endpoint:', endpoint);
    console.log('[gemini] upstream status:', response.status, response.statusText);
    console.log('[gemini] upstream body:', rawResponseText);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Gemini 호출 실패',
        upstreamStatus: response.status,
        upstreamBody: rawResponseText,
      });
    }

    let data;
    try {
      data = JSON.parse(rawResponseText);
    } catch (parseErr) {
      console.error('[gemini] JSON 파싱 실패:', parseErr.message);
      return res.status(502).json({ error: 'Gemini 응답 파싱 실패', raw: rawResponseText });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseResponse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[gemini] fetch 자체 실패:', err.name, err.message);
    return res.status(500).json({ error: '서버 내부 오류', detail: err.message });
  }
};

function buildPrompt(message, context) {
  return (
    'You are the AI assistant for the travel app Korea Route. Answer the user naturally, then add recommended actions as JSON on the last line.\n\n' +
    'Available actions: ' + JSON.stringify((context && context.availableActions) || []) + '\n' +
    'Current trip info: ' + JSON.stringify((context && context.tripInfo) || {}) + '\n\n' +
    'User question: "' + message + '"\n\n' +
    'Response format:\n[natural language answer]\n---ACTIONS---\n["action_id_1", "action_id_2"]'
  );
}

function parseResponse(rawText) {
  const parts = rawText.split('---ACTIONS---');
  const answerPart = parts[0];
  const actionsPart = parts[1];
  let actions = [];
  try {
    actions = JSON.parse((actionsPart || '[]').trim() || '[]');
  } catch (e) {
    actions = [];
  }
  return {
    answer: (answerPart || '').trim(),
    actions: actions,
  };
}
