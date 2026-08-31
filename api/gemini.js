export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다' });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message가 필요합니다' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API 에러:', data);
      return res.status(response.status).json({ error: 'Gemini 호출 실패' });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseResponse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('서버 에러:', err);
    return res.status(500).json({ error: '서버 내부 오류' });
  }
}

function buildPrompt(message, context) {
  return `
너는 여행 앱 "Korea Route"의 AI 어시스턴트야.
사용자 질문에 자연스럽게 답변하고, 마지막 줄에 추천 액션을 JSON으로 추가해줘.

사용 가능한 액션 목록: ${JSON.stringify(context?.availableActions || [])}
현재 여행 정보: ${JSON.stringify(context?.tripInfo || {})}

사용자 질문: "${message}"

응답 형식(반드시 지켜줘):
[자연어 답변]
---ACTIONS---
["action_id_1", "action_id_2"]
`;
}

function parseResponse(rawText) {
  const [answerPart, actionsPart] = rawText.split('---ACTIONS---');
  let actions = [];
  try {
    actions = JSON.parse(actionsPart?.trim() || '[]');
  } catch {
    actions = [];
  }
  return {
    answer: answerPart?.trim() || '',
    actions,
  };
}
