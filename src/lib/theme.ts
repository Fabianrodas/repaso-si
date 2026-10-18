import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "si-theme";
const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

function current(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return mq().matches ? "dark" : "light";
}

function apply(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#141518" : "#eceef1");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    // follow the OS only while the person hasn't picked a theme
    const m = mq();
    const onChange = () => {
      let stored: string | null = null;
      try { stored = localStorage.getItem(KEY); } catch { /* ignore */ }
      if (!stored) setTheme(m.matches ? "dark" : "light");
    };
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    setTheme(next);
  };
  return { theme, toggle };
}
