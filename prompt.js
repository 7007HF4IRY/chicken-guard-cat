const fs = require("fs");
const path = require("path");

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, "prompts", "system.txt"),
  "utf8"
);

function buildTurnPayload({ turn, maxTurns, favor, suspicion, user_message }) {
  return JSON.stringify({
    turn,
    max_turns: maxTurns,
    favor,
    suspicion,
    user_message,
  });
}

function buildApiMessages(history, currentPayload) {
  const messages = [];
  for (const h of history) {
    messages.push({ role: "user", content: h.userPayload });
    messages.push({ role: "assistant", content: h.assistantRaw });
  }
  messages.push({ role: "user", content: currentPayload });
  return messages;
}

module.exports = {
  SYSTEM_PROMPT,
  buildTurnPayload,
  buildApiMessages,
};
