import type { Question } from "../quiz/engine";

export type SubjectId = "si" | "is2";

export type VideoMeta = { u: number; dur: string; seconds: number };

/** Todo lo que cambia entre materias: unidades, videos, diapositivas, preguntas y claves de almacenamiento. */
export type Subject = {
  id: SubjectId;
  /** Prefijo de las rutas: /si o /is2. */
  base: string;
  name: string;
  /** Texto de la burbuja del logo. */
  short: string;
  /** "Week" o "Tema". */
  unit: string;
  /** Abreviatura en los saltos de diapositivas: W1, T1… */
  unitAbbr: string;
  /** "semana" o "tema", en minúscula, para frases. */
  unitWord: string;
  units: number[];
  unitShort: Record<number, string>;
  unitTopic: Record<number, string>;
  videos: VideoMeta[];
  videoSrc: (u: number) => string;
  subsSrc: (u: number) => string;
  slideCount: number;
  /** Primera página de cada unidad en el PDF unificado (página 1 = portada). */
  unitPages: Record<number, number>;
  slideSrc: (p: number) => string;
  thumbSrc: (p: number) => string;
  pdfUrl: string;
  pdfSize: string;
  questions: Question[];
  /** Prefijo de las claves de localStorage. */
  storage: string;
  favicon: string;
};

export const pad3 = (n: number) => String(n).padStart(3, "0");

export const unitOfPage = (s: Subject, p: number): number => {
  let u = 0;
  for (const x of s.units) if (p >= s.unitPages[x]) u = x;
  return u;
};

export const unitRange = (s: Subject, u: number): [number, number] => {
  const i = s.units.indexOf(u);
  const next = s.units[i + 1];
  return [s.unitPages[u], next === undefined ? s.slideCount : s.unitPages[next] - 1];
};
