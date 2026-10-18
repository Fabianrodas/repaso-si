import { SITE } from "../subjects";
import type { Subject } from "../subjects/types";
import { useLinkClick } from "../lib/router";
import { useTheme } from "../lib/theme";
import { GitHub, Grid, Moon, Sun } from "./Icons";

const NAV = [
  { p: "/", label: "Practicar", match: (p: string) => p === "/" || p === "/quiz" || p === "/resultados" },
  { p: "/videos", label: "Videos", match: (p: string) => p.startsWith("/videos") },
  { p: "/diapositivas", label: "Diapositivas", short: "Diapos", match: (p: string) => p.startsWith("/diapositivas") },
];

export function Header({ subject, sub }: { subject: Subject | null; sub: string }) {
  const onLink = useLinkClick();
  const { theme, toggle } = useTheme();
  return (
    <header className={`top ${subject ? "" : "is-root"}`}>
      <div className="wrap top-row">
        {subject ? (
          <a href={subject.base} className="mark" onClick={onLink} aria-label={`${subject.name}, inicio`}>
            <span className="mark-bub" aria-hidden="true">{subject.short}</span>
            <span className="mark-name">{subject.name}</span>
          </a>
        ) : (
          <a href="/" className="mark is-root" onClick={onLink} aria-label={`${SITE.title}, elegir materia`}>
            <span className="mark-bub" aria-hidden="true">R</span>
            <span className="mark-name">{SITE.title}</span>
          </a>
        )}
        {subject ? (
          <nav className="nav" aria-label="Secciones">
            {NAV.map((n) => (
              <a key={n.p} href={n.p === "/" ? subject.base : subject.base + n.p} onClick={onLink} aria-current={n.match(sub) ? "page" : undefined}>
                {"short" in n ? <><span className="nl-long">{n.label}</span><span className="nl-short" aria-hidden="true">{n.short}</span></> : n.label}
              </a>
            ))}
          </nav>
        ) : null}
        {subject ? (
          <a href="/" className="switch-subj" onClick={onLink} aria-label="Cambiar de materia" title="Cambiar de materia">
            <Grid size={18} /><span>Materias</span>
          </a>
        ) : null}
        <button type="button" className="theme" onClick={toggle} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-row">
        <p>Hecho por <strong>{SITE.author}</strong></p>
        <a href={SITE.github} target="_blank" rel="noopener noreferrer"><GitHub size={16} /> {SITE.githubLabel}</a>
      </div>
    </footer>
  );
}
