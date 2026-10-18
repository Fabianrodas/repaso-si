import { SITE } from "../data/meta";
import { useLinkClick } from "../lib/router";
import { useTheme } from "../lib/theme";
import { GitHub, Moon, Sun } from "./Icons";

const NAV = [
  { href: "/", label: "Practicar", match: (p: string) => p === "/" || p === "/quiz" || p === "/resultados" },
  { href: "/videos", label: "Videos", match: (p: string) => p.startsWith("/videos") },
  { href: "/diapositivas", label: "Diapositivas", match: (p: string) => p.startsWith("/diapositivas") },
];

export function Header({ path }: { path: string }) {
  const onLink = useLinkClick();
  const { theme, toggle } = useTheme();
  return (
    <header className="top">
      <div className="wrap top-row">
        <a href="/" className="mark" onClick={onLink} aria-label="Sistemas Inteligentes, inicio">
          <span className="mark-bub" aria-hidden="true">SI</span>
          <span className="mark-name">Sistemas Inteligentes</span>
        </a>
        <nav className="nav" aria-label="Secciones">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={onLink} aria-current={n.match(path) ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
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
