import raw from "../data/questions.json";
import type { WeekNum } from "../data/meta";

type Base = { id: string; w: WeekNum; topic: string; pts: number; q: string; code?: string; explain: string; src: string; page: number };
export type MCQ = Base & { type: "mc"; options: string[]; answer: number };
export type MultiQ = Base & { type: "multi"; options: string[]; answer: number[] };
export type TFQ = Base & { type: "tf"; answer: boolean };
export type MatchQ = Base & { type: "match"; pairs: [string, string][]; extra?: string[] };
export type OrderQ = Base & { type: "order"; items: string[] };
export type InputQ = Base & { type: "input"; answer: string[]; numeric?: boolean; placeholder?: string };
export type Question = MCQ | MultiQ | TFQ | MatchQ | OrderQ | InputQ;
export type Answer = number | number[] | boolean | string[] | string;

export const QUESTIONS = raw as unknown as Question[];
export const QMAP: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
export const TOTAL_POINTS = QUESTIONS.reduce((s, q) => s + q.pts, 0);
export const PASS = 70;

export const TYPE_LABEL: Record<Question["type"], string> = {
  mc: "Una respuesta",
  multi: "Varias respuestas",
  tf: "Verdadero o falso",
  match: "Relacionar",
  order: "Ordenar",
  input: "Respuesta corta",
};

export type Mode = "lesson" | "random" | "bank" | "review";
export type Attempt = {
  id: string;
  mode: Mode;
  week?: WeekNum;
  label: string;
  ids: string[];
  idx: number;
  answers: Record<string, Answer>;
  checked: Record<string, boolean>;
  flags: Record<string, boolean>;
  perm: Record<string, number[]>;
  choices: Record<string, string[]>;
  order0: Record<string, number[]>;
  instant: boolean;
  elapsed: number;
  startedAt: number;
  finishedAt?: number;
};

export const RANDOM_N = 20;

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const weekIds = (w: WeekNum) => QUESTIONS.filter((q) => q.w === w).map((q) => q.id);
export const pickLesson = (w: WeekNum) => shuffle(weekIds(w));
export const pickRandom = (n = RANDOM_N) => shuffle(QUESTIONS.map((q) => q.id)).slice(0, n);
export const pickBank = () => shuffle(QUESTIONS.map((q) => q.id));

export function createAttempt(mode: Mode, ids: string[], label: string, instant: boolean, week?: WeekNum): Attempt {
  const perm: Attempt["perm"] = {};
  const choices: Attempt["choices"] = {};
  const order0: Attempt["order0"] = {};
  for (const id of ids) {
    const q = QMAP[id];
    if (q.type === "mc" || q.type === "multi") perm[id] = shuffle(q.options.map((_, i) => i));
    if (q.type === "match") choices[id] = shuffle([...new Set([...q.pairs.map((p) => p[1]), ...(q.extra ?? [])])]);
    if (q.type === "order") {
      let o: number[];
      do o = shuffle(q.items.map((_, i) => i));
      while (o.every((x, i) => x === i));
      order0[id] = o;
    }
  }
  return {
    id: Math.random().toString(36).slice(2, 10),
    mode, week, label, ids, idx: 0, answers: {}, checked: {}, flags: {}, perm, choices, order0, instant,
    elapsed: 0, startedAt: Date.now(),
  };
}

const norm = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/["'`«»]/g, "").replace(/\s+/g, " ").trim();

const numOf = (s: unknown): number | null => {
  const t = String(s ?? "")
    .replace(/[$\s]/g, "")
    .replace(/−/g, "-")
    .replace(/[.,](?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  if (t === "" || Number.isNaN(Number(t))) return null;
  return Number(t);
};

/** Fracción de la pregunta obtenida (0 a 1). */
export function grade(q: Question, a: Answer | undefined): number {
  if (a === undefined || a === null) return 0;
  switch (q.type) {
    case "mc":
      return a === q.answer ? 1 : 0;
    case "tf":
      return a === q.answer ? 1 : 0;
    case "multi": {
      const sel = new Set(a as number[]);
      const cor = new Set(q.answer);
      let hit = 0, wrong = 0;
      sel.forEach((i) => (cor.has(i) ? hit++ : wrong++));
      return Math.max(0, (hit - wrong) / cor.size);
    }
    case "match": {
      const arr = a as string[];
      return q.pairs.filter((p, i) => arr[i] === p[1]).length / q.pairs.length;
    }
    case "order": {
      const arr = a as number[];
      return arr.filter((it, i) => it === i).length / q.items.length;
    }
    case "input": {
      if (q.numeric) {
        const v = numOf(a);
        return v !== null && q.answer.some((x) => numOf(x) === v) ? 1 : 0;
      }
      return q.answer.some((x) => norm(x) === norm(a)) ? 1 : 0;
    }
  }
}

export function isAnswered(q: Question, a: Answer | undefined): boolean {
  if (a === undefined || a === null) return false;
  if (q.type === "input") return String(a).trim() !== "";
  if (q.type === "multi") return (a as number[]).length > 0;
  if (q.type === "match") return (a as string[]).length === q.pairs.length && (a as string[]).every(Boolean);
  return true;
}

export function correctText(q: Question): string {
  switch (q.type) {
    case "mc": return q.options[q.answer];
    case "tf": return q.answer ? "Verdadero" : "Falso";
    case "multi": return q.answer.map((i) => q.options[i]).join(" / ");
    case "match": return q.pairs.map((p) => `${p[0]} → ${p[1]}`).join("\n");
    case "order": return q.items.map((t, i) => `${i + 1}. ${t}`).join("\n");
    case "input": return q.answer[0];
  }
}

export function answerText(q: Question, a: Answer | undefined): string {
  if (!isAnswered(q, a)) return "Sin responder";
  switch (q.type) {
    case "mc": return q.options[a as number];
    case "tf": return a ? "Verdadero" : "Falso";
    case "multi": return (a as number[]).map((i) => q.options[i]).join(" / ");
    case "match": return q.pairs.map((p, i) => `${p[0]} → ${(a as string[])[i] || "—"}`).join("\n");
    case "order": return (a as number[]).map((it, i) => `${i + 1}. ${q.items[it]}`).join("\n");
    case "input": return String(a);
  }
}

export type Row = { q: Question; a: Answer | undefined; f: number; earned: number };
export type Result = {
  rows: Row[];
  earned: number;
  possible: number;
  score: number; // 0-100
  nOk: number;
  nPart: number;
  nBad: number;
  byWeek: Partial<Record<WeekNum, { earned: number; possible: number; n: number }>>;
};

export function computeResult(att: Attempt): Result {
  let earned = 0, possible = 0, nOk = 0, nPart = 0, nBad = 0;
  const byWeek: Result["byWeek"] = {};
  const rows = att.ids.map((id) => {
    const q = QMAP[id];
    const a = att.answers[id];
    const f = grade(q, a);
    const e = q.pts * f;
    earned += e;
    possible += q.pts;
    if (f === 1) nOk++; else if (f > 0) nPart++; else nBad++;
    const b = (byWeek[q.w] ??= { earned: 0, possible: 0, n: 0 });
    b.earned += e; b.possible += q.pts; b.n++;
    return { q, a, f, earned: e };
  });
  return { rows, earned, possible, score: possible ? (earned / possible) * 100 : 0, nOk, nPart, nBad, byWeek };
}

export const fmt1 = (x: number) =>
  (Math.round(x * 10) / 10).toLocaleString("es-EC", { minimumFractionDigits: Number.isInteger(Math.round(x * 10) / 10) ? 0 : 1, maximumFractionDigits: 1 });

export const fmtTime = (s: number) => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(2, "0"), ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
