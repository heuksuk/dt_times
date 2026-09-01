"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import surveyConfig from "@/survey-config.json";

type Stage = "intro" | "questions" | "review" | "complete";

type SurveyQuestion = {
  id: number;
  team: string;
  text: string;
  reverse?: boolean;
};

type SurveyConfig = {
  title: string;
  description: string;
  estimatedMinutes: string;
  scale: Array<{ value: number; label: string }>;
  questions: SurveyQuestion[];
};

const config = surveyConfig as SurveyConfig;
const CLIENT_TOKEN_KEY = "animal-team-client-token-v1";
const COMPLETE_KEY = "animal-team-survey-complete-v1";
const ANIMAL_ICONS = [
  { label: "도", animal: "돼지", src: "/team-icons/pig.webp" },
  { label: "개", animal: "강아지", src: "/team-icons/dog.webp" },
  { label: "걸", animal: "양", src: "/team-icons/sheep.webp" },
  { label: "윷", animal: "소", src: "/team-icons/cow.webp" },
  { label: "모", animal: "말", src: "/team-icons/horse.webp" },
];

function AnimalRow({ small = false }: { small?: boolean }) {
  return (
    <div className={`animal-row${small ? " small" : ""}`} aria-hidden="true">
      {ANIMAL_ICONS.map((icon) => (
        <span className="animal-token" key={icon.label}>
          <Image alt="" height={small ? 44 : 64} src={icon.src} width={small ? 44 : 64} />
          <b className="yut-badge">{icon.label}</b>
        </span>
      ))}
    </div>
  );
}

function shuffled<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function getClientToken() {
  const existingToken = window.localStorage.getItem(CLIENT_TOKEN_KEY);

  if (existingToken) return existingToken;

  const newToken = window.crypto.randomUUID();
  window.localStorage.setItem(CLIENT_TOKEN_KEY, newToken);
  return newToken;
}

export default function Survey({ submissionsOpen }: { submissionsOpen: boolean }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>(config.questions);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    if (window.localStorage.getItem(COMPLETE_KEY) === "true") {
      setStage("complete");
    }
  }, []);

  function startSurvey() {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setNameError("이름 또는 닉네임을 2글자 이상 입력해 주세요.");
      return;
    }

    setName(trimmedName);
    setNameError("");
    setAnswers({});
    setQuestions(shuffled(config.questions));
    setCurrentIndex(0);
    setStage("questions");
  }

  function selectAnswer(questionId: number, value: number) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: value }));
  }

  function nextQuestion() {
    if (answers[question.id] === undefined) return;

    if (isLastQuestion) {
      setStage("review");
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  async function submitSurvey() {
    if (answeredCount !== questions.length) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, answers, clientToken: getClientToken() }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setSubmitError(result.error ?? "제출을 저장하지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      window.localStorage.setItem(COMPLETE_KEY, "true");
      setStage("complete");
    } catch {
      setSubmitError("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (stage === "complete") {
    return (
      <main className="app-shell">
        <section className="card centered" aria-live="polite">
          <div className="celebration" aria-hidden="true">🎉</div>
          <p className="eyebrow">제출 완료</p>
          <h1>참여해 주셔서 감사합니다</h1>
          <p className="lead">설문이 정상적으로 제출되었습니다.<br />최종 팀은 진행자의 안내를 기다려 주세요.</p>
          <AnimalRow small />
        </section>
      </main>
    );
  }

  if (stage === "review") {
    return (
      <main className="app-shell">
        <section className="card">
          <span className="hero-icon" aria-hidden="true">✅</span>
          <p className="eyebrow">마지막 확인</p>
          <h1>모든 문항에 답했어요!</h1>
          <p className="lead"><strong>{name}</strong>님의 응답을 제출할까요?</p>
          <div className="review-box"><span>응답 문항</span><strong>{answeredCount} / {questions.length}</strong></div>
          {submitError && <p className="submit-error" role="alert">{submitError}</p>}
          <button className="primary-button" disabled={isSubmitting} type="button" onClick={submitSurvey}>
            {isSubmitting ? "제출 중..." : "응답 제출하기"}
          </button>
          <button className="text-button full-width" type="button" onClick={() => { setCurrentIndex(questions.length - 1); setStage("questions"); }}>
            응답 다시 확인하기
          </button>
        </section>
      </main>
    );
  }

  if (stage === "questions") {
    const currentNumber = currentIndex + 1;
    const progress = Math.round((currentNumber / questions.length) * 100);

    return (
      <main className="app-shell">
        <section className="survey-screen">
          <header className="survey-header">
            <button className="text-button" type="button" onClick={() => setStage("intro")}>처음으로</button>
            <span className="participant-label">{name}님</span>
          </header>
          <div className="progress-meta"><span>{currentNumber} / {questions.length}</span><span>{progress}%</span></div>
          <div className="progress-track" aria-hidden="true"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>

          <section className="question-card" aria-labelledby="question-title">
            <h1 id="question-title">{question.text}</h1>
            <p className="question-help">평소의 나와 가장 가까운 답을 선택해 주세요.</p>
            <div className="answer-options" role="radiogroup" aria-label={`${currentNumber}번 문항 응답`}>
              {config.scale.map((option) => {
                const selected = answers[question.id] === option.value;

                return (
                  <label className="answer-label" data-selected={selected} key={option.value}>
                    <input checked={selected} name={`question-${question.id}`} onChange={() => selectAnswer(question.id, option.value)} type="radio" value={option.value} />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <nav className="question-nav" aria-label="설문 이동">
            <button className="secondary-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} type="button">이전</button>
            <button className="primary-button" disabled={answers[question.id] === undefined} onClick={nextQuestion} type="button">
              {isLastQuestion ? "응답 확인" : "다음"}
            </button>
          </nav>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="card">
        <AnimalRow />
        <p className="eyebrow">도 · 개 · 걸 · 윷 · 모</p>
        <h1>{config.title}</h1>
        <p className="lead">{config.description}</p>
        <div className="info-box">
          <div><strong>{config.questions.length}문항</strong><span>간단한 질문</span></div>
          <div><strong>{config.estimatedMinutes}분</strong><span>예상 시간</span></div>
        </div>
        <label className="name-field" htmlFor="participant-name">
          <span>이름 또는 닉네임을 입력해 주세요</span>
          <input
            id="participant-name"
            autoComplete="name"
            maxLength={20}
            onChange={(event) => { setName(event.target.value); setNameError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") startSurvey(); }}
            placeholder="이름을 입력해 주세요"
            type="text"
            value={name}
          />
          <small className="field-error" role="alert">{nameError}</small>
        </label>
        <p className="privacy-note">입력한 정보는 팀 배정과 명단 확인에만 사용됩니다.</p>
        <div className="survey-notice" role="note">
          <strong>참여 전 꼭 확인해 주세요</strong>
          <p>설문은 한 기기에서 한 번만 제출할 수 있습니다. 진행 중에는 새로고침하거나 창을 닫지 말아 주세요.</p>
        </div>
        {!submissionsOpen && <p className="closed-notice" role="status">현재 설문 접수가 마감되었습니다.</p>}
        <button className="primary-button" disabled={!submissionsOpen} type="button" onClick={startSurvey}>설문 시작하기</button>
      </section>
    </main>
  );
}
