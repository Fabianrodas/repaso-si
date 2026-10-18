// Datos del sitio: autor, semanas, videos y diapositivas.

export const SITE = {
  title: "Intelligent Systems",
  author: "Fabián Rodas",
  github: "https://github.com/Fabianrodas",
  githubLabel: "github.com/Fabianrodas",
};

export type WeekNum = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const WEEKS: WeekNum[] = [1, 2, 3, 4, 5, 6, 7];

export const WEEK_INFO: Record<WeekNum, { topic: string; dates: string }> = {
  1: { topic: "Introducción a la IA: definición, historia, casos de uso y ética", dates: "01.09.2026 – 03.09.2026" },
  2: { topic: "IA débil y fuerte, machine learning, ciencia de datos y tipos de datos", dates: "08.09.2026 – 10.09.2026" },
  3: { topic: "Jupyter, Google Colab y fundamentos de Python", dates: "15.09.2026 – 17.09.2026" },
  4: { topic: "Algoritmos y modelos, división del dataset y tipos de aprendizaje", dates: "22.09.2026 – 24.09.2026" },
  5: { topic: "Módulos de Python y exploración de datos con Pandas", dates: "29.09.2026 – 01.10.2026" },
  6: { topic: "Variables, regresión, Matplotlib y NumPy", dates: "06.10.2026 – 08.10.2026" },
  7: { topic: "Función de pérdida, función de costo y mejor ajuste", dates: "13.10.2026 – 15.10.2026" },
};

export const WEEK_SHORT: Record<WeekNum, string> = {
  1: "Qué es la IA",
  2: "Datos y machine learning",
  3: "Colab y Python",
  4: "Tipos de aprendizaje",
  5: "Pandas",
  6: "Regresión y NumPy",
  7: "Pérdida y costo",
};

export const VIDEOS: { w: WeekNum; dur: string; seconds: number }[] = [
  { w: 1, dur: "18:40", seconds: 1120 },
  { w: 2, dur: "18:59", seconds: 1140 },
  { w: 3, dur: "16:51", seconds: 1012 },
  { w: 4, dur: "12:46", seconds: 766 },
  { w: 5, dur: "14:02", seconds: 843 },
  { w: 6, dur: "15:22", seconds: 923 },
  { w: 7, dur: "11:21", seconds: 681 },
];

export const videoSrc = (w: WeekNum) => `/media/videos/w${w}/index.m3u8`;
export const subsSrc = (w: WeekNum) => `/media/subs/w${w}.vtt`;

export const SLIDE_COUNT = 249;
/** Primera página de cada semana en el PDF unificado (página 1 = portada). */
export const WEEK_PAGES: Record<WeekNum, number> = { 1: 2, 2: 42, 3: 87, 4: 136, 5: 164, 6: 202, 7: 241 };
export const pad3 = (n: number) => String(n).padStart(3, "0");
export const slideSrc = (p: number) => `/media/slides/${pad3(p)}.webp`;
export const thumbSrc = (p: number) => `/media/thumbs/${pad3(p)}.webp`;
export const weekOfPage = (p: number): WeekNum | 0 => {
  let wk: WeekNum | 0 = 0;
  for (const w of WEEKS) if (p >= WEEK_PAGES[w]) wk = w;
  return wk;
};
export const PDF_URL = "/media/pdf/Sistemas-Inteligentes-Weeks-1-7.pdf";
export const PDF_SIZE = "15,9 MB";
