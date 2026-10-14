import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { load, remove, save } from "../lib/storage";
import { computeResult, createAttempt, pickExam, QUESTIONS, QMAP, shuffle, type Answer, type Attempt } from "./engine";

const K_CUR = "si-quiz-current-v2";
const K_LAST = "si-quiz-last-v2";
const K_HIST = "si-quiz-history-v2";
const K_OPTS = "si-quiz-options-v2";

export type HistoryEntry = { id: string; date: number; label: string; score: number; n: number; time: number };
export type Options = { instant: boolean; shuffleBank: boolean };

type Ctx = {
  attempt: Attempt | null;
  last: Attempt | null;
  history: HistoryEntry[];
  options: Options;
  setOptions: (o: Options) => void;
  start: (kind: "exam" | "bank" | { ids: string[]; label: string }) => void;
  resume: () => void;
  discard: () => void;
  setAnswer: (id: string, a: Answer) => void;
  goTo: (idx: number) => void;
  check: (id: string) => void;
  toggleFlag: (id: string) => void;
  finish: () => void;
  addTime: (s: number) => void;
  stored: Attempt | null;
};

const QuizCtx = createContext<Ctx | null>(null);

const valid = (a: Attempt | null) => !!a && Array.isArray(a.ids) && a.ids.length > 0 && a.ids.every((id) => QMAP[id]);

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
  const [history, setHistory] = useState<HistoryEntry[]>(() => load<HistoryEntry[]>(K_HIST, []));
  const [options, setOptionsState] = useState<Options>(() => ({ instant: false, shuffleBank: true, ...load<Partial<Options>>(K_OPTS, {}) }));

  // persist the running attempt (debounced) so a reload never loses progress
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

  const setOptions = useCallback((o: Options) => { setOptionsState(o); save(K_OPTS, o); }, []);

  const start = useCallback<Ctx["start"]>((kind) => {
    let a: Attempt;
    if (kind === "exam") a = createAttempt("exam", pickExam(), "Examen de 20 preguntas", options.instant);
    else if (kind === "bank") {
      const ids = QUESTIONS.map((q) => q.id);
      a = createAttempt("bank", options.shuffleBank ? shuffle(ids) : ids, "Banco completo de 100 preguntas", options.instant);
    } else a = createAttempt("review", kind.ids, kind.label, options.instant);
    save(K_CUR, a);
    setStored(a);
    setAttempt(a);
  }, [options]);

  const resume = useCallback(() => { if (stored) setAttempt(stored); }, [stored]);
  const discard = useCallback(() => { remove(K_CUR); setStored(null); setAttempt(null); }, []);

  const update = useCallback((fn: (a: Attempt) => Attempt) => setAttempt((a) => (a ? fn(a) : a)), []);
  const setAnswer = useCallback((id: string, ans: Answer) => update((a) => ({ ...a, answers: { ...a.answers, [id]: ans } })), [update]);
  const goTo = useCallback((idx: number) => update((a) => ({ ...a, idx: Math.max(0, Math.min(a.ids.length - 1, idx)) })), [update]);
  const check = useCallback((id: string) => update((a) => ({ ...a, checked: { ...a.checked, [id]: true } })), [update]);
  const toggleFlag = useCallback((id: string) => update((a) => ({ ...a, flags: { ...a.flags, [id]: !a.flags[id] } })), [update]);
  const addTime = useCallback((s: number) => update((a) => ({ ...a, elapsed: a.elapsed + s })), [update]);

  const ref = useRef<Attempt | null>(null);
  ref.current = attempt;
  const finish = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    const done = { ...a, finishedAt: Date.now() };
    const r = computeResult(done);
    const entry: HistoryEntry = { id: a.id, date: Date.now(), label: a.label, score: Math.round(r.score * 10) / 10, n: a.ids.length, time: Math.round(a.elapsed) };
    setHistory((h) => {
      const next = [entry, ...h.filter((x) => x.id !== a.id)].slice(0, 15);
      save(K_HIST, next);
      return next;
    });
    save(K_LAST, done);
    remove(K_CUR);
    window.clearTimeout(timer.current);
    setLast(done);
    setStored(null);
    setAttempt(null);
  }, []);

  useEffect(() => { if (attempt) setStored(attempt); }, [attempt]);

  const value = useMemo<Ctx>(() => ({
    attempt, last, history, options, setOptions, start, resume, discard, setAnswer, goTo, check, toggleFlag, finish, addTime, stored,
  }), [attempt, last, history, options, setOptions, start, resume, discard, setAnswer, goTo, check, toggleFlag, finish, addTime, stored]);

  return <QuizCtx.Provider value={value}>{children}</QuizCtx.Provider>;
}

export function useQuiz() {
  const c = useContext(QuizCtx);
  if (!c) throw new Error("useQuiz fuera de QuizProvider");
  return c;
}
