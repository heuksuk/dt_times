const DRAFT_KEY = "animal-team-survey-draft-v1";
const COMPLETE_KEY = "animal-team-survey-complete-v1";

const state = {
  config: null,
  participantName: "",
  questions: [],
  answers: {},
  currentIndex: 0,
};

const views = [...document.querySelectorAll(".screen")];
const el = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  bindEvents();

  try {
    const response = await fetch("survey-config.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`설문 설정 응답 오류: ${response.status}`);
    state.config = await response.json();
    state.questions = [...state.config.questions];
    restoreDraft();
    populateIntro();
    showView("intro-view");
  } catch (error) {
    console.error(error);
    showView("error-view");
  }
}

function bindEvents() {
  el("retry-button").addEventListener("click", () => location.reload());
  el("start-button").addEventListener("click", startSurvey);
  el("participant-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") startSurvey();
  });
  el("participant-name").addEventListener("input", () => {
    el("name-error").textContent = "";
  });
  el("previous-button").addEventListener("click", previousQuestion);
  el("next-button").addEventListener("click", nextQuestion);
  el("exit-button").addEventListener("click", returnToIntro);
  el("back-to-survey-button").addEventListener("click", () => {
    state.currentIndex = state.questions.length - 1;
    renderQuestion();
    showView("question-view");
  });
  el("submit-button").addEventListener("click", submitSurvey);
}

function populateIntro() {
  el("survey-title").textContent = state.config.title;
  el("survey-description").textContent = state.config.description;
  if (state.participantName) el("participant-name").value = state.participantName;
}

function startSurvey() {
  const name = el("participant-name").value.trim();
  if (name.length < 2) {
    el("name-error").textContent = "두 글자 이상 입력해 주세요.";
    el("participant-name").focus();
    return;
  }

  const isNewParticipant = name !== state.participantName;
  state.participantName = name;
  if (isNewParticipant && Object.keys(state.answers).length > 0) {
    state.answers = {};
    state.currentIndex = 0;
    state.questions = shuffled(state.config.questions);
  } else if (Object.keys(state.answers).length === 0) {
    state.questions = shuffled(state.config.questions);
  }

  el("participant-label").textContent = `${name}님`;
  saveDraft();
  renderQuestion();
  showView("question-view");
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  const total = state.questions.length;
  const current = state.currentIndex + 1;
  const percent = Math.round((current / total) * 100);

  el("progress-label").textContent = `${current} / ${total}`;
  el("progress-percent").textContent = `${percent}%`;
  el("progress-bar").style.width = `${percent}%`;
  el("question-text").textContent = question.text;
  el("previous-button").disabled = state.currentIndex === 0;
  el("next-button").textContent = current === total ? "응답 확인" : "다음";

  const options = el("answer-options");
  options.replaceChildren();

  state.config.scale.forEach((scale) => {
    const label = document.createElement("label");
    label.className = "answer-label";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question-${question.id}`;
    input.value = scale.value;
    input.checked = state.answers[question.id] === scale.value;
    input.addEventListener("change", () => selectAnswer(question.id, scale.value));

    const text = document.createElement("span");
    text.textContent = scale.label;
    label.append(input, text);
    options.append(label);
  });

  el("next-button").disabled = state.answers[question.id] === undefined;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectAnswer(questionId, value) {
  state.answers[questionId] = value;
  el("next-button").disabled = false;
  saveDraft();
}

function previousQuestion() {
  if (state.currentIndex === 0) return;
  state.currentIndex -= 1;
  saveDraft();
  renderQuestion();
}

function nextQuestion() {
  const question = state.questions[state.currentIndex];
  if (state.answers[question.id] === undefined) return;

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    saveDraft();
    renderQuestion();
    return;
  }

  showReview();
}

function showReview() {
  const answeredCount = Object.keys(state.answers).length;
  el("review-name").textContent = state.participantName;
  el("review-count").textContent = `${answeredCount} / ${state.questions.length}`;
  showView("review-view");
}

function submitSurvey() {
  if (Object.keys(state.answers).length !== state.questions.length) return;

  const submission = {
    participantName: state.participantName,
    answers: state.answers,
    questionOrder: state.questions.map((question) => question.id),
    submittedAt: new Date().toISOString(),
  };

  // 다음 단계에서 이 객체를 서버 API로 전송하고, 성공했을 때 완료 화면을 표시한다.
  localStorage.setItem(COMPLETE_KEY, JSON.stringify(submission));
  localStorage.removeItem(DRAFT_KEY);
  showView("complete-view");
}

function returnToIntro() {
  saveDraft();
  el("participant-name").value = state.participantName;
  showView("intro-view");
}

function showView(id) {
  views.forEach((view) => view.classList.toggle("hidden", view.id !== id));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function saveDraft() {
  const draft = {
    participantName: state.participantName,
    answers: state.answers,
    currentIndex: state.currentIndex,
    questionOrder: state.questions.map((question) => question.id),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft) return;

    state.participantName = typeof draft.participantName === "string" ? draft.participantName : "";
    state.answers = draft.answers && typeof draft.answers === "object" ? draft.answers : {};
    state.currentIndex = Number.isInteger(draft.currentIndex) ? draft.currentIndex : 0;

    if (Array.isArray(draft.questionOrder) && draft.questionOrder.length === state.config.questions.length) {
      const questionMap = new Map(state.config.questions.map((question) => [question.id, question]));
      const restored = draft.questionOrder.map((id) => questionMap.get(id)).filter(Boolean);
      if (restored.length === state.config.questions.length) state.questions = restored;
    }
  } catch (error) {
    console.warn("임시 저장 데이터를 복원하지 못했습니다.", error);
    localStorage.removeItem(DRAFT_KEY);
  }
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}
