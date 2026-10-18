import { createContext, useContext } from "react";
import { makeBank, type Bank } from "../quiz/engine";
import { IS2 } from "./is2";
import { SI } from "./si";
import type { Subject, SubjectId } from "./types";

export const SITE = {
  title: "Repaso UEES",
  author: "Fabián Rodas",
  github: "https://github.com/Fabianrodas",
  githubLabel: "github.com/Fabianrodas",
};

export const SUBJECTS: Subject[] = [SI, IS2];
export const SUBJECT_BY_ID: Record<SubjectId, Subject> = { si: SI, is2: IS2 };

const banks = new Map<SubjectId, Bank>();
export const bankOf = (s: Subject) => {
  let b = banks.get(s.id);
  if (!b) { b = makeBank(s.questions); banks.set(s.id, b); }
  return b;
};

/** Separa /is2/videos en { subject: IS2, sub: "/videos" }. */
export function splitPath(path: string): { subject: Subject | null; sub: string } {
  for (const s of SUBJECTS) {
    if (path === s.base || path.startsWith(s.base + "/")) return { subject: s, sub: path.slice(s.base.length) || "/" };
  }
  return { subject: null, sub: path };
}

export const SubjectCtx = createContext<Subject>(SI);
export function useSubject() {
  const s = useContext(SubjectCtx);
  return { s, bank: bankOf(s), href: (p: string) => (p === "/" ? s.base : s.base + p) };
}
