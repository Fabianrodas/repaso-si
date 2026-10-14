import { SITE } from "../data/meta";
import { useLinkClick } from "../lib/router";
import { useTheme } from "../lib/theme";
import { GitHub, Moon, Sun } from "./Icons";

const NAV = [
  { href: "/", label: "Quiz", match: (p: string) => p === "/" || p === "/quiz" || p === "/resultados" },
  { href: "/videos", label: "Videos", match: (p: string) => p.startsWith("/videos") },
  { href: "/diapositivas", label: "Diapositivas", match: (p: string) => p.startsWith("/diapositivas") },
];

export function Header({ path }: { path: string }) {
  const onLink = useLinkClick();
  const { theme, toggle } = useTheme();
  return (
    <header className="site-header">
      <div className="wrap site-header-row">
        <a href="/" className="brand" onClick={onLink} aria-label="Intelligent Systems, inicio">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          <span className="brand-name">{SITE.title}</span>
          <span className="brand-sub">Repaso</span>
        </a>
        <nav className="site-nav" aria-label="Secciones">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={onLink} aria-current={n.match(path) ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
        <button type="button" className="theme-toggle" onClick={toggle} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} title={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="slide-line footer-line" aria-hidden="true"><i style={{ width: "50%" }} /></div>
        <div className="site-footer-row">
          <p>Hecho por <strong>{SITE.author}</strong> para repasar Sistemas Inteligentes, semanas 1 a 7.</p>
          <a className="gh-link" href={SITE.github} target="_blank" rel="noopener noreferrer">
            <GitHub /> <span>{SITE.githubLabel}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
