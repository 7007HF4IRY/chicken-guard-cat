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

  const CHOICE_FAIL =
    "집사는 믿을 수 없다옹. 인내심을 다 쓰게 했다옹. 이 치킨은 짐이 책임지고 먹겠다옹.";

  const CHOICE_ROUND_COUNT = 2;
  const CHOICE_ROUND_REWARD = ["닭 날개 획득!", "닭 다리 획득!"];
  const CHOICE_ROUND_CAT_MSG = [
    "…날개 한 쪽은… 기념으로 양보해 줄게옹. *(꼬리 살랑)* 다음은 더 어렵다옹!",
    "…다리는 짐 거지만, 같이 먹자는 말은 진심이었다옹. *(골골)* …완벽한 협상이었다옹!",
  ];
  const CHOICE_ROUND_HINT = [
    { roman: "I", label: "닭 날개", icon: "img/icons/chicken-wing.png" },
    { roman: "II", label: "닭 다리", icon: "img/icons/chicken-leg.png" },
  ];

  const SAVE_KEY = "chicken-cat-save-v1";
  const SAVE_VERSION = 1;
  const BGM_MUTE_KEY = "chicken-cat-bgm-muted";
  const BGM_VOLUME = 0.35;
  const START_CAT_SRC = "img/tired.png";
  const CLICK_SFX_VOLUME = 0.2;
  const CLICK_SFX_MS = 70;
  const PIXEL_SFX_VOLUME = 0.25;

  let sfxAudioCtx = null;
  let lastClickSfxAt = 0;
  let bgmTapHintEl = null;

  const els = {
    startScreen: document.getElementById("start-screen"),
    startCat: document.getElementById("start-cat"),
    modeScreen: document.getElementById("mode-screen"),
    gameShell: document.getElementById("game-shell"),
    btnGoMode: document.getElementById("btn-go-mode"),
    btnRules: document.getElementById("btn-rules"),
    rulesOverlay: document.getElementById("rules-overlay"),
    btnRulesClose: document.getElementById("btn-rules-close"),
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
    panelMain: document.querySelector(".panel-main"),
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
    choiceIntroOverlay: document.getElementById("choice-intro-overlay"),
    btnChoiceIntroGo: document.getElementById("btn-choice-intro-go"),
    choiceGameOver: document.getElementById("choice-game-over"),
    gameOverCat: document.getElementById("game-over-cat"),
    gameOverQuote: document.getElementById("game-over-quote"),
    btnRetryChoice: document.getElementById("btn-retry-choice"),
    btnGoMenu: document.getElementById("btn-go-menu"),
    choiceRoundClear: document.getElementById("choice-round-clear"),
    roundClearTitle: document.getElementById("round-clear-title"),
    roundClearPartIcon: document.getElementById("round-clear-part-icon"),
    roundClearCat: document.getElementById("round-clear-cat"),
    roundClearQuote: document.getElementById("round-clear-quote"),
    btnRoundClearNext: document.getElementById("btn-round-clear-next"),
    bgm: document.getElementById("game-bgm"),
    btnBgm: document.getElementById("btn-bgm"),
  };

  let state = createInitialState();
  let endedModal = null;
  let choicePickLocked = false;
  let persuadeReactionTimer = null;
  let lastReactionExpression = null;
  const PERSUADE_REACTION_MS = 1300;
  const EXPRESSION_CYCLE = ["tired", "sus", "int", "tsun", "love", "mad"];

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
      choicePackId: null,
      choiceTurnDeck: null,
      choiceTurnRunDeck: null,
      choiceTrapGameOver: false,
      choiceRound: 1,
      choiceRoundClearShown: false,
    };
  }

  function allChoiceTurnsFromPacks() {
    const packs = window.CHOICE_PACKS || [];
    const turns = [];
    for (const pack of packs) {
      for (const turn of pack.turns || []) {
        turns.push(turn);
      }
    }
    return turns;
  }

  const CHOICE_TURNS_PER_RUN = CHOICE_ROUND_COUNT * MAX_TURNS;

  function buildChoiceTurnRunDeck() {
    const pool = allChoiceTurnsFromPacks();
    const need = Math.min(CHOICE_TURNS_PER_RUN, pool.length);
    return shuffle(pool).slice(0, need);
  }

  function choiceTurnDeckForRound(runDeck, round) {
    const r = clamp(round, 1, CHOICE_ROUND_COUNT);
    const start = (r - 1) * MAX_TURNS;
    return (runDeck || []).slice(start, start + MAX_TURNS);
  }

  function ensureChoiceTurnRunDeck() {
    if (
      !Array.isArray(state.choiceTurnRunDeck) ||
      state.choiceTurnRunDeck.length < MAX_TURNS
    ) {
      state.choiceTurnRunDeck = buildChoiceTurnRunDeck();
    }
  }

  function syncChoiceTurnDeckForRound() {
    ensureChoiceTurnRunDeck();
    state.choiceTurnDeck = choiceTurnDeckForRound(
      state.choiceTurnRunDeck,
      state.choiceRound || 1
    );
    if (state.choiceTurnDeck.length < MAX_TURNS) {
      const extra = buildChoiceTurnRunDeck().filter(
        (t) => !state.choiceTurnDeck.includes(t)
      );
      while (
        state.choiceTurnDeck.length < MAX_TURNS &&
        extra.length > 0
      ) {
        state.choiceTurnDeck.push(extra.shift());
      }
    }
  }

  function ensureChoiceTurnDeck() {
    if (
      !Array.isArray(state.choiceTurnDeck) ||
      state.choiceTurnDeck.length !== MAX_TURNS
    ) {
      syncChoiceTurnDeckForRound();
    }
  }

  function getCurrentChoiceTurn() {
    ensureChoiceTurnDeck();
    return state.choiceTurnDeck[state.turn];
  }

  function updateChoiceRoundUi() {
    if (state.mode !== "choice") return;
    const round = state.choiceRound || 1;
    const idx = clamp(round, 1, CHOICE_ROUND_COUNT) - 1;
    const hint = CHOICE_ROUND_HINT[idx] || CHOICE_ROUND_HINT[0];
    els.gameHint.innerHTML = `<span class="round-hint">ROUND ${hint.roman}</span> ${hint.label} 획득하기! <img class="round-part-icon" src="${hint.icon}" width="22" height="22" alt="${hint.label}">`;
  }

  function showChoiceIntro() {
    els.choiceIntroOverlay.classList.add("show");
    els.choiceIntroOverlay.setAttribute("aria-hidden", "false");
  }

  function hideChoiceIntro() {
    els.choiceIntroOverlay.classList.remove("show");
    els.choiceIntroOverlay.setAttribute("aria-hidden", "true");
  }

  function beginChoicePlay() {
    hideChoiceIntro();
    renderChoiceTurn();
    persistSave("game");
  }

  function hideChoiceGameOver() {
    els.choiceGameOver.classList.remove("show");
    els.choiceGameOver.setAttribute("aria-hidden", "true");
  }

  function showChoiceGameOver(reply) {
    const firstShow = !els.choiceGameOver.classList.contains("show");
    if (els.gameOverCat && els.catImg) {
      els.gameOverCat.src = els.catImg.src;
    }
    if (els.gameOverQuote) {
      els.gameOverQuote.textContent = reply || els.catBubbleText.textContent || "";
    }
    els.choiceGameOver.classList.add("show");
    els.choiceGameOver.setAttribute("aria-hidden", "false");
    if (firstShow) playPixelGameOverSting();
  }

  function hideChoiceRoundClear() {
    stopFinalRoundClearFireworks();
    removeRoundClearPartIconSlot();
    if (!els.choiceRoundClear) return;
    els.choiceRoundClear.classList.remove("show", "is-final", "is-round-1-clear");
    els.choiceRoundClear.setAttribute("aria-hidden", "true");
  }

  function removeRoundClearPartIconSlot() {
    const bounce = els.roundClearTitle?.closest(".round-clear-title-bounce");
    bounce?.querySelector(".round-clear-part-icon-slot")?.remove();
    els.roundClearPartIcon = null;
  }

  function mountRoundClearPartIconSlot(iconSrc) {
    if (!iconSrc || !els.roundClearTitle) return;
    const bounce = els.roundClearTitle.closest(".round-clear-title-bounce");
    if (!bounce) return;
    removeRoundClearPartIconSlot();
    const slot = document.createElement("div");
    slot.className = "round-clear-part-icon-slot";
    slot.setAttribute("aria-hidden", "true");
    const img = document.createElement("img");
    img.id = "round-clear-part-icon";
    img.className = "round-clear-part-icon";
    img.alt = "";
    img.width = 96;
    img.height = 96;
    img.src = iconSrc;
    slot.appendChild(img);
    bounce.insertBefore(slot, els.roundClearTitle);
    els.roundClearPartIcon = img;
  }

  function showChoiceRoundClear() {
    const firstShow = !state.choiceRoundClearShown;
    if (firstShow) playPixelRoundClearFanfare();
    const round = Number(state.choiceRound) || 1;
    const idx = round - 1;
    const isFinal = round >= CHOICE_ROUND_COUNT;
    const hint = CHOICE_ROUND_HINT[idx] || CHOICE_ROUND_HINT[0];
    const hideRoundPartIcon = idx === 0;
    if (els.roundClearTitle) {
      els.roundClearTitle.textContent =
        CHOICE_ROUND_REWARD[idx] || CHOICE_ROUND_REWARD[0];
    }
    if (hideRoundPartIcon) {
      removeRoundClearPartIconSlot();
    } else {
      mountRoundClearPartIconSlot(hint.icon);
    }
    const catSrc = els.catImg?.src || "img/love.png";
    if (els.roundClearCat) {
      els.roundClearCat.src = catSrc.includes("mad") ? "img/love.png" : catSrc;
    }
    if (els.roundClearQuote) {
      els.roundClearQuote.textContent =
        CHOICE_ROUND_CAT_MSG[idx] || els.catBubbleText.textContent || "";
    }
    if (els.btnRoundClearNext) {
      els.btnRoundClearNext.textContent = isFinal
        ? "-치킨 협상 성공!-"
        : "다음 라운드로";
    }
    if (els.choiceRoundClear) {
      els.choiceRoundClear.classList.toggle("is-final", isFinal);
      els.choiceRoundClear.classList.toggle("is-round-1-clear", hideRoundPartIcon);
      els.choiceRoundClear.classList.add("show");
      els.choiceRoundClear.setAttribute("aria-hidden", "false");
      if (isFinal) {
        requestAnimationFrame(() => startFinalRoundClearFireworks());
      }
    }
    state.choiceRoundClearShown = true;
    state.ended = true;
    disableChoiceButtons();
    persistSave("game");
  }

  function beginNextChoiceRound() {
    hideChoiceRoundClear();
    state.choiceRound = (state.choiceRound || 1) + 1;
    state.turn = 0;
    state.favor = INITIAL.favor;
    state.suspicion = INITIAL.suspicion;
    state.ended = false;
    state.choiceAllPersuade = true;
    state.choiceRoundClearShown = false;
    syncChoiceTurnDeckForRound();
    choicePickLocked = false;
    lastReactionExpression = null;
    renderGauges();
    updateChoiceRoundUi();
    renderChoiceTurn();
    persistSave("game");
  }

  function onRoundClearPrimaryClick() {
    const round = state.choiceRound || 1;
    if (round >= CHOICE_ROUND_COUNT) {
      hideChoiceRoundClear();
      showStartScreen();
      return;
    }
    beginNextChoiceRound();
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function pickExpressionFromGauges() {
    if (state.suspicion >= 61) return "mad";
    if (state.favor >= 81) return "love";
    if (state.favor >= 61) return "tsun";
    if (state.favor >= 31) return "int";
    if (state.suspicion >= 31) return "sus";
    return "tired";
  }

  function pickExpression() {
    if (state.lastMood && MOOD_SPRITE[state.lastMood]) {
      return MOOD_SPRITE[state.lastMood];
    }
    return pickExpressionFromGauges();
  }

  function pickDistinctExpression(avoid) {
    const fromGauges = pickExpressionFromGauges();
    if (fromGauges !== avoid) return fromGauges;
    const alts = EXPRESSION_CYCLE.filter((e) => e !== avoid);
    return alts[state.turn % alts.length];
  }

  function applyChoiceTurnCatExpression() {
    let expression = pickExpression();
    if (lastReactionExpression && expression === lastReactionExpression) {
      expression = pickDistinctExpression(lastReactionExpression);
    }
    lastReactionExpression = null;
    if (els.catImg) {
      els.catImg.src = `img/${expression}.png`;
    }
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

    const expression = pickExpression();
    if (els.catImg) {
      els.catImg.src = `img/${expression}.png`;
    }
  }

  function setReactionFocus(on) {
    document.body.classList.toggle("is-reaction-focus", on);
    if (els.panelMain) {
      els.panelMain.classList.toggle("is-reaction-focus", on);
    }
  }

  function clearPersuadeReactionVisuals() {
    els.catBubble.classList.remove("is-sparkle");
    setReactionFocus(false);
  }

  function clearPersuadeReactionTimer() {
    if (persuadeReactionTimer) {
      clearTimeout(persuadeReactionTimer);
      persuadeReactionTimer = null;
    }
    clearPersuadeReactionVisuals();
  }

  function hideCatBubble() {
    els.catBubble.classList.add("is-hidden");
    els.catBubbleText.textContent = "";
    clearPersuadeReactionVisuals();
  }

  function showCatBubble(text, { sparkle = false } = {}) {
    els.catBubbleText.textContent = text;
    els.catBubble.classList.remove("is-hidden");
    els.catBubble.classList.remove("is-thinking");
    els.catBubble.classList.toggle("is-sparkle", sparkle);
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
      choiceTrapGameOver: state.choiceTrapGameOver,
      choiceRoundClearShown: state.choiceRoundClearShown,
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
                choicePackId: state.choicePackId,
                choiceTurnDeck: state.choiceTurnDeck,
                choiceTurnRunDeck: state.choiceTurnRunDeck,
                choiceTrapGameOver: state.choiceTrapGameOver,
                choiceRound: state.choiceRound,
                choiceRoundClearShown: state.choiceRoundClearShown,
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
    if (state.mode === "choice") {
      if (!state.choiceRound) state.choiceRound = 1;
      state.choiceRound = clamp(state.choiceRound, 1, CHOICE_ROUND_COUNT);
      syncChoiceTurnDeckForRound();
    }

    els.startScreen.classList.add("is-hidden");
    els.modeScreen.classList.add("is-hidden");
    els.modeScreen.setAttribute("aria-hidden", "true");
    els.gameShell.classList.remove("is-hidden");
    els.gameShell.setAttribute("aria-hidden", "false");
    els.overlay.classList.remove("show");

    setModeUi(state.mode);
    restoreUi(packet.ui);
    renderGauges();

    if (state.ended && state.choiceTrapGameOver) {
      disableChoiceButtons();
      showChoiceGameOver();
      return;
    }

    if (
      state.mode === "choice" &&
      state.ended &&
      state.choiceRoundClearShown
    ) {
      disableChoiceButtons();
      showChoiceRoundClear();
      return;
    }

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
      state.choiceRound = state.choiceRound || 1;
      syncChoiceTurnDeckForRound();
      updateChoiceRoundUi();
      renderChoiceTurn();
    } else {
      checkApi();
      els.input.disabled = false;
      els.sendBtn.disabled = false;
      els.input.focus();
    }
  }

  const FW_PARTICLE_COLORS = [
    "#ff4048",
    "#ffb020",
    "#ffe066",
    "#fff59a",
    "#5ce1ff",
    "#ff6eb4",
    "#7dff9a",
  ];

  const FW_PARTICLES_READY_KEY = "5";

  function initRoundClearFireworkParticles() {
    const root = document.getElementById("round-clear-fireworks");
    if (!root || root.dataset.particlesReady === FW_PARTICLES_READY_KEY) return;

    root.querySelectorAll(".fw-particle").forEach((el) => el.remove());

    const perBurst = 52;
    root.querySelectorAll(".fw-burst").forEach((burst, burstIdx) => {
      const site = burst.closest(".fw-site");
      const flip = site?.classList.contains("fw-site--br") ? -1 : 1;
      const burstOffset = burstIdx * 0.04;

      const fanCenters = [15, 32.5, 50, 67.5, 85];
      const fanSpread = 16;
      const groupSize = Math.ceil(perBurst / fanCenters.length);

      for (let i = 0; i < perBurst; i += 1) {
        const span = document.createElement("span");
        span.className = "fw-particle";
        span.setAttribute("aria-hidden", "true");

        const group = i % fanCenters.length;
        const idxInGroup = Math.floor(i / fanCenters.length);
        const t = groupSize > 1 ? idxInGroup / (groupSize - 1) : 0.5;
        const fan =
          fanCenters[group] +
          (t - 0.5) * fanSpread +
          ((i % 5) - 2) * 1.5;
        const rad = (fan * Math.PI) / 180;
        const dist =
          148 + (i % 7) * 34 + (burstIdx % 2) * 28 + (i % 5) * 8 + (i % 11) * 6;
        const ex = Math.round(Math.cos(rad) * dist * flip);
        const ey = Math.round(-Math.sin(rad) * dist - (i % 4) * 14 - 12);

        const color = FW_PARTICLE_COLORS[i % FW_PARTICLE_COLORS.length];
        span.style.setProperty("--ex", `${ex}px`);
        span.style.setProperty("--ey", `${ey}px`);
        span.style.setProperty(
          "--fw-delay",
          `${(burstOffset + (i % 11) * 0.0025 + group * 0.004).toFixed(3)}s`
        );
        span.style.setProperty("--fw-color", color);
        span.style.background = color;
        burst.appendChild(span);
      }
    });

    root.dataset.particlesReady = FW_PARTICLES_READY_KEY;
  }

  function stopFinalRoundClearFireworks() {
    const root = document.getElementById("round-clear-fireworks");
    if (!root) return;
    root.querySelectorAll(".fw-particle").forEach((el) => {
      el.style.animation = "none";
    });
  }

  function startFinalRoundClearFireworks() {
    const panel = els.choiceRoundClear;
    if (
      !panel?.classList.contains("show") ||
      !panel.classList.contains("is-final")
    ) {
      return;
    }
    const root = document.getElementById("round-clear-fireworks");
    if (!root) return;
    root.querySelectorAll(".fw-particle").forEach((el) => {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });
  }

  function ensureSfxAudioContext() {
    if (sfxAudioCtx) return sfxAudioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    sfxAudioCtx = new Ctx();
    return sfxAudioCtx;
  }

  function playPixelClick() {
    const ctx = ensureSfxAudioContext();
    if (!ctx) return;
    resumeSfxContext(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.025);
    gain.gain.setValueAtTime(CLICK_SFX_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + CLICK_SFX_MS / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + CLICK_SFX_MS / 1000 + 0.01);
  }

  function resumeSfxContext(ctx) {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  function playPixelPersuadeChime() {
    const ctx = ensureSfxAudioContext();
    if (!ctx) return;
    resumeSfxContext(ctx);
    const now = ctx.currentTime;
    const freqs = [740, 988, 1175, 1568];
    const step = 0.052;
    freqs.forEach((freq, i) => {
      const t = now + i * step;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(PIXEL_SFX_VOLUME * 0.45, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  function playPixelRoundClearFanfare() {
    const ctx = ensureSfxAudioContext();
    if (!ctx) return;
    resumeSfxContext(ctx);
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, at: 0, len: 0.09, wave: "triangle" },
      { freq: 659.25, at: 0.09, len: 0.09, wave: "triangle" },
      { freq: 783.99, at: 0.18, len: 0.11, wave: "square" },
      { freq: 1046.5, at: 0.32, len: 0.16, wave: "square" },
    ];
    notes.forEach(({ freq, at, len, wave }) => {
      const t = now + at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(PIXEL_SFX_VOLUME, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t + len);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len + 0.02);
    });
  }

  function playPixelGameOverSting() {
    const ctx = ensureSfxAudioContext();
    if (!ctx) return;
    resumeSfxContext(ctx);
    const now = ctx.currentTime;
    const notes = [
      { freq: 493.88, at: 0, len: 0.2, wave: "square", slide: 0.9 },
      { freq: 440.0, at: 0.17, len: 0.2, wave: "square", slide: 0.9 },
      { freq: 369.99, at: 0.34, len: 0.22, wave: "square", slide: 0.88 },
      { freq: 311.13, at: 0.52, len: 0.26, wave: "sawtooth", slide: 0.82 },
      { freq: 246.94, at: 0.74, len: 0.42, wave: "sawtooth", slide: 0.75 },
    ];
    notes.forEach(({ freq, at, len, wave, slide }) => {
      const t = now + at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * slide, t + len * 0.92);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(PIXEL_SFX_VOLUME * 0.5, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + len);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len + 0.03);
    });
  }

  function initButtonClickSfx() {
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const btn = e.target.closest("button");
        if (!btn || btn.disabled) return;
        const t = performance.now();
        if (t - lastClickSfxAt < 90) return;
        lastClickSfxAt = t;
        playPixelClick();
      },
      { capture: true, passive: true }
    );
  }

  function syncBgmButton() {
    if (!els.btnBgm) return;
    const muted = localStorage.getItem(BGM_MUTE_KEY) === "1";
    const label = els.btnBgm.querySelector(".bgm-toggle-label");
    if (label) label.textContent = muted ? "OFF" : "ON";
    els.btnBgm.classList.toggle("bgm-toggle--muted", muted);
    els.btnBgm.setAttribute("aria-label", muted ? "BGM 켜기" : "BGM 끄기");
    els.btnBgm.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  function hideBgmTapHint() {
    if (!bgmTapHintEl) return;
    bgmTapHintEl.remove();
    bgmTapHintEl = null;
  }

  function showBgmTapHint() {
    if (bgmTapHintEl || localStorage.getItem(BGM_MUTE_KEY) === "1") return;
    bgmTapHintEl = document.createElement("p");
    bgmTapHintEl.className = "bgm-tap-hint";
    bgmTapHintEl.setAttribute("role", "status");
    bgmTapHintEl.textContent = "탭하면 음악 재생";
    document.body.appendChild(bgmTapHintEl);
  }

  function tryPlayBgm() {
    if (!els.bgm || localStorage.getItem(BGM_MUTE_KEY) === "1") return;
    els.bgm.volume = BGM_VOLUME;
    const playPromise = els.bgm.play();
    if (!playPromise) return;
    playPromise
      .then(() => hideBgmTapHint())
      .catch(() => showBgmTapHint());
  }

  function toggleBgm() {
    if (!els.bgm) return;
    const muted = localStorage.getItem(BGM_MUTE_KEY) === "1";
    if (muted) {
      localStorage.setItem(BGM_MUTE_KEY, "0");
      tryPlayBgm();
    } else {
      localStorage.setItem(BGM_MUTE_KEY, "1");
      els.bgm.pause();
      hideBgmTapHint();
    }
    syncBgmButton();
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol === "file:") return;
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  function initPwaAndSfx() {
    initButtonClickSfx();
    syncBgmButton();
    if (els.btnBgm) {
      els.btnBgm.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBgm();
      });
    }
    tryPlayBgm();
    document.body.addEventListener(
      "pointerdown",
      () => tryPlayBgm(),
      { once: true, passive: true }
    );
    registerServiceWorker();
  }

  function initApp() {
    initPwaAndSfx();
    bindConnectivityStatus();
    initRoundClearFireworkParticles();
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

  function ensureStartCatTired() {
    if (els.startCat) els.startCat.src = START_CAT_SRC;
  }

  function showStartScreen() {
    clearPersuadeReactionTimer();
    lastReactionExpression = null;
    choicePickLocked = false;
    clearSave();
    state = createInitialState();
    hideChoiceGameOver();
    hideChoiceRoundClear();
    hideChoiceIntro();
    ensureStartCatTired();
    els.gameShell.classList.add("is-hidden");
    els.gameShell.setAttribute("aria-hidden", "true");
    els.modeScreen.classList.add("is-hidden");
    els.modeScreen.setAttribute("aria-hidden", "true");
    els.startScreen.classList.remove("is-hidden");
    els.startScreen.setAttribute("aria-hidden", "false");
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
    if (!isChoice) {
      els.gameHint.textContent = "설득 80↑ · 인내심 60↑ · 실패 10↓";
    }
    els.apiStatus.classList.toggle("is-hidden", isChoice);
  }

  function startGame(mode, options = {}) {
    clearPersuadeReactionTimer();
    lastReactionExpression = null;
    choicePickLocked = false;
    state = createInitialState();
    hideChoiceGameOver();
    hideChoiceRoundClear();
    hideChoiceIntro();
    state.mode = mode;
    if (mode === "choice") {
      state.choiceRound = 1;
      state.choiceRoundClearShown = false;
      state.choiceTurnRunDeck = buildChoiceTurnRunDeck();
      syncChoiceTurnDeckForRound();
    }
    const skipChoiceIntro = Boolean(options.skipChoiceIntro);
    els.modeScreen.classList.add("is-hidden");
    els.gameShell.classList.remove("is-hidden");
    els.gameShell.setAttribute("aria-hidden", "false");
    setModeUi(mode);
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    setPlayerLast("");
    renderGauges();
    if (mode === "choice") {
      updateChoiceRoundUi();
      if (skipChoiceIntro) {
        renderChoiceTurn();
      } else {
        showChoiceIntro();
      }
    } else {
      showCatBubble(OPENING);
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
    applyChoiceTurnCatExpression();
    const deck = getCurrentChoiceTurn();
    if (!deck) return;
    showCatBubble(deck.clue);
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
    if (state.ended || state.mode !== "choice" || choicePickLocked) return;
    choicePickLocked = true;
    clearPersuadeReactionTimer();
    disableChoiceButtons();
    state.turn += 1;
    setPlayerLast(opt.label);
    if (opt.type === "trap") {
      state.choiceAllPersuade = false;
      if (opt.mood) state.lastMood = opt.mood;
      applyDeltas(opt, opt.type);
      state.suspicion = 100;
      renderGauges();
      showCatBubble(opt.reply);
      state.ended = true;
      state.choiceTrapGameOver = true;
      showChoiceGameOver(opt.reply);
      persistSave("game");
      return;
    }
    if (opt.type === "persuade") playPixelPersuadeChime();
    if (opt.mood) state.lastMood = opt.mood;
    applyDeltas(opt, opt.type);
    renderGauges();
    lastReactionExpression = pickExpression();
    showCatBubble(opt.reply, { sparkle: true });
    setReactionFocus(true);
    persistSave("game");

    persuadeReactionTimer = setTimeout(() => {
      persuadeReactionTimer = null;
      clearPersuadeReactionVisuals();
      if (state.turn >= MAX_TURNS) {
        const win = state.choiceAllPersuade;
        if (win) {
          showChoiceRoundClear();
        } else {
          showEnding({ type: "fail" }, CHOICE_FAIL);
        }
        return;
      }
      choicePickLocked = false;
      renderChoiceTurn();
    }, PERSUADE_REACTION_MS);
  }

  const CHAT_FETCH_MS = 12000;

  function isOfflineForChat() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  }

  function setApiStatusLocal() {
    els.apiStatus.textContent = "LOCAL";
    els.apiStatus.className = "status-pill offline";
  }

  function setApiStatusAiOn() {
    els.apiStatus.textContent = "AI ON";
    els.apiStatus.className = "status-pill online";
  }

  function setApiStatusAiOff() {
    els.apiStatus.textContent = "AI OFF";
    els.apiStatus.className = "status-pill offline";
  }

  async function checkApi() {
    if (isOfflineForChat()) {
      setApiStatusLocal();
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const r = await fetch("/api/health", { signal: controller.signal });
      clearTimeout(timer);
      const j = await r.json();
      if (j.hasKey) setApiStatusAiOn();
      else setApiStatusAiOff();
    } catch {
      setApiStatusLocal();
    }
  }

  function bindConnectivityStatus() {
    window.addEventListener("online", () => {
      if (state.mode === "free" && !state.ended) checkApi();
    });
    window.addEventListener("offline", () => {
      if (state.mode === "free") setApiStatusLocal();
    });
  }

  async function callAi(userText) {
    if (isOfflineForChat()) {
      throw new Error("offline");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHAT_FETCH_MS);

    let r;
    try {
      r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
    } finally {
      clearTimeout(timer);
    }

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
    } else if (/치킨|닭|양념|후라이드|간장|마늘/.test(userText)) {
      intent = "공유제안";
      favor_delta = 14;
      suspicion_delta = 6;
      mood = "흥미";
      reply =
        "…그 향기는 짐도 안다옹. *(코를 킁)* …한 조각만 양보하면 생각해 볼게옹.";
    } else if (/미안|사과|잘못|죄송/.test(userText)) {
      intent = "감정호소";
      favor_delta = 12;
      suspicion_delta = -10;
      mood = "츤데레";
      reply = "…흥, 알았다옹. *(귀가 살짝 뒤로)* …다음엔 먼저 물어봐라옹.";
    } else if (/협박| 때리|뺏|빼앗|죽여|잡아/.test(userText)) {
      intent = "협박";
      favor_delta = -18;
      suspicion_delta = 22;
      mood = "폭발";
      reply = "…감히? *(등 털 세움)* 이 박스는 짐의 성역이다옹!!";
    } else if (/안녕|하이|헬로|냥/.test(userText) && userText.length <= 12) {
      intent = "기타";
      favor_delta = 4;
      suspicion_delta = -2;
      mood = "귀찮음";
      reply = "…또 왔냐옹. *(꼬리 한 번 흔듦)* 말은 짧게, 치킨은 짐 거다옹.";
    }

    const defaultReply =
      "…뭐라는 거냐옹? *(귀를 살짝 돌림)* 짐은 바쁘다옹.";
    if (intent === "기타" && reply === defaultReply) {
      const genericPool = [
        "…하품~ 짐은 바쁘다옹. *(박스 위를 지킴)*",
        "…설득? *(눈을 가늘게)* 짐은 이미 결론 냈다옹.",
        "…*(귀를 한 번 튕김)* 다른 카드 없냐옹?",
        "…집사 목소리가 너무 크다옹. 조용히 협상하라옹.",
      ];
      reply = genericPool[state.turn % genericPool.length];
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
    try {
      data = await callAi(userText);
    } catch (e) {
      console.warn(e);
      data = localFallback(userText);
      setApiStatusLocal();
    }

    const intent = data.intent || "기타";
    if (data.hidden_event && data.hidden_event !== "none") {
      state.hiddenFlags.push(data.hidden_event);
    }
    if (data.mood) state.lastMood = data.mood;

    applyDeltas(data, intent);
    renderGauges();

    const reply = data.reply || "…";
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

  function openRules() {
    els.rulesOverlay.classList.add("show");
    els.rulesOverlay.setAttribute("aria-hidden", "false");
  }

  function closeRules() {
    els.rulesOverlay.classList.remove("show");
    els.rulesOverlay.setAttribute("aria-hidden", "true");
  }

  els.btnGoMode.addEventListener("click", showModeScreen);
  els.btnRules.addEventListener("click", openRules);
  els.btnRulesClose.addEventListener("click", closeRules);
  els.btnBackStart.addEventListener("click", showStartScreen);

  function goToStartFromGameOver() {
    hideChoiceGameOver();
    showStartScreen();
  }

  els.btnChoiceIntroGo.addEventListener("click", beginChoicePlay);
  if (els.btnRoundClearNext) {
    els.btnRoundClearNext.addEventListener("click", onRoundClearPrimaryClick);
  }
  els.btnRetryChoice.addEventListener("click", () =>
    startGame("choice", { skipChoiceIntro: true })
  );
  els.btnGoMenu.addEventListener("click", goToStartFromGameOver);
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
