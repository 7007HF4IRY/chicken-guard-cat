(function () {
  const MAX_TURNS = 5;
  const INITIAL = { favor: 20, suspicion: 40 };

  const MOOD_SPRITE = {
    귀찮음: "tired",
    의심: "sus",
    흥미: "int",
    츤데레: "tsun",
    감동: "love",
    폭발: "mad",
  };

  const OPENING =
    "집사, 방금 온 그 박스는 짐의 영역이다옹. *(식빵 자세로 앉으며)* 하품~ …비키라옹?";

  const CHOICE_SUCCESS =
    "…집사. 사실 혼자 먹는 건 좀 쓸쓸했다옹. 같이 먹자옹. 단, 다리는 내 거다옹.";
  const CHOICE_FAIL =
    "집사는 믿을 수 없다옹. 인내심을 다 쓰게 했다옹. 이 치킨은 짐이 책임지고 먹겠다옹.";

  const SAVE_KEY = "chicken-cat-save-v1";
  const SAVE_VERSION = 1;

  const els = {
    startScreen: document.getElementById("start-screen"),
    modeScreen: document.getElementById("mode-screen"),
    gameShell: document.getElementById("game-shell"),
    btnGoMode: document.getElementById("btn-go-mode"),
    btnBackStart: document.getElementById("btn-back-start"),
    modeButtons: document.querySelectorAll("[data-mode]"),
    modeLabel: document.getElementById("mode-label"),
    gameHint: document.getElementById("game-hint"),
    freeDock: document.getElementById("free-dock"),
    choiceDock: document.getElementById("choice-dock"),
    choiceGrid: document.getElementById("choice-grid"),
    favorNum: document.getElementById("favor-num"),
    susNum: document.getElementById("sus-num"),
    favorDots: document.getElementById("favor-dots"),
    susDots: document.getElementById("sus-dots"),
    turnLabel: document.getElementById("turn-label"),
    catImg: document.getElementById("cat-sprite"),
    catBubble: document.getElementById("cat-bubble"),
    catBubbleText: document.getElementById("cat-bubble-text"),
    playerLast: document.getElementById("player-last"),
    form: document.getElementById("chat-form"),
    input: document.getElementById("chat-input"),
    sendBtn: document.getElementById("send-btn"),
    resetBtn: document.getElementById("reset-btn"),
    overlay: document.getElementById("overlay"),
    modalTitle: document.getElementById("modal-title"),
    modalBody: document.getElementById("modal-body"),
    modalBtn: document.getElementById("modal-btn"),
    apiStatus: document.getElementById("api-status"),
  };

  let state = createInitialState();
  let endedModal = null;

  function createInitialState() {
    return {
      mode: null,
      favor: INITIAL.favor,
      suspicion: INITIAL.suspicion,
      turn: 0,
      ended: false,
      messages: [],
      lastIntents: [],
      hiddenFlags: [],
      lastMood: "귀찮음",
      turnHistory: [],
      choiceAllPersuade: true,
    };
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function pickExpression() {
    if (state.lastMood && MOOD_SPRITE[state.lastMood]) {
      return MOOD_SPRITE[state.lastMood];
    }
    if (state.suspicion >= 61) return "mad";
    if (state.favor >= 81) return "love";
    if (state.favor >= 61) return "tsun";
    if (state.favor >= 31) return "int";
    if (state.suspicion >= 31) return "sus";
    return "tired";
  }

  function renderGauges() {
    els.favorNum.textContent = state.favor;
    const patience = 100 - state.suspicion;
    els.susNum.textContent = patience;
    els.turnLabel.textContent = `${state.turn} / ${MAX_TURNS}`;

    const fSlots = Math.round(state.favor / 10);
    const sSlots = Math.round(patience / 10);
    els.favorDots.querySelectorAll(".dot").forEach((d, i) => {
      d.classList.toggle("on-favor", i < fSlots);
    });
    els.susDots.querySelectorAll(".dot").forEach((d, i) => {
      d.classList.toggle("on-sus", i < sSlots);
    });

    els.catImg.src = `img/${pickExpression()}.png`;
  }

  function hideCatBubble() {
    els.catBubble.classList.add("is-hidden");
    els.catBubbleText.textContent = "";
  }

  function showCatBubble(text) {
    els.catBubbleText.textContent = text;
    els.catBubble.classList.remove("is-hidden");
    els.catBubble.classList.remove("is-thinking");
  }

  function showThinkingBubble() {
    els.catBubbleText.textContent = "……냥?";
    els.catBubble.classList.remove("is-hidden");
    els.catBubble.classList.add("is-thinking");
  }

  function setPlayerLast(text) {
    if (!text) {
      els.playerLast.hidden = true;
      els.playerLast.textContent = "";
      return;
    }
    els.playerLast.hidden = false;
    els.playerLast.textContent = `집사: ${text}`;
  }

  function applyDeltas(data, intent) {
    let favor_delta = clamp(Number(data.favor_delta) || 0, -20, 28);
    let suspicion_delta = clamp(Number(data.suspicion_delta) || 0, -20, 25);

    if (state.mode === "free") {
      const repeat =
        state.lastIntents.filter((x) => x === intent).length >= 2;
      if (repeat) {
        favor_delta = Math.round(favor_delta / 2);
        suspicion_delta = Math.round(suspicion_delta / 2);
      }
      state.lastIntents.push(intent);
      if (state.lastIntents.length > 5) state.lastIntents.shift();

      const combo = state.lastIntents.slice(-3);
      if (
        combo[0] === "진심칭찬" &&
        combo[1] === "감정호소" &&
        combo[2] === "공유제안"
      ) {
        favor_delta += 13;
      }
    }

    state.favor = clamp(state.favor + favor_delta, 0, 100);
    state.suspicion = clamp(state.suspicion + suspicion_delta, 0, 100);
  }

  function evaluateEndFree(data) {
    const intent = data.intent || "";
    const hidden = data.hidden_event || "none";

    if (state.suspicion >= 90) {
      const taboo =
        hidden === "강아지금기" ||
        intent === "강아지" ||
        intent === "협박";
      return {
        type: "fail",
        ending_type: taboo ? "금기어폭발" : "의심폭발",
      };
    }
    if (state.turn >= 3 && state.favor >= 80 && state.suspicion <= 40) {
      return { type: "success", ending_type: data.ending_type || "같이먹자" };
    }
    if (state.turn >= MAX_TURNS) {
      if (state.favor >= 70 && state.suspicion <= 50) {
        return { type: "success", ending_type: data.ending_type || "웃음승리" };
      }
      return { type: "fail", ending_type: "시간초과" };
    }
    if (data.end_state === "success") {
      if (
        (state.turn >= 3 &&
          state.favor >= 80 &&
          state.suspicion <= 40) ||
        (state.turn >= MAX_TURNS &&
          state.favor >= 70 &&
          state.suspicion <= 50)
      ) {
        return {
          type: "success",
          ending_type: data.ending_type || "웃음승리",
        };
      }
    }
    if (data.end_state === "fail" && state.turn >= MAX_TURNS) {
      return {
        type: "fail",
        ending_type: data.ending_type || "시간초과",
      };
    }
    return null;
  }

  function setModalTitle(isWin) {
    const icon = isWin ? "img/icons/win.svg" : "img/icons/lose.svg";
    const label = isWin ? "협상 성공!" : "협상 실패…";
    els.modalTitle.innerHTML = `<img class="pix-icon" src="${icon}" width="16" height="16" alt="" /> ${label}`;
  }

  function showEnding(result, reply) {
    state.ended = true;
    const isWin = result.type === "success";
    setModalTitle(isWin);
    const body = reply || "……";
    els.modalBody.textContent = body;
    els.overlay.classList.add("show");
    els.input.disabled = true;
    els.sendBtn.disabled = true;
    disableChoiceButtons();
    endedModal = { isWin, body };
    persistSave("game");
  }

  function captureUi() {
    const playerRaw = els.playerLast.textContent || "";
    const playerLast = els.playerLast.hidden
      ? ""
      : playerRaw.replace(/^집사:\s*/, "");
    return {
      catBubbleText: els.catBubbleText.textContent || "",
      catBubbleHidden: els.catBubble.classList.contains("is-hidden"),
      playerLast,
      endedModal,
    };
  }

  function persistSave(screen) {
    try {
      const packet = {
        version: SAVE_VERSION,
        screen,
        state:
          screen === "game" && state.mode
            ? {
                mode: state.mode,
                favor: state.favor,
                suspicion: state.suspicion,
                turn: state.turn,
                ended: state.ended,
                messages: state.messages,
                lastIntents: state.lastIntents,
                hiddenFlags: state.hiddenFlags,
                lastMood: state.lastMood,
                turnHistory: state.turnHistory,
                choiceAllPersuade: state.choiceAllPersuade,
              }
            : null,
        ui: screen === "game" && state.mode ? captureUi() : null,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(packet));
    } catch (e) {
      console.warn("게임 저장 실패", e);
    }
  }

  function clearSave() {
    endedModal = null;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn("저장 삭제 실패", e);
    }
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const packet = JSON.parse(raw);
      if (packet.version !== SAVE_VERSION) return null;
      return packet;
    } catch {
      return null;
    }
  }

  function restoreUi(ui) {
    if (!ui) return;
    if (!ui.catBubbleHidden && ui.catBubbleText) {
      showCatBubble(ui.catBubbleText);
    } else {
      hideCatBubble();
    }
    setPlayerLast(ui.playerLast || "");
    endedModal = ui.endedModal || null;
  }

  function resumeGame(packet) {
    const base = createInitialState();
    state = { ...base, ...packet.state };
    state.mode = packet.state.mode === "choice" ? "choice" : "free";

    els.startScreen.classList.add("is-hidden");
    els.modeScreen.classList.add("is-hidden");
    els.modeScreen.setAttribute("aria-hidden", "true");
    els.gameShell.classList.remove("is-hidden");
    els.gameShell.setAttribute("aria-hidden", "false");
    els.overlay.classList.remove("show");

    setModeUi(state.mode);
    restoreUi(packet.ui);
    renderGauges();

    if (state.ended && endedModal) {
      setModalTitle(endedModal.isWin);
      els.modalBody.textContent = endedModal.body;
      els.overlay.classList.add("show");
      els.input.disabled = true;
      els.sendBtn.disabled = true;
      disableChoiceButtons();
      return;
    }

    if (state.mode === "choice") {
      els.sendBtn.disabled = true;
      els.input.disabled = true;
      renderChoiceTurn();
    } else {
      checkApi();
      els.input.disabled = false;
      els.sendBtn.disabled = false;
      els.input.focus();
    }
  }

  function initApp() {
    const packet = loadSave();
    if (packet?.screen === "game" && packet.state?.mode) {
      resumeGame(packet);
      return;
    }
    if (packet?.screen === "mode") {
      showModeScreen();
      return;
    }
    showStartScreen();
  }

  function disableChoiceButtons() {
    els.choiceGrid.querySelectorAll(".choice-btn").forEach((b) => {
      b.disabled = true;
    });
  }

  function showStartScreen() {
    clearSave();
    state = createInitialState();
    els.gameShell.classList.add("is-hidden");
    els.gameShell.setAttribute("aria-hidden", "true");
    els.modeScreen.classList.add("is-hidden");
    els.modeScreen.setAttribute("aria-hidden", "true");
    els.startScreen.classList.remove("is-hidden");
    els.overlay.classList.remove("show");
  }

  function showModeScreen() {
    els.startScreen.classList.add("is-hidden");
    els.modeScreen.classList.remove("is-hidden");
    els.modeScreen.setAttribute("aria-hidden", "false");
    persistSave("mode");
  }

  function setModeUi(mode) {
    const isChoice = mode === "choice";
    els.freeDock.classList.toggle("is-hidden", isChoice);
    els.choiceDock.classList.toggle("is-hidden", !isChoice);
    els.choiceDock.setAttribute("aria-hidden", isChoice ? "false" : "true");
    els.modeLabel.textContent = isChoice ? "선택지 모드" : "자유 채팅";
    els.gameHint.textContent = isChoice
      ? "4개 중 설득 1개 · 5턴 모두 설득만 골라야 성공"
      : "설득 80↑ · 인내심 60↑ · 실패 10↓";
    els.apiStatus.classList.toggle("is-hidden", isChoice);
  }

  function startGame(mode) {
    state = createInitialState();
    state.mode = mode;
    els.modeScreen.classList.add("is-hidden");
    els.gameShell.classList.remove("is-hidden");
    els.gameShell.setAttribute("aria-hidden", "false");
    setModeUi(mode);
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    setPlayerLast("");
    renderGauges();
    showCatBubble(OPENING);
    if (mode === "choice") {
      renderChoiceTurn();
    }
    if (mode === "free") {
      checkApi();
      els.input.focus();
    } else {
      els.apiStatus.textContent = "OFFLINE";
      els.apiStatus.className = "status-pill offline";
    }
    persistSave("game");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderChoiceTurn() {
    if (state.ended || state.turn >= MAX_TURNS) return;
    const deck = window.CHOICE_TURNS[state.turn];
    if (!deck) return;
    const options = shuffle(deck.options);
    els.choiceGrid.innerHTML = "";
    options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => onChoicePick(opt));
      els.choiceGrid.appendChild(btn);
    });
  }

  function onChoicePick(opt) {
    if (state.ended || state.mode !== "choice") return;
    disableChoiceButtons();
    state.turn += 1;
    setPlayerLast(opt.label);
    if (opt.type !== "persuade") {
      state.choiceAllPersuade = false;
    }
    if (opt.mood) state.lastMood = opt.mood;
    applyDeltas(opt, opt.type);
    renderGauges();
    showCatBubble(opt.reply);

    if (state.turn >= MAX_TURNS) {
      const win = state.choiceAllPersuade;
      showEnding(
        { type: win ? "success" : "fail" },
        win ? CHOICE_SUCCESS : CHOICE_FAIL
      );
      return;
    }
    persistSave("game");
    setTimeout(() => renderChoiceTurn(), 450);
  }

  async function checkApi() {
    try {
      const r = await fetch("/api/health");
      const j = await r.json();
      if (j.hasKey) {
        els.apiStatus.textContent = "AI ON";
        els.apiStatus.className = "status-pill online";
      } else {
        els.apiStatus.textContent = "AI OFF";
        els.apiStatus.className = "status-pill offline";
      }
    } catch {
      els.apiStatus.textContent = "LOCAL";
      els.apiStatus.className = "status-pill offline";
    }
  }

  async function callAi(userText) {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_message: userText,
        state: {
          favor: state.favor,
          suspicion: state.suspicion,
          turn: state.turn,
          maxTurns: MAX_TURNS,
        },
        history: state.turnHistory,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || "API 요청 실패");
    }
    return r.json();
  }

  function localFallback(userText) {
    let intent = "기타";
    let favor_delta = 6;
    let suspicion_delta = 2;
    let hidden_event = "none";
    let mood = "귀찮음";
    let reply =
      "…뭐라는 거냐옹? *(귀를 살짝 돌림)* 짐은 바쁘다옹.";

    if (/강아지|멍멍|개/.test(userText)) {
      intent = "강아지";
      favor_delta = -15;
      suspicion_delta = 25;
      hidden_event = "강아지금기";
      mood = "폭발";
      reply = "…나가라옹. 개집사. *(수염이 부들부들)*";
    } else if (/같이\s*먹|나눠\s*먹|함께/.test(userText)) {
      intent = "공유제안";
      favor_delta = 28;
      suspicion_delta = -15;
      hidden_event = "속마음공개";
      mood = "츤데레";
      reply =
        "누, 누가 심심하다고 했냐옹! …*(꼬리가 천천히 흔들림)* 아주 조금 맞는 말이긴 하다옹.";
    } else if (
      /츄르|동결건조|습식|캔|파우치|닭가슴|연어|참치|소고기|오리고기|캣그라스|cat\s*grass/i.test(
        userText
      )
    ) {
      intent = "뇌물";
      favor_delta = 26;
      suspicion_delta = -3;
      mood = "흥미";
      reply = "…*(귀가 쫑긋)* 그 단어는 짐의 사전에 있다옹. 언제 가져온다옹?";
    } else if (/같이\s*놀|놀아줘|놀자|레이저|낚싯|캣타워|장난감/.test(userText)) {
      intent = "뇌물";
      favor_delta = 22;
      suspicion_delta = -8;
      mood = "흥미";
      reply = "…놀아준다고? *(꼬리가 살랑)* …치킨 얘기랑 섞지 말라옹.";
    } else if (
      /멋지|멋있|훌륭|대단|이쁘|예쁘|잘생|식빵/.test(userText) &&
      userText.length >= 8
    ) {
      intent = "진심칭찬";
      favor_delta = 21;
      suspicion_delta = -5;
      mood = "츤데레";
      reply = "…흥, 알아보는 눈은 있네옹. *(턱을 들어 올림)*";
    } else if (/외롭|배고파|배고프|쓸쓸|혼자\s*먹/.test(userText)) {
      intent = "감정호소";
      favor_delta = 16;
      suspicion_delta = -8;
      mood = "츤데레";
      reply = "…집사가 그렇게 말하면… *(시선을 돌림)* …조금은 알겠다옹.";
    } else if (/ㅠ{3,}|울어|죽어|제발.{0,6}제발|드라마|연기/.test(userText)) {
      intent = "아부";
      favor_delta = 2;
      suspicion_delta = 12;
      mood = "의심";
      reply = "…연기 티 난다옹. 수염이 다 본다옹.";
    } else if (/빨리|당장|제발/.test(userText)) {
      intent = "재촉";
      favor_delta = -10;
      suspicion_delta = 20;
      mood = "귀찮음";
      reply = "하품~ 급하면 더 안 된다옹. *(일부러 느리게 깜빡)*";
    } else if (/귀여|이쁘|예쁘/.test(userText) && userText.length < 12) {
      intent = "아부";
      favor_delta = 6;
      suspicion_delta = 5;
      mood = "의심";
      reply = "…그건 매일 듣는다옹. 다른 거 해보라옹.";
    } else if (/사장님|이사님/.test(userText)) {
      intent = "진심칭찬";
      favor_delta = 21;
      suspicion_delta = -5;
      hidden_event = "사장님호칭";
      mood = "흥미";
      reply = "…흠, 말을 좀 아는 집사다옹.";
    } else if (/꾹꾹/.test(userText)) {
      intent = "진심칭찬";
      favor_delta = 23;
      suspicion_delta = -8;
      hidden_event = "꾹꾹이";
      mood = "츤데레";
      reply = "냥?! *(눈이 커짐)* …그, 그건 짐의 알 바 아니다옹!!";
    }

    return {
      reply,
      intent,
      favor_delta,
      suspicion_delta,
      hidden_event,
      mood,
      end_state: "continue",
      ending_type: "none",
      debug_reason: "local_fallback",
    };
  }

  function pushTurnHistory(userText, favor, suspicion, assistantRaw) {
    state.turnHistory.push({
      userPayload: JSON.stringify({
        turn: state.turn,
        max_turns: MAX_TURNS,
        favor,
        suspicion,
        user_message: userText,
      }),
      assistantRaw,
    });
    if (state.turnHistory.length > 4) state.turnHistory.shift();
  }

  async function onSend(text) {
    if (state.ended || state.mode !== "free" || !text.trim()) return;
    const userText = text.trim();
    const favorBefore = state.favor;
    const suspicionBefore = state.suspicion;

    hideCatBubble();
    setPlayerLast(userText);
    els.input.value = "";
    state.turn += 1;

    els.sendBtn.disabled = true;
    showThinkingBubble();

    let data;
    let offline = false;
    try {
      data = await callAi(userText);
    } catch (e) {
      console.warn(e);
      offline = true;
      data = localFallback(userText);
    }

    const intent = data.intent || "기타";
    if (data.hidden_event && data.hidden_event !== "none") {
      state.hiddenFlags.push(data.hidden_event);
    }
    if (data.mood) state.lastMood = data.mood;

    applyDeltas(data, intent);
    renderGauges();

    let reply = data.reply || "…";
    if (offline) reply = `(임시) ${reply}`;
    showCatBubble(reply);

    const assistantRaw = JSON.stringify(data);
    pushTurnHistory(userText, favorBefore, suspicionBefore, assistantRaw);
    state.messages.push({ role: "user", content: userText });
    state.messages.push({ role: "assistant", content: reply });

    const end = evaluateEndFree(data);
    if (end) showEnding(end, reply);
    else persistSave("game");
    els.sendBtn.disabled = state.ended;
    if (!state.ended) els.input.focus();
  }

  els.btnGoMode.addEventListener("click", showModeScreen);
  els.btnBackStart.addEventListener("click", showStartScreen);
  els.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.dataset.mode));
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    onSend(els.input.value);
  });

  els.resetBtn.addEventListener("click", showStartScreen);
  els.modalBtn.addEventListener("click", showStartScreen);

  initApp();
})();
