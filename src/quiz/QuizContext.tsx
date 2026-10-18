import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { load, remove, save } from "../lib/storage";
import { bankOf } from "../subjects";
import type { Subject } from "../subjects/types";
import { RANDOM_N, type Answer, type Attempt, type Mode } from "./engine";

// v3: el banco de SI cambió por completo, así que los intentos de la versión anterior no se reutilizan.
// Cada materia guarda lo suyo con su propio prefijo (si-…, is2-…).
const keys = (p: string) => ({
  CUR: `${p}-quiz-current-v3`,
  LAST: `${p}-quiz-last-v3`,
  HIST: `${p}-quiz-history-v3`,
  OPTS: `${p}-quiz-options-v3`,
});

export type HistoryEntry = { id: string; date: number; mode: Mode; week?: number; label: string; score: number; n: number; time: number };
export type Options = { instant: boolean };
export type StartKind = { mode: "lesson"; week: number } | { mode: "random" } | { mode: "bank" } | { mode: "review"; ids: string[]; label: string };

type Ctx = {
  attempt: Attempt | null;
  stored: Attempt | null;
  last: Attempt | null;
  history: HistoryEntry[];
  best: Partial<Record<number, number>>;
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

export const labelFor = (k: StartKind, unit: string) =>
  k.mode === "lesson" ? `Lección ${unit} ${k.week}` : k.mode === "random" ? `${RANDOM_N} al azar` : k.mode === "bank" ? `Banco completo` : k.label;

export function QuizProvider({ subject, children }: { subject: Subject; children: React.ReactNode }) {
  const K = useMemo(() => keys(subject.storage), [subject.storage]);
  const bank = bankOf(subject);
  const { QMAP } = bank;
  const valid = (a: Attempt | null): a is Attempt =>
    !!a && Array.isArray(a.ids) && a.ids.length > 0 && a.ids.every((id) => QMAP[id]) && typeof a.idx === "number";
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [stored, setStored] = useState<Attempt | null>(() => {
    const a = load<Attempt | null>(K.CUR, null);
    return valid(a) ? a : null;
  });
  const [last, setLast] = useState<Attempt | null>(() => {
    const a = load<Attempt | null>(K.LAST, null);
    return valid(a) ? a : null;
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const h = load<HistoryEntry[]>(K.HIST, []);
    return Array.isArray(h) ? h : [];
  });
  const [options, setOptionsState] = useState<Options>(() => ({ instant: false, ...load<Partial<Options>>(K.OPTS, {}) }));

  // guarda el intento en curso (con un pequeño retraso) para que recargar la página no pierda el avance
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!attempt) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(K.CUR, attempt), 250);
    return () => window.clearTimeout(timer.current);
  }, [attempt, K]);
  useEffect(() => {
    const flush = () => { if (attempt) save(K.CUR, attempt); };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [attempt, K]);
  useEffect(() => { if (attempt) setStored(attempt); }, [attempt]);

  const setOptions = useCallback((o: Options) => { setOptionsState(o); save(K.OPTS, o); }, [K]);

  const start = useCallback((k: StartKind) => {
    const ids = k.mode === "lesson" ? bank.pickLesson(k.week) : k.mode === "random" ? bank.pickRandom() : k.mode === "bank" ? bank.pickBank() : k.ids;
    const a = bank.createAttempt(k.mode, ids, labelFor(k, subject.unit), options.instant, k.mode === "lesson" ? k.week : undefined);
    window.clearTimeout(timer.current);
    save(K.CUR, a);
    setStored(a);
    setAttempt(a);
  }, [options.instant, bank, subject.unit, K]);

  const resume = useCallback(() => { if (stored) setAttempt(stored); }, [stored]);
  const discard = useCallback(() => { window.clearTimeout(timer.current); remove(K.CUR); setStored(null); setAttempt(null); }, [K]);

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
    const r = bank.computeResult(done);
    const entry: HistoryEntry = {
      id: a.id, date: Date.now(), mode: a.mode, week: a.week, label: a.label,
      score: Math.round(r.score * 10) / 10, n: a.ids.length, time: Math.round(a.elapsed),
    };
    setHistory((h) => {
      const next = [entry, ...h.filter((x) => x.id !== a.id)].slice(0, 40);
      save(K.HIST, next);
      return next;
    });
    window.clearTimeout(timer.current);
    save(K.LAST, done);
    remove(K.CUR);
    setLast(done);
    setStored(null);
    setAttempt(null);
  }, [bank, K]);

  const best = useMemo(() => {
    const b: Partial<Record<number, number>> = {};
    for (const h of history) if (h.mode === "lesson" && h.week && subject.units.includes(h.week)) b[h.week] = Math.max(b[h.week] ?? 0, h.score);
    return b;
  }, [history, subject.units]);

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

