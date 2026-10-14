import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "../components/Icons";
import { SlideFoot } from "../components/Slide";
import { PDF_SIZE, PDF_URL, SLIDE_COUNT, slideSrc, thumbSrc, WEEK_PAGES, WEEKS, weekOfPage, type WeekNum } from "../data/meta";
import { navigate } from "../lib/router";

const clamp = (n: number) => Math.min(SLIDE_COUNT, Math.max(1, Math.round(n) || 1));
const weekRange = (w: WeekNum): [number, number] => [WEEK_PAGES[w], w === 7 ? SLIDE_COUNT : WEEK_PAGES[(w + 1) as WeekNum] - 1];

export default function Slides({ query }: { query: URLSearchParams }) {
  const page = clamp(Number(query.get("p") ?? 1));
  const wk = weekOfPage(page);
  const [input, setInput] = useState(String(page));
  const [loadedPage, setLoadedPage] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((p: number) => navigate(`/diapositivas?p=${clamp(p)}`, { replace: true, keepScroll: true }), []);

  useEffect(() => { setInput(String(page)); }, [page]);

  // preload neighbours so flipping feels instant
  useEffect(() => {
    [page + 1, page + 2, page - 1].filter((p) => p >= 1 && p <= SLIDE_COUNT).forEach((p) => { const i = new Image(); i.src = slideSrc(p); });
  }, [page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(page + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(page - 1); }
      if (e.key === "Home") go(1);
      if (e.key === "End") go(SLIDE_COUNT);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, go]);

  const label = wk === 0 ? "Portada" : `Week ${wk}`;

  return (
    <div className="stack">
      <section className="slide viewer" aria-labelledby="viewer-title">
        <header className="slide-bar">
          <h2 id="viewer-title">Diapositivas: {label}</h2>
          <a className="bar-btn" href={PDF_URL} download>
            <Download size={16} /> <span>PDF completo ({PDF_SIZE})</span>
          </a>
        </header>
        <div className="slide-body">
          <div className="viewer-tools">
            <div className="pager">
              <button type="button" className="icon-btn" aria-label="Diapositiva anterior" disabled={page === 1} onClick={() => go(page - 1)}><ChevronLeft /></button>
              <form onSubmit={(e) => { e.preventDefault(); go(Number(input)); }} className="pager-form">
                <label htmlFor="slide-page" className="sr-only">Número de diapositiva</label>
                <input id="slide-page" inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))} onBlur={() => go(Number(input))} />
                <span className="muted">de {SLIDE_COUNT}</span>
              </form>
              <button type="button" className="icon-btn" aria-label="Diapositiva siguiente" disabled={page === SLIDE_COUNT} onClick={() => go(page + 1)}><ChevronRight /></button>
            </div>
            <div className="week-jump" role="group" aria-label="Ir a una semana">
              <button type="button" aria-pressed={wk === 0} onClick={() => go(1)}>Portada</button>
              {WEEKS.map((w) => (
                <button key={w} type="button" aria-pressed={wk === w} onClick={() => go(WEEK_PAGES[w])}>W{w}</button>
              ))}
            </div>
          </div>

          <div
            className={`stage ${loadedPage === page ? "is-loaded" : ""}`}
            ref={stageRef}
            onTouchStart={(e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }}
            onTouchEnd={(e) => {
              if (!touch.current) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
              touch.current = null;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? page + 1 : page - 1);
            }}
          >
            <img
              key={page}
              src={slideSrc(page)}
              alt={`Diapositiva ${page} de ${SLIDE_COUNT}`}
              width={1600}
              height={900}
              decoding="async"
              ref={(el) => { if (el && el.complete && el.naturalWidth) setLoadedPage(page); }}
              onLoad={() => setLoadedPage(page)}
            />
            <button type="button" className="stage-hit prev" aria-label="Anterior" tabIndex={-1} disabled={page === 1} onClick={() => go(page - 1)} />
            <button type="button" className="stage-hit next" aria-label="Siguiente" tabIndex={-1} disabled={page === SLIDE_COUNT} onClick={() => go(page + 1)} />
          </div>
          <p className="muted viewer-hint">Usa las flechas del teclado o desliza en el celular para cambiar de diapositiva.</p>
        </div>
        <SlideFoot progress={page / SLIDE_COUNT} number={page} />
      </section>

      <section aria-labelledby="thumbs-title">
        <h2 id="thumbs-title" className="section-title">Todas las diapositivas</h2>
        {([0, ...WEEKS] as (0 | WeekNum)[]).map((w) => {
          const [a, b] = w === 0 ? [1, 1] : weekRange(w);
          const pages = Array.from({ length: b - a + 1 }, (_, i) => a + i);
          return (
            <div key={w} className="thumb-group">
              <h3 className="thumb-group-title">{w === 0 ? "Portada" : `Week ${w}`} <span className="muted">{w === 0 ? "" : `diapositivas ${a} a ${b}`}</span></h3>
              <ul className="thumbs">
                {pages.map((p) => (
                  <li key={p}>
                    <a href={`/diapositivas?p=${p}`} data-thumb={p} aria-current={p === page ? "true" : undefined}
                      onClick={(e) => { e.preventDefault(); navigate(`/diapositivas?p=${p}`, { replace: true }); }}>
                      <img src={thumbSrc(p)} alt={`Diapositiva ${p}`} width={384} height={216} loading="lazy" decoding="async" />
                      <span>{p}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
