require("dotenv").config();
const express = require("express");
const path = require("path");
const {
  SYSTEM_PROMPT,
  buildTurnPayload,
  buildApiMessages,
} = require("./prompt");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.INWORLD_API_KEY;
const MODEL = process.env.INWORLD_MODEL || "inworld/chicken_cat";

const DEFAULT_REPLY = {
  reply: "……냥?",
  intent: "기타",
  favor_delta: 0,
  suspicion_delta: 0,
  hidden_event: "none",
  mood: "귀찮음",
  end_state: "continue",
  ending_type: "none",
  debug_reason: "parse_fallback",
};

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(API_KEY), model: MODEL });
});

app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      error: "INWORLD_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.",
    });
  }

  const { user_message, state, history } = req.body || {};
  if (!user_message || !state) {
    return res.status(400).json({
      error: "user_message와 state가 필요합니다.",
    });
  }

  const currentPayload = buildTurnPayload({
    turn: state.turn,
    maxTurns: state.maxTurns ?? 5,
    favor: state.favor,
    suspicion: state.suspicion,
    user_message,
  });

  const apiMessages = buildApiMessages(history || [], currentPayload);

  const payload = {
    model: MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...apiMessages],
    temperature: 0.85,
    response_format: { type: "json_object" },
  };

  try {
    const r = await fetch("https://api.inworld.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) {
      console.error("Inworld error", r.status, text);
      return res.status(r.status).json({
        error: "Inworld API 오류",
        detail: text.slice(0, 500),
      });
    }

    const data = JSON.parse(text);
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { ...DEFAULT_REPLY, reply: raw.slice(0, 300) };
    }

    res.json({ ...DEFAULT_REPLY, ...parsed, _model: data.model || MODEL });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 오류", detail: String(e.message) });
  }
});

app.listen(PORT, () => {
  console.log(`치킨 사수 냥이 → http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn("⚠️  INWORLD_API_KEY 없음 — .env.example 참고");
  }
});
