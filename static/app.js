const EXAM_DATE = new Date("2026-05-20T00:00:00");
const ALL_TOPICS = "Mixed Review";

const MODES = {
  ton: {
    title: "Kruts' Ton Review",
    eyebrow: "CFA Level 2 · Queen Charlotte is watching",
    subhead: "Kruts wins approval by surviving CFA traps with poise, speed, and just enough scandal.",
    setupCopy: "Pick a deck. Lady Whistledown will publish every miss in Kruts' review sheet.",
    preview: "Approval meter, gossip-sheet review, and society-level pressure.",
    emptyTitle: "Kruts, the social season begins.",
    emptyCopy: "A polished answer earns approval. A shaky one becomes tomorrow's review target.",
    scene: "assets/regency-scene.svg",
    sticker: "assets/regency-sticker.svg",
    character: "Lady Whistledown",
    meter: "Queen's Approval",
    resultEyebrow: "Kruts' Review Sheet",
    music: { notes: [392, 494, 587, 784, 587, 494], interval: 430, type: "triangle" },
    correct: [
      "Queen Charlotte approves.",
      "Lady Danbury gives the smallest possible nod.",
      "The ballroom survives another turn."
    ],
    wrong: [
      "Lady Whistledown has ink on the page.",
      "Lady Danbury raises one eyebrow.",
      "The ton has noticed the lapse."
    ],
    clean: "No scandal to report. This deck exits the ballroom untouched.",
  },
  boss: {
    title: "Kruts' Boss Rush",
    eyebrow: "CFA Level 2 · Topic bosses unlocked",
    subhead: "Kruts crushes valuation beasts, accounting phantoms, and derivative traps before the timer wins.",
    setupCopy: "Every correct answer damages the boss. Misses let it recover.",
    preview: "HP bar, arena pressure, and topic bosses that punish weak concepts.",
    emptyTitle: "Kruts, the arena is open.",
    emptyCopy: "Pick a boss, enter the pit, and turn weak concepts into defeated HP bars.",
    scene: "assets/boss-scene.svg",
    sticker: "assets/boss-sticker.svg",
    character: "The Curriculum Boss",
    meter: "Boss HP",
    resultEyebrow: "Kruts' Battle Report",
    music: { notes: [98, 147, 196, 147, 123, 185], interval: 300, type: "sawtooth" },
    correct: [
      "Direct hit.",
      "Critical concept strike.",
      "The boss staggers."
    ],
    wrong: [
      "The boss counters.",
      "That trap had armor.",
      "The arena punishes hesitation."
    ],
    clean: "Flawless run. The boss never landed a hit.",
  },
  lightning: {
    title: "Kruts Lightning",
    eyebrow: "CFA Level 2 · Speed drill",
    subhead: "Fast answers, streak pressure, instant corrections, no ceremonial nonsense.",
    setupCopy: "Short timer. Streaks matter. Explanations stay sharp.",
    preview: "Fast timer, streak meter, and no room for sleepy guesses.",
    emptyTitle: "Kruts, the clock is already rude.",
    emptyCopy: "Pick a deck and move fast. Recognition speed is the whole point.",
    scene: "assets/lightning-scene.svg",
    sticker: "assets/lightning-sticker.svg",
    character: "Streak Engine",
    meter: "Current Streak",
    resultEyebrow: "Kruts' Speed Report",
    music: { notes: [220, 330, 440, 660, 880, 660], interval: 180, type: "square" },
    correct: [
      "Clean hit.",
      "Fast and correct.",
      "Streak holds."
    ],
    wrong: [
      "Streak reset.",
      "Too fast for that trap.",
      "Correction logged."
    ],
    clean: "No misses. The streak engine is warm.",
  },
};

const TOPIC_CHARACTERS = {
  "Alternatives": "Lady Danbury's Deal Room",
  "Corporate Issuers": "Anthony's Capital Council",
  "Derivatives": "The Options Duelist",
  "Economics": "Colin's Currency Tour",
  "Equity": "The Viscount of Valuation",
  "Ethics": "Queen Charlotte's Court",
  "Fixed Income": "The Duration Duke",
  "FRA": "The Accounting Matriarch",
  "Portfolio": "Penelope's Active Bets",
  "Quant": "Eloise's Regression Lab",
};

const STORAGE_KEY = "cfaSprintProgress.v1";

const DEFAULT_PROGRESS = {
  bestPercent: 0,
  bestPoints: 0,
  bestStreak: 0,
  dailyDate: "",
  dailyStreak: 0,
  dailyRuns: 0,
  clearedBosses: [],
  seenQuestions: [],
};

const STREAK_TITLES = [
  { min: 8, label: "Exam Demon" },
  { min: 5, label: "Analyst Mode" },
  { min: 3, label: "Kruts Mode" },
  { min: 2, label: "Locked In" },
];

const MODE_RULES = {
  ton: "Confidence wagers: Double earns big approval, but a miss becomes scandal.",
  boss: "Topic bosses counter wrong answers with time and point attacks.",
  lightning: "Fast answers keep the combo alive; slow correct answers break momentum.",
};

const BOSS_TRAITS = {
  "Alternatives": { attack: "Illiquidity crush", timePenalty: 8, pointPenalty: 35 },
  "Corporate Issuers": { attack: "Capital drain", timePenalty: 8, pointPenalty: 40 },
  "Derivatives": { attack: "Gamma snap", timePenalty: 14, pointPenalty: 25 },
  "Economics": { attack: "Currency shock", timePenalty: 16, pointPenalty: 20 },
  "Equity": { attack: "Valuation trap", timePenalty: 10, pointPenalty: 35 },
  "Ethics": { attack: "Standards violation", timePenalty: 10, pointPenalty: 45 },
  "Fixed Income": { attack: "Duration hit", timePenalty: 14, pointPenalty: 25 },
  "FRA": { attack: "Accounting fog", timePenalty: 12, pointPenalty: 30 },
  "Portfolio": { attack: "Tracking-error spike", timePenalty: 10, pointPenalty: 35 },
  "Quant": { attack: "Regression noise", timePenalty: 12, pointPenalty: 30 },
};

const state = {
  deck: [],
  index: 0,
  score: 0,
  points: 0,
  streak: 0,
  maxStreak: 0,
  answered: false,
  finished: false,
  topic: ALL_TOPICS,
  mode: "ton",
  selectedLength: 8,
  runKind: "custom",
  missed: [],
  currentChoices: [],
  lastDeck: [],
  lastMisses: [],
  secondsLeft: 0,
  timerId: null,
  autoAdvanceId: null,
  flashId: null,
  questionStartedAt: 0,
  gameValue: 0,
  stake: "steady",
  hintsLeft: 1,
  eliminatesLeft: 1,
  usedHintThisQuestion: false,
  usedEliminateThisQuestion: false,
  progression: { ...DEFAULT_PROGRESS },
};

const audio = {
  enabled: false,
  context: null,
  master: null,
  musicTimer: null,
  beat: 0,
};

const els = {
  fxLayer: document.querySelector("#fxLayer"),
  modeEyebrow: document.querySelector("#modeEyebrow"),
  heroTitle: document.querySelector("#heroTitle"),
  heroSubhead: document.querySelector("#heroSubhead"),
  daysLeft: document.querySelector("#daysLeft"),
  daysLabel: document.querySelector("#daysLabel"),
  setupTitle: document.querySelector("#setupTitle"),
  setupCopy: document.querySelector("#setupCopy"),
  modeSelect: document.querySelector("#modeSelect"),
  modePreview: document.querySelector("#modePreview"),
  modePreviewKicker: document.querySelector("#modePreviewKicker"),
  modePreviewTitle: document.querySelector("#modePreviewTitle"),
  modePreviewCopy: document.querySelector("#modePreviewCopy"),
  bestScoreStat: document.querySelector("#bestScoreStat"),
  bestStreakStat: document.querySelector("#bestStreakStat"),
  dailyStat: document.querySelector("#dailyStat"),
  clearedBossesStat: document.querySelector("#clearedBossesStat"),
  topicSelect: document.querySelector("#topicSelect"),
  lengthSelect: document.querySelector("#lengthSelect"),
  musicBtn: document.querySelector("#musicBtn"),
  startBtn: document.querySelector("#startBtn"),
  emptyState: document.querySelector("#emptyState"),
  sceneImage: document.querySelector("#sceneImage"),
  emptySticker: document.querySelector("#emptySticker"),
  characterName: document.querySelector("#characterName"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyCopy: document.querySelector("#emptyCopy"),
  quizCard: document.querySelector("#quizCard"),
  topicBadge: document.querySelector("#topicBadge"),
  quizSceneImage: document.querySelector("#quizSceneImage"),
  moodSticker: document.querySelector("#moodSticker"),
  quizCharacterName: document.querySelector("#quizCharacterName"),
  sceneStatus: document.querySelector("#sceneStatus"),
  scoreChip: document.querySelector("#scoreChip"),
  streakChip: document.querySelector("#streakChip"),
  pointsChip: document.querySelector("#pointsChip"),
  roundTimer: document.querySelector("#roundTimer"),
  questionCounter: document.querySelector("#questionCounter"),
  progressBar: document.querySelector("#progressBar"),
  gameMeter: document.querySelector("#gameMeter"),
  meterLabel: document.querySelector("#meterLabel"),
  meterValue: document.querySelector("#meterValue"),
  streakBanner: document.querySelector("#streakBanner"),
  roundFlash: document.querySelector("#roundFlash"),
  caseBlock: document.querySelector("#caseBlock"),
  questionText: document.querySelector("#questionText"),
  steadyBtn: document.querySelector("#steadyBtn"),
  doubleBtn: document.querySelector("#doubleBtn"),
  hintBtn: document.querySelector("#hintBtn"),
  eliminateBtn: document.querySelector("#eliminateBtn"),
  powerHint: document.querySelector("#powerHint"),
  answers: document.querySelector("#answers"),
  feedback: document.querySelector("#feedback"),
  nextBtn: document.querySelector("#nextBtn"),
  resultsCard: document.querySelector("#resultsCard"),
  resultsEyebrow: document.querySelector("#resultsEyebrow"),
  scoreText: document.querySelector("#scoreText"),
  rankBadge: document.querySelector("#rankBadge"),
  scoreNote: document.querySelector("#scoreNote"),
  reviewList: document.querySelector("#reviewList"),
  revengeBtn: document.querySelector("#revengeBtn"),
  retryBtn: document.querySelector("#retryBtn"),
  newDeckBtn: document.querySelector("#newDeckBtn"),
};

function html(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function currentMode() {
  return MODES[state.mode];
}

function todayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function yesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
}

function loadProgression() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.progression = {
      ...DEFAULT_PROGRESS,
      ...saved,
      clearedBosses: Array.isArray(saved.clearedBosses) ? saved.clearedBosses : [],
      seenQuestions: Array.isArray(saved.seenQuestions) ? saved.seenQuestions : [],
    };
  } catch {
    state.progression = { ...DEFAULT_PROGRESS };
  }
  if (![todayKey(), yesterdayKey()].includes(state.progression.dailyDate)) {
    state.progression.dailyStreak = 0;
    state.progression.dailyRuns = 0;
  } else if (state.progression.dailyDate !== todayKey()) {
    state.progression.dailyRuns = 0;
  }
}

function saveProgression() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progression));
  } catch {
    // Progression is nice to have; the quiz should still work if storage is blocked.
  }
}

function updateProgressPanel() {
  const progress = state.progression;
  els.bestScoreStat.textContent = progress.bestPercent
    ? `${progress.bestPercent}% · ${progress.bestPoints} pts`
    : "No runs yet";
  els.bestStreakStat.textContent = `${progress.bestStreak}x`;
  els.dailyStat.textContent = `${progress.dailyStreak} ${progress.dailyStreak === 1 ? "day" : "days"} · ${progress.dailyRuns} today`;
  els.clearedBossesStat.textContent = `${progress.clearedBosses.length} cleared`;
}

function recordProgression(percent) {
  const progress = state.progression;
  if (percent > progress.bestPercent || (percent === progress.bestPercent && state.points > progress.bestPoints)) {
    progress.bestPercent = percent;
    progress.bestPoints = state.points;
  }
  progress.bestStreak = Math.max(progress.bestStreak, state.maxStreak);
  if (progress.dailyDate === todayKey()) {
    progress.dailyRuns += 1;
  } else if (progress.dailyDate === yesterdayKey()) {
    progress.dailyDate = todayKey();
    progress.dailyStreak += 1;
    progress.dailyRuns = 1;
  } else {
    progress.dailyDate = todayKey();
    progress.dailyStreak = 1;
    progress.dailyRuns = 1;
  }
  if (state.mode === "boss" && state.topic !== ALL_TOPICS && percent >= 75 && !progress.clearedBosses.includes(state.topic)) {
    progress.clearedBosses.push(state.topic);
    progress.clearedBosses.sort();
  }
  saveProgression();
  updateProgressPanel();
}

function updateCountdown() {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.ceil((EXAM_DATE - startOfToday) / msPerDay));
  els.daysLeft.textContent = String(days);
  els.daysLabel.textContent = days === 1 ? "day left" : "days left";
}

function populateTopics() {
  const options = [ALL_TOPICS, ...topicOptions()];
  els.topicSelect.innerHTML = options
    .map((topic) => `<option value="${html(topic)}">${html(topic)}</option>`)
    .join("");
}

function topicOptions() {
  return [...new Set(window.CFA_QUESTIONS.map((q) => q.topic))].sort();
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function roundSeconds() {
  if (state.mode === "lightning") return state.selectedLength * 30 + 30;
  if (state.mode === "boss") return state.selectedLength * 45 + 60;
  return Math.max(5, state.selectedLength) * 60;
}

function questionKey(question) {
  return `${question.topic}::${question.subtopic || ""}::${question.prompt}`;
}

function selectedPool() {
  return state.topic === ALL_TOPICS
    ? window.CFA_QUESTIONS
    : window.CFA_QUESTIONS.filter((question) => question.topic === state.topic);
}

function availableQuestions(pool) {
  const seen = new Set(state.progression.seenQuestions);
  return pool.filter((question) => !seen.has(questionKey(question)));
}

function forgetSeenQuestions(pool) {
  const poolKeys = new Set(pool.map(questionKey));
  state.progression.seenQuestions = state.progression.seenQuestions.filter((key) => !poolKeys.has(key));
}

function cleanQuestion(question) {
  const { selected, selectedChoice, ...clean } = question;
  return clean;
}

function markQuestionSeen(question) {
  const seen = new Set(state.progression.seenQuestions);
  seen.add(questionKey(question));
  state.progression.seenQuestions = [...seen];
  saveProgression();
}

function buildDeck(options = {}) {
  clearAutoAdvance();
  let deck;
  if (options.deck) {
    deck = options.deck.map(cleanQuestion);
  } else {
    const pool = selectedPool();
    let available = availableQuestions(pool);
    if (available.length === 0) {
      forgetSeenQuestions(pool);
      available = availableQuestions(pool);
    }
    deck = shuffle(available).slice(0, Math.min(state.selectedLength, available.length));
  }
  state.deck = deck;
  state.lastDeck = deck.map(cleanQuestion);
  state.index = 0;
  state.score = 0;
  state.points = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.answered = false;
  state.finished = false;
  state.runKind = options.runKind || "custom";
  state.missed = [];
  state.lastMisses = [];
  state.secondsLeft = roundSeconds();
  state.gameValue = state.mode === "boss" ? 100 : 0;
  state.questionStartedAt = 0;
  state.stake = "steady";
  state.hintsLeft = 1;
  state.eliminatesLeft = 1;
  state.usedHintThisQuestion = false;
  state.usedEliminateThisQuestion = false;
  updateMeter();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clearRoundTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function clearAutoAdvance() {
  if (state.autoAdvanceId) {
    clearTimeout(state.autoAdvanceId);
    state.autoAdvanceId = null;
  }
}

function clearFlash() {
  if (state.flashId) {
    clearTimeout(state.flashId);
    state.flashId = null;
  }
}

function flashRound(message, tone = "neutral") {
  clearFlash();
  els.roundFlash.textContent = message;
  els.roundFlash.dataset.tone = tone;
  els.roundFlash.classList.remove("hidden");
  state.flashId = setTimeout(() => {
    els.roundFlash.classList.add("hidden");
    state.flashId = null;
  }, 1400);
}

function startRoundTimer() {
  clearRoundTimer();
  els.roundTimer.textContent = formatTime(state.secondsLeft);
  els.roundTimer.classList.remove("urgent");
  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    els.roundTimer.textContent = formatTime(Math.max(0, state.secondsLeft));
    els.roundTimer.classList.toggle("urgent", state.secondsLeft <= 60);
    if (state.secondsLeft <= 0) {
      renderResults(true);
    }
  }, 1000);
}

function setView(view) {
  els.emptyState.classList.toggle("hidden", view !== "empty");
  els.quizCard.classList.toggle("hidden", view !== "quiz");
  els.resultsCard.classList.toggle("hidden", view !== "results");
}

function bossPhase() {
  if (state.gameValue <= 0) return "Defeated";
  if (state.gameValue <= 30) return "Final phase";
  if (state.gameValue <= 60) return "Enraged";
  return "Guard up";
}

function approvalTier() {
  if (state.gameValue >= 85) return "Diamond tier";
  if (state.gameValue >= 65) return "Court favorite";
  if (state.gameValue >= 40) return "Respectable";
  return "On notice";
}

function streakTitle() {
  const match = STREAK_TITLES.find((item) => state.streak >= item.min);
  return match ? match.label : "";
}

function applyMode() {
  const mode = currentMode();
  document.body.dataset.mode = state.mode;
  els.modeEyebrow.textContent = mode.eyebrow;
  els.heroTitle.textContent = mode.title;
  els.heroSubhead.textContent = mode.subhead;
  els.setupCopy.textContent = mode.setupCopy;
  els.sceneImage.src = mode.scene;
  els.emptySticker.src = mode.sticker;
  els.quizSceneImage.src = mode.scene;
  setSticker("idle");
  els.characterName.textContent = mode.character;
  els.quizCharacterName.textContent = mode.character;
  els.emptyTitle.textContent = mode.emptyTitle;
  els.emptyCopy.textContent = mode.emptyCopy;
  els.modePreviewTitle.textContent = mode.title;
  els.modePreviewCopy.textContent = `${mode.preview} ${MODE_RULES[state.mode]}`;
  els.meterLabel.textContent = mode.meter;
  els.resultsEyebrow.textContent = mode.resultEyebrow;
  updateMeter();
  if (audio.enabled) startMusic();
}

function topicCharacter(topic) {
  if (state.mode === "lightning") return "Streak Engine";
  if (state.mode === "boss") return TOPIC_CHARACTERS[topic] || "The Curriculum Boss";
  return TOPIC_CHARACTERS[topic] || "Lady Whistledown";
}

function updateMeter() {
  els.meterLabel.textContent = currentMode().meter;
  if (state.mode === "boss") {
    const phase = bossPhase();
    els.quizCard.dataset.phase = phase.toLowerCase().replace(/\s+/g, "-");
    els.meterLabel.textContent = `${currentMode().meter} · ${phase}`;
    els.meterValue.textContent = `${Math.max(0, state.gameValue)} HP`;
    els.gameMeter.style.setProperty("--meter-fill", `${Math.max(0, state.gameValue)}%`);
  } else if (state.mode === "lightning") {
    delete els.quizCard.dataset.phase;
    els.meterValue.textContent = `${state.streak}x`;
    els.gameMeter.style.setProperty("--meter-fill", `${Math.min(100, state.streak * 12.5)}%`);
  } else {
    delete els.quizCard.dataset.phase;
    els.meterLabel.textContent = `${currentMode().meter} · ${approvalTier()}`;
    els.meterValue.textContent = `${Math.max(0, state.gameValue)} approval`;
    els.gameMeter.style.setProperty("--meter-fill", `${Math.max(0, state.gameValue)}%`);
  }
}

function updateStats(status = "") {
  els.scoreChip.textContent = `${state.score}/${state.deck.length || state.selectedLength}`;
  els.streakChip.textContent = String(state.streak);
  els.pointsChip.textContent = String(state.points);
  if (status) els.sceneStatus.textContent = status;
}

function updateStreakBanner(milestone = false) {
  const title = streakTitle();
  els.streakBanner.classList.toggle("hidden", !title);
  els.streakBanner.classList.toggle("hot", milestone);
  if (title) {
    els.streakBanner.textContent = `${state.streak}x ${title}`;
  }
}

function setSticker(mood) {
  els.moodSticker.src = currentMode().sticker;
  els.moodSticker.dataset.mood = mood;
  els.moodSticker.classList.remove("sticker-pop");
  void els.moodSticker.offsetWidth;
  els.moodSticker.classList.add("sticker-pop");
}

function updatePowerButtons() {
  els.steadyBtn.classList.toggle("selected", state.stake === "steady");
  els.doubleBtn.classList.toggle("selected", state.stake === "double");
  els.hintBtn.textContent = `Hint ${state.hintsLeft}`;
  els.eliminateBtn.textContent = `Eliminate ${state.eliminatesLeft}`;
  els.hintBtn.disabled = state.answered || state.hintsLeft <= 0 || state.usedHintThisQuestion;
  els.eliminateBtn.disabled = state.answered || state.eliminatesLeft <= 0 || state.usedEliminateThisQuestion;
  els.steadyBtn.disabled = state.answered;
  els.doubleBtn.disabled = state.answered;
}

function setStake(stake) {
  if (state.answered) return;
  state.stake = stake;
  updatePowerButtons();
  if (stake === "double") {
    flashRound(state.mode === "ton" ? "Confidence wager placed" : "Double-or-nothing armed", "hot");
  }
}

function useHint() {
  if (state.answered || state.hintsLeft <= 0 || state.usedHintThisQuestion) return;
  const question = state.deck[state.index];
  state.hintsLeft -= 1;
  state.usedHintThisQuestion = true;
  els.powerHint.textContent = feedbackHook(question);
  els.powerHint.classList.remove("hidden");
  flashRound("Hint spent: fewer points on this answer", "neutral");
  updatePowerButtons();
}

function useEliminate() {
  if (state.answered || state.eliminatesLeft <= 0 || state.usedEliminateThisQuestion) return;
  const wrongButtons = [...els.answers.querySelectorAll(".answer")]
    .filter((button, index) => state.currentChoices[index].index !== state.deck[state.index].answer && !button.disabled);
  if (!wrongButtons.length) return;
  const button = wrongButtons[Math.floor(Math.random() * wrongButtons.length)];
  button.disabled = true;
  button.classList.add("eliminated");
  state.eliminatesLeft -= 1;
  state.usedEliminateThisQuestion = true;
  flashRound("One decoy removed", "neutral");
  updatePowerButtons();
}

function pointGain(speedBonus) {
  let gain = 100 + state.streak * 15 + speedBonus;
  if (state.stake === "double") gain *= 2;
  if (state.usedHintThisQuestion) gain -= 35;
  if (state.usedEliminateThisQuestion) gain -= 20;
  return Math.max(25, gain);
}

function pointPenalty() {
  let penalty = state.stake === "double" ? 75 : 25;
  if (state.mode === "ton" && state.stake === "double") penalty += 25;
  return penalty;
}

function bossCounter(question) {
  if (state.mode !== "boss") return "";
  const trait = BOSS_TRAITS[question.topic] || { attack: "Curriculum counter", timePenalty: 10, pointPenalty: 30 };
  state.secondsLeft = Math.max(0, state.secondsLeft - trait.timePenalty);
  state.points = Math.max(0, state.points - trait.pointPenalty);
  els.roundTimer.textContent = formatTime(state.secondsLeft);
  els.roundTimer.classList.toggle("urgent", state.secondsLeft <= 60);
  const message = `${trait.attack}: -${trait.timePenalty}s, -${trait.pointPenalty} pts`;
  flashRound(message, "danger");
  return message;
}

function updateGameValue(correct) {
  let effect = "";
  let milestone = false;
  if (state.mode === "boss") {
    const damage = Math.ceil(100 / state.deck.length);
    const critical = correct && state.streak > 0 && state.streak % 3 === 0;
    const totalDamage = damage + (critical ? Math.ceil(damage * 0.6) : 0);
    state.gameValue = correct
      ? Math.max(0, state.gameValue - totalDamage)
      : Math.min(100, state.gameValue + 8);
    effect = correct
      ? `${critical ? "Critical hit" : "Hit"}: -${totalDamage} HP`
      : "Boss heals: +8 HP";
    milestone = critical;
  } else if (state.mode === "lightning") {
    state.gameValue = state.streak;
    effect = correct ? "Speed window held" : "Streak reset";
  } else {
    const gain = Math.ceil(100 / state.deck.length);
    const wager = state.stake === "double" ? Math.ceil(gain * 0.55) : 0;
    state.gameValue = correct
      ? Math.min(100, state.gameValue + gain + wager)
      : Math.max(0, state.gameValue - (state.stake === "double" ? 22 : 8));
    effect = correct
      ? `${state.stake === "double" ? "Wager won" : approvalTier()} reached`
      : state.stake === "double" ? "Scandal wager failed" : "Approval slipped";
    milestone = correct && state.stake === "double";
  }
  updateMeter();
  return { effect, milestone };
}

function phrase(kind) {
  const options = currentMode()[kind];
  return options[Math.floor(Math.random() * options.length)];
}

function renderQuestion() {
  clearAutoAdvance();
  clearFlash();
  const question = state.deck[state.index];
  state.answered = false;
  state.stake = "steady";
  state.usedHintThisQuestion = false;
  state.usedEliminateThisQuestion = false;
  state.questionStartedAt = Date.now();
  els.topicBadge.textContent = state.runKind === "revenge" ? `${question.topic} · Revenge` : question.topic;
  els.characterName.textContent = topicCharacter(question.topic);
  els.quizCharacterName.textContent = topicCharacter(question.topic);
  els.sceneStatus.textContent = state.mode === "boss"
    ? "Boss engaged"
    : state.mode === "lightning"
      ? "Streak window open"
      : "The ton is watching";
  setSticker("idle");
  els.questionCounter.textContent = `${state.index + 1} / ${state.deck.length}`;
  els.progressBar.style.width = `${(state.index / state.deck.length) * 100}%`;
  if (question.caseText) {
    els.caseBlock.classList.remove("hidden");
    els.caseBlock.innerHTML = `<strong>${html(question.caseTitle || "Mini Vignette")}</strong><p>${html(question.caseText)}</p>`;
  } else {
    els.caseBlock.classList.add("hidden");
    els.caseBlock.textContent = "";
  }
  els.questionText.textContent = question.prompt;
  els.feedback.className = "feedback hidden";
  els.feedback.textContent = "";
  els.powerHint.classList.add("hidden");
  els.powerHint.textContent = "";
  els.nextBtn.classList.add("hidden");
  updateStreakBanner();
  els.answers.innerHTML = "";
  state.currentChoices = shuffle(question.choices.map((choice, index) => ({ choice, index })));
  updateStats();
  updatePowerButtons();

  state.currentChoices.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.textContent = item.choice;
    button.addEventListener("click", () => answerQuestion(item.index, item.choice));
    els.answers.appendChild(button);
  });
}

function feedbackTrap(question) {
  if (question.trap) return question.trap;
  if (question.focus && question.focus.includes("formula")) return "Formula recall: lock the numerator, denominator, and sign before choosing.";
  if (question.focus && question.focus.includes("ethicsTrap")) return "Ethics trap: pick the action that protects clients and disclosure first.";
  if (question.caseText) return "Vignette trap: use only the fact pattern in front of you.";
  return `Concept trap: ${question.subtopic || question.topic}.`;
}

function feedbackHook(question) {
  if (question.memoryHook) return question.memoryHook;
  if (question.subtopic === "Credit analysis") return "Credit gets worse, spreads widen, prices fall.";
  if (question.subtopic === "Residual income") return "Residual income is earnings minus the equity charge.";
  if (question.subtopic === "Formula duel") return "Say the formula once before reading the answer choices.";
  if (question.subtopic === "Standards application" || question.subtopic === "Ethics traps") return "When in doubt, disclose, get consent, and treat clients fairly.";
  return "Turn this into a one-line flashcard before replaying.";
}

function feedbackDetails(question, correct, modeEffect, speedBonus) {
  const rows = [];
  if (modeEffect) rows.push(["Mode", modeEffect]);
  if (state.stake === "double") rows.push(["Wager", correct ? "Double points landed." : "Double penalty paid."]);
  if (state.usedHintThisQuestion) rows.push(["Hint", "-35 pts for the assist."]);
  if (state.usedEliminateThisQuestion) rows.push(["Eliminate", "-20 pts for removing a decoy."]);
  if (state.mode === "lightning" && correct && speedBonus > 0) rows.push(["Speed", `+${speedBonus} pts`]);
  if (correct) {
    rows.push(["Hook", feedbackHook(question)]);
  } else {
    rows.push(["Trap", feedbackTrap(question)]);
    rows.push(["Fix", feedbackHook(question)]);
  }
  return `<div class="feedback-details">${rows.map(([label, value]) => `<p><span>${html(label)}</span>${html(value)}</p>`).join("")}</div>`;
}

function scheduleLightningAdvance() {
  clearAutoAdvance();
  const delay = state.index === state.deck.length - 1 ? 1250 : 900;
  state.autoAdvanceId = setTimeout(() => {
    state.autoAdvanceId = null;
    nextQuestion();
  }, delay);
}

function answerQuestion(choiceIndex, selectedChoice) {
  if (state.answered || state.finished) return;
  state.answered = true;
  const question = state.deck[state.index];
  const correct = choiceIndex === question.answer;
  const elapsedSeconds = Math.max(0, (Date.now() - state.questionStartedAt) / 1000);
  const lightningDecayed = state.mode === "lightning" && correct && elapsedSeconds > 8;
  const speedBonus = state.mode === "lightning" && correct && !lightningDecayed
    ? Math.max(0, Math.round(45 - elapsedSeconds * 7))
    : 0;
  const answerButtons = [...els.answers.querySelectorAll(".answer")];

  answerButtons.forEach((button, index) => {
    button.disabled = true;
    if (state.currentChoices[index].index === question.answer) button.classList.add("correct");
    if (state.currentChoices[index].index === choiceIndex && !correct) button.classList.add("wrong");
  });
  updatePowerButtons();
  markQuestionSeen(question);

  if (correct) {
    state.score += 1;
    state.streak = lightningDecayed ? 1 : state.streak + 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.points += pointGain(speedBonus);
  } else {
    state.streak = 0;
    state.points = Math.max(0, state.points - pointPenalty());
    state.missed.push({ ...question, selected: choiceIndex, selectedChoice });
  }

  const modeEffect = updateGameValue(correct);
  const attackEffect = correct ? "" : bossCounter(question);
  if (lightningDecayed) {
    modeEffect.effect = "Combo decayed: correct, but too slow for the chain";
    flashRound("Combo decayed", "danger");
  }
  const streakMilestone = correct && [3, 5, 8].includes(state.streak);
  const status = modeEffect.effect || (correct ? "Clean answer" : "Review flagged");
  updateStats(status);
  updateStreakBanner(streakMilestone || modeEffect.milestone);
  setSticker(correct ? "correct" : "wrong");
  playSfx(correct ? "correct" : "wrong");
  sparkBurst(correct, streakMilestone || modeEffect.milestone ? 30 : 16);
  els.quizCard.dataset.reaction = correct ? "correct" : "wrong";
  setTimeout(() => {
    delete els.quizCard.dataset.reaction;
  }, 450);
  if (streakMilestone) flashRound(`${state.streak}x streak surge`, "hot");
  if (state.mode === "ton" && state.stake === "double" && !correct) flashRound("Scandal wager failed", "danger");
  if (state.mode === "boss" && correct && modeEffect.milestone) flashRound("Critical hit", "hot");

  els.feedback.className = `feedback ${correct ? "good" : "bad"}`;
  const effectText = [modeEffect.effect, attackEffect].filter(Boolean).join(" · ");
  els.feedback.innerHTML = `<strong>${html(phrase(correct ? "correct" : "wrong"))}</strong> ${html(question.explain)}${feedbackDetails(question, correct, effectText, speedBonus)}`;
  els.nextBtn.textContent = state.index === state.deck.length - 1
    ? "Finish Review"
    : state.mode === "lightning"
      ? "Auto Next"
      : "Next";
  els.nextBtn.classList.remove("hidden");
  els.progressBar.style.width = `${((state.index + 1) / state.deck.length) * 100}%`;
  if (state.secondsLeft <= 0) {
    setTimeout(() => renderResults(true), 900);
  } else if (state.mode === "lightning") {
    scheduleLightningAdvance();
  }
}

function rankFor(percent) {
  if (state.mode === "ton") {
    if (percent >= 90) return "Diamond of the Exam";
    if (percent >= 75) return "Most Eligible Analyst";
    if (percent >= 55) return "Respectable, Under Review";
    return "Summoned by Lady Danbury";
  }
  if (state.mode === "boss") {
    if (percent >= 90) return "Boss Deleted";
    if (percent >= 75) return "Arena Winner";
    if (percent >= 55) return "Bruised Victory";
    return "Boss Rematch";
  }
  if (percent >= 90) return "Voltage Maxed";
  if (percent >= 75) return "Clean Streak";
  if (percent >= 55) return "Sparks Flying";
  return "Recharge Needed";
}

function tonHeadline(percent, timedOut) {
  if (timedOut) return "Whistledown Special: The Clock Challenges Kruts.";
  if (percent >= 90) return "Society Papers: Kruts Dominates the Exam Floor.";
  if (percent >= 75) return "Morning Sheet: Kruts Delivers, Minimal Scandal.";
  if (percent >= 55) return "Gossip Column: Kruts Is Respectable, With Footnotes.";
  return "Urgent Notice: Lady Danbury Requests Kruts' Rematch.";
}

function scoreNote(percent, timedOut) {
  if (timedOut) {
    if (state.mode === "ton") return `${tonHeadline(percent, timedOut)} The unanswered items are preserved below.`;
    if (state.mode === "boss") return "The timer won this round. Review the boss moves, then queue the rematch.";
    return "Time expired. The missed flashes below are your next reps.";
  }
  if (state.mode === "ton") {
    if (percent >= 85) return `${tonHeadline(percent, timedOut)} Rotate topics before confidence becomes vanity.`;
    if (percent >= 65) return `${tonHeadline(percent, timedOut)} Review the gossip before the next ball.`;
    return `${tonHeadline(percent, timedOut)} Replay the weak concepts before the next appearance.`;
  }
  if (state.mode === "boss") {
    if (percent >= 85) return `Boss HP crushed. Max streak: ${state.maxStreak}.`;
    if (percent >= 65) return `Good damage. Max streak: ${state.maxStreak}. Patch the weak attacks below.`;
    return "The boss found your openings. Replay this deck after reviewing the counters.";
  }
  if (percent >= 85) return `Fast and clean. Max streak: ${state.maxStreak}.`;
  if (percent >= 65) return `Good rep. Max streak: ${state.maxStreak}; tighten the misses.`;
  return "Useful speed stress. Slow down once, fix the concepts, then speed back up.";
}

function renderWeakAreaSummary() {
  const weakAreas = weakAreaCounts();
  if (weakAreas.length === 0) return "";
  const summary = weakAreas
    .filter(([, count]) => count > 1)
    .slice(0, 3)
    .map(([name, count]) => `${html(name)} x${count}`)
    .join(" · ");
  if (!summary) return "";
  return `<div class="review-item weak-summary"><strong>Pattern spotted:</strong> ${summary}</div>`;
}

function weakAreaCounts() {
  const counts = {};
  state.missed.forEach((item) => {
    const key = item.subtopic || item.topic;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

function resultReport(percent, timedOut) {
  const weakAreas = weakAreaCounts();
  const weakArea = weakAreas[0] ? weakAreas[0][0] : "none";
  const nextMove = state.missed.length
    ? "Run the Revenge Round before starting a fresh deck."
    : state.mode === "boss"
      ? "Pick a new boss while the timing is warm."
      : "Raise the length or rotate topic for the next sprint.";
  const hook = state.missed[0] ? feedbackHook(state.missed[0]) : "Keep the streak alive with a harder topic.";
  const timeoutText = timedOut ? "<p><strong>Clock:</strong> Time expired, so unanswered items are treated as misses.</p>" : "";
  return `
    <div class="review-item battle-report">
      <p class="review-topic">Battle report</p>
      <h3>${html(rankFor(percent))}</h3>
      <p><strong>Weak point:</strong> ${html(weakArea)}</p>
      <p><strong>Next move:</strong> ${html(nextMove)}</p>
      <p><strong>Memory hook:</strong> ${html(hook)}</p>
      ${timeoutText}
    </div>
  `;
}

function renderResults(timedOut = false) {
  if (state.finished) return;
  state.finished = true;
  clearAutoAdvance();
  clearRoundTimer();
  playSfx("finish");

  if (timedOut) {
    const firstUnanswered = state.answered ? state.index + 1 : state.index;
    state.deck.slice(firstUnanswered).forEach((question) => {
      state.missed.push({ ...question, selected: null });
    });
  }

  const total = state.deck.length;
  const percent = Math.round((state.score / total) * 100);
  state.lastDeck = state.deck.map(cleanQuestion);
  state.lastMisses = state.missed.map(cleanQuestion);
  recordProgression(percent);
  els.resultsEyebrow.textContent = currentMode().resultEyebrow;
  els.scoreText.textContent = `${state.score} / ${total} · ${state.points} pts`;
  els.rankBadge.textContent = rankFor(percent);
  els.scoreNote.textContent = scoreNote(percent, timedOut);
  els.revengeBtn.classList.toggle("hidden", state.lastMisses.length === 0);

  if (state.missed.length === 0) {
    els.reviewList.innerHTML = resultReport(percent, timedOut) + `<div class="review-item clean">${html(currentMode().clean)}</div>`;
  } else {
    const label = state.mode === "ton"
      ? "Whistledown writes"
      : state.mode === "boss"
        ? "Countermove"
        : "Fix";
    els.reviewList.innerHTML = resultReport(percent, timedOut) + state.missed.map((item) => `
      <div class="review-item">
        <p class="review-topic">${html(item.topic)}${item.subtopic ? ` · ${html(item.subtopic)}` : ""} · ${html(label)}</p>
        <h3>${html(item.prompt)}</h3>
        <p><strong>Your answer:</strong> ${item.selected === null ? "Not answered" : html(item.selectedChoice || item.choices[item.selected])}</p>
        <p><strong>Correct:</strong> ${html(item.choices[item.answer])}</p>
        <p>${html(item.explain)}</p>
      </div>
    `).join("") + renderWeakAreaSummary();
  }

  sparkBurst(percent >= 65, 26);
  setSticker(percent >= 65 ? "correct" : "wrong");
  setView("results");
}

function startSprint(options = {}) {
  state.mode = options.mode || els.modeSelect.value;
  state.topic = options.topic || els.topicSelect.value;
  state.selectedLength = options.length || Number(els.lengthSelect.value);
  if (options.deck) state.selectedLength = options.deck.length;
  els.modeSelect.value = state.mode;
  els.topicSelect.value = state.topic;
  if (!options.deck) els.lengthSelect.value = String(state.selectedLength);
  applyMode();
  buildDeck({ deck: options.deck, runKind: options.runKind || "custom" });
  if (!state.deck.length) return;
  setSticker("start");
  playSfx("start");
  startRoundTimer();
  renderQuestion();
  setView("quiz");
}

function startRevengeRound() {
  if (!state.lastMisses.length) return;
  startSprint({
    mode: state.mode,
    topic: state.topic,
    deck: state.lastMisses,
    runKind: "revenge",
  });
}

function replayDeck() {
  if (!state.lastDeck.length) {
    startSprint();
    return;
  }
  startSprint({
    mode: state.mode,
    topic: state.topic,
    deck: state.lastDeck,
    runKind: "replay",
  });
}

function nextQuestion() {
  clearAutoAdvance();
  if (state.index >= state.deck.length - 1) {
    renderResults(false);
    return;
  }
  state.index += 1;
  renderQuestion();
}

function ensureAudio() {
  if (!audio.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      audio.enabled = false;
      els.musicBtn.textContent = "No Audio";
      return;
    }
    audio.context = new AudioContextClass();
    audio.master = audio.context.createGain();
    audio.master.gain.value = 0.045;
    audio.master.connect(audio.context.destination);
  }
  if (audio.context.state === "suspended") audio.context.resume();
}

function playTone(freq, duration, type = "sine", delay = 0, gain = 1) {
  if (!audio.enabled) return;
  ensureAudio();
  const now = audio.context.currentTime + delay;
  const oscillator = audio.context.createOscillator();
  const envelope = audio.context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.18 * gain, now + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(audio.master);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function startMusic() {
  if (!audio.enabled) return;
  ensureAudio();
  stopMusic();
  audio.beat = 0;
  const pattern = currentMode().music;
  audio.musicTimer = setInterval(() => {
    const note = pattern.notes[audio.beat % pattern.notes.length];
    playTone(note, pattern.interval / 1500, pattern.type, 0, 0.44);
    if (state.mode === "boss" && audio.beat % 2 === 0) playTone(note / 2, 0.16, "sine", 0.02, 0.34);
    audio.beat += 1;
  }, pattern.interval);
}

function stopMusic() {
  if (audio.musicTimer) {
    clearInterval(audio.musicTimer);
    audio.musicTimer = null;
  }
}

function playSfx(kind) {
  if (!audio.enabled) return;
  if (kind === "correct") {
    playTone(523, 0.08, "triangle", 0, 0.9);
    playTone(659, 0.1, "triangle", 0.07, 0.8);
    playTone(784, 0.12, "triangle", 0.14, 0.7);
  } else if (kind === "wrong") {
    playTone(196, 0.12, "sawtooth", 0, 0.55);
    playTone(130, 0.18, "sawtooth", 0.09, 0.45);
  } else if (kind === "start") {
    playTone(330, 0.08, "triangle", 0, 0.55);
    playTone(494, 0.12, "triangle", 0.08, 0.55);
  } else if (kind === "finish") {
    playTone(392, 0.1, "triangle", 0, 0.65);
    playTone(587, 0.12, "triangle", 0.08, 0.62);
    playTone(880, 0.18, "triangle", 0.18, 0.55);
  }
}

function toggleMusic() {
  audio.enabled = !audio.enabled;
  els.musicBtn.setAttribute("aria-pressed", String(audio.enabled));
  els.musicBtn.textContent = audio.enabled ? "Music On" : "Music Off";
  if (audio.enabled) {
    ensureAudio();
    startMusic();
  } else {
    stopMusic();
  }
}

function sparkBurst(positive, count = 16) {
  const colors = positive
    ? ["#f5b84b", "#41b883", "#f8f4eb", "#3e76d6"]
    : ["#c7384a", "#f5b84b", "#7f1f2c", "#f8f4eb"];
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("span");
    dot.className = "spark";
    dot.style.setProperty("--x", `${Math.random() * 100}vw`);
    dot.style.setProperty("--dx", `${Math.random() * 120 - 60}px`);
    dot.style.setProperty("--dy", `${Math.random() * 120 + 70}px`);
    dot.style.setProperty("--color", colors[i % colors.length]);
    dot.style.animationDelay = `${Math.random() * 90}ms`;
    els.fxLayer.appendChild(dot);
    setTimeout(() => dot.remove(), 900);
  }
}

function init() {
  loadProgression();
  updateProgressPanel();
  updateCountdown();
  populateTopics();
  applyMode();
  els.modeSelect.addEventListener("change", () => {
    state.mode = els.modeSelect.value;
    clearAutoAdvance();
    clearRoundTimer();
    clearFlash();
    applyMode();
    setView("empty");
  });
  els.musicBtn.addEventListener("click", toggleMusic);
  els.startBtn.addEventListener("click", startSprint);
  els.steadyBtn.addEventListener("click", () => setStake("steady"));
  els.doubleBtn.addEventListener("click", () => setStake("double"));
  els.hintBtn.addEventListener("click", useHint);
  els.eliminateBtn.addEventListener("click", useEliminate);
  els.nextBtn.addEventListener("click", nextQuestion);
  els.revengeBtn.addEventListener("click", startRevengeRound);
  els.retryBtn.addEventListener("click", replayDeck);
  els.newDeckBtn.addEventListener("click", () => {
    clearAutoAdvance();
    clearRoundTimer();
    clearFlash();
    state.finished = true;
    setView("empty");
  });
}

init();
