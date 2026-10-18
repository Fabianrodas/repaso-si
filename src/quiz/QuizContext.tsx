import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { WEEKS, type WeekNum } from "../data/meta";
import { load, remove, save } from "../lib/storage";
import { computeResult, createAttempt, pickBank, pickLesson, pickRandom, QMAP, QUESTIONS, type Answer, type Attempt, type Mode } from "./engine";

// v3: el banco cambió por completo, así que los intentos guardados con la versión anterior no se reutilizan
const K_CUR = "si-quiz-current-v3";
const K_LAST = "si-quiz-last-v3";
const K_HIST = "si-quiz-history-v3";
const K_OPTS = "si-quiz-options-v3";

export type HistoryEntry = { id: string; date: number; mode: Mode; week?: WeekNum; label: string; score: number; n: number; time: number };
export type Options = { instant: boolean };
export type StartKind = { mode: "lesson"; week: WeekNum } | { mode: "random" } | { mode: "bank" } | { mode: "review"; ids: string[]; label: string };

type Ctx = {
  attempt: Attempt | null;
  stored: Attempt | null;
  last: Attempt | null;
  history: HistoryEntry[];
  best: Partial<Record<WeekNum, number>>;
  options: Options;
  setOptions: (o: Options) => void;
  start: (k: StartKind) => void;
  resume: () => void;
  discard: () => void;
  setAnswer: (id: string, a: Answer) => void;
  goTo: (idx: number) => void;
  check: (id: string) => void;
  toggleFlag: (id: string) => void;
  finish: () => void;
  addTime: (s: number) => void;
};

const QuizCtx = createContext<Ctx | null>(null);

const valid = (a: Attempt | null): a is Attempt =>
  !!a && Array.isArray(a.ids) && a.ids.length > 0 && a.ids.every((id) => QMAP[id]) && typeof a.idx === "number";

export const labelFor = (k: StartKind) =>
  k.mode === "lesson" ? `Lección Week ${k.week}` : k.mode === "random" ? "20 al azar" : k.mode === "bank" ? `Banco completo` : k.label;

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [stored, setStored] = useState<Attempt | null>(() => {
    const a = load<Attempt | null>(K_CUR, null);
    return valid(a) ? a : null;
  });
  const [last, setLast] = useState<Attempt | null>(() => {
    const a = load<Attempt | null>(K_LAST, null);
    return valid(a) ? a : null;
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const h = load<HistoryEntry[]>(K_HIST, []);
    return Array.isArray(h) ? h : [];
  });
  const [options, setOptionsState] = useState<Options>(() => ({ instant: false, ...load<Partial<Options>>(K_OPTS, {}) }));

  // guarda el intento en curso (con un pequeño retraso) para que recargar la página no pierda el avance
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!attempt) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(K_CUR, attempt), 250);
    return () => window.clearTimeout(timer.current);
  }, [attempt]);
  useEffect(() => {
    const flush = () => { if (attempt) save(K_CUR, attempt); };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [attempt]);
  useEffect(() => { if (attempt) setStored(attempt); }, [attempt]);

  const setOptions = useCallback((o: Options) => { setOptionsState(o); save(K_OPTS, o); }, []);

  const start = useCallback((k: StartKind) => {
    const ids = k.mode === "lesson" ? pickLesson(k.week) : k.mode === "random" ? pickRandom() : k.mode === "bank" ? pickBank() : k.ids;
    const a = createAttempt(k.mode, ids, labelFor(k), options.instant, k.mode === "lesson" ? k.week : undefined);
    window.clearTimeout(timer.current);
    save(K_CUR, a);
    setStored(a);
    setAttempt(a);
  }, [options.instant]);

  const resume = useCallback(() => { if (stored) setAttempt(stored); }, [stored]);
  const discard = useCallback(() => { window.clearTimeout(timer.current); remove(K_CUR); setStored(null); setAttempt(null); }, []);

  const update = useCallback((fn: (a: Attempt) => Attempt) => setAttempt((a) => (a ? fn(a) : a)), []);
  const setAnswer = useCallback((id: string, ans: Answer) => update((a) => (a.checked[id] ? a : { ...a, answers: { ...a.answers, [id]: ans } })), [update]);
  const goTo = useCallback((idx: number) => update((a) => ({ ...a, idx: Math.max(0, Math.min(a.ids.length - 1, idx)) })), [update]);
  const check = useCallback((id: string) => update((a) => ({ ...a, checked: { ...a.checked, [id]: true } })), [update]);
  const toggleFlag = useCallback((id: string) => update((a) => ({ ...a, flags: { ...a.flags, [id]: !a.flags[id] } })), [update]);
  const addTime = useCallback((s: number) => update((a) => ({ ...a, elapsed: a.elapsed + s })), [update]);

  const ref = useRef<Attempt | null>(null);
  ref.current = attempt;
  const finish = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    const done: Attempt = { ...a, finishedAt: Date.now() };
    const r = computeResult(done);
    const entry: HistoryEntry = {
      id: a.id, date: Date.now(), mode: a.mode, week: a.week, label: a.label,
      score: Math.round(r.score * 10) / 10, n: a.ids.length, time: Math.round(a.elapsed),
    };
    setHistory((h) => {
      const next = [entry, ...h.filter((x) => x.id !== a.id)].slice(0, 40);
      save(K_HIST, next);
      return next;
    });
    window.clearTimeout(timer.current);
    save(K_LAST, done);
    remove(K_CUR);
    setLast(done);
    setStored(null);
    setAttempt(null);
  }, []);

  const best = useMemo(() => {
    const b: Partial<Record<WeekNum, number>> = {};
    for (const h of history) if (h.mode === "lesson" && h.week && WEEKS.includes(h.week)) b[h.week] = Math.max(b[h.week] ?? 0, h.score);
    return b;
  }, [history]);

  const value = useMemo<Ctx>(() => ({
    attempt, stored, last, history, best, options, setOptions, start, resume, discard, setAnswer, goTo, check, toggleFlag, finish, addTime,
  }), [attempt, stored, last, history, best, options, setOptions, start, resume, discard, setAnswer, goTo, check, toggleFlag, finish, addTime]);

  return <QuizCtx.Provider value={value}>{children}</QuizCtx.Provider>;
}

export function useQuiz() {
  const c = useContext(QuizCtx);
  if (!c) throw new Error("useQuiz fuera de QuizProvider");
  return c;
}

export const TOTAL_Q = QUESTIONS.length;
