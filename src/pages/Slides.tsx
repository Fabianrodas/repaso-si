import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "../components/Icons";
import { navigate } from "../lib/router";
import { useSubject } from "../subjects";
import { unitOfPage, unitRange } from "../subjects/types";

export default function Slides({ query }: { query: URLSearchParams }) {
  const { s, href } = useSubject();
  const { slideCount: SLIDE_COUNT, slideSrc, thumbSrc, unitPages: WEEK_PAGES, units: WEEKS } = s;
  const clamp = (n: number) => Math.min(SLIDE_COUNT, Math.max(1, Math.round(n) || 1));
  const weekRange = (w: number) => unitRange(s, w);
  const weekOfPage = (p: number) => unitOfPage(s, p);
  const page = clamp(Number(query.get("p") ?? 1));
  const wk = weekOfPage(page);
  const [input, setInput] = useState(String(page));
  const [loadedPage, setLoadedPage] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((p: number) => navigate(href(`/diapositivas?p=${clamp(p)}`), { replace: true, keepScroll: true }), [s]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setInput(String(page)); }, [page]);

  // en pantallas grandes, la columna lateral muestra la semana actual y sigue a la diapositiva abierta
  const sideRange: [number, number] = wk === 0 ? [1, 1] : weekRange(wk);
  const sidePages = Array.from({ length: sideRange[1] - sideRange[0] + 1 }, (_, i) => sideRange[0] + i);
  const sideRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = sideRef.current;
    if (!list || !list.offsetParent) return;
    const el = list.querySelector<HTMLElement>('[aria-current="true"]');
    if (!el) return;
    const top = el.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + el.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 2 + el.offsetHeight / 2) });
    }
  }, [page]);

  // precarga las vecinas para que pasar de diapositiva sea instantáneo
  useEffect(() => {
    [page + 1, page + 2, page - 1].filter((p) => p >= 1 && p <= SLIDE_COUNT).forEach((p) => { const i = new Image(); i.src = slideSrc(p); });
  }, [page, s]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(page + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(page - 1); }
      if (e.key === "Home") { e.preventDefault(); go(1); }
      if (e.key === "End") { e.preventDefault(); go(SLIDE_COUNT); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, go, SLIDE_COUNT]);

  return (
    <div className="slides">
      <div className="slides-head">
        <h1 className="page-title">Diapositivas</h1>
        <a className="btn quiet" href={s.pdfUrl} download><Download size={16} /> PDF ({s.pdfSize})</a>
      </div>

      <div className="viewer">
        <div className="viewer-bar">
          <div className="pager">
            <button type="button" className="icon-btn" aria-label="Anterior" disabled={page === 1} onClick={() => go(page - 1)}><ChevronLeft /></button>
            <form onSubmit={(e) => { e.preventDefault(); go(Number(input)); }}>
              <label htmlFor="slide-page" className="sr-only">Número de diapositiva</label>
              <input id="slide-page" className="pager-in" inputMode="numeric" value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 3))} onBlur={() => go(Number(input))} />
              <span className="pager-of">/ {SLIDE_COUNT}</span>
            </form>
            <button type="button" className="icon-btn" aria-label="Siguiente" disabled={page === SLIDE_COUNT} onClick={() => go(page + 1)}><ChevronRight /></button>
          </div>
          <div className="wjump" role="group" aria-label={`Ir a ${s.unitWord === "tema" ? "un tema" : "una semana"}`}>
            {WEEKS.map((w) => (
              <button key={w} type="button" aria-pressed={wk === w} onClick={() => go(WEEK_PAGES[w])} aria-label={`${s.unit} ${w}`}>{s.unitAbbr}{w}</button>
            ))}
          </div>
        </div>

        <div
          className={`stage ${loadedPage === page ? "is-loaded" : ""}`}
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
          <button type="button" className="hit prev" aria-label="Anterior" tabIndex={-1} disabled={page === 1} onClick={() => go(page - 1)} />
          <button type="button" className="hit next" aria-label="Siguiente" tabIndex={-1} disabled={page === SLIDE_COUNT} onClick={() => go(page + 1)} />
        </div>
      </div>

      <aside className="s-side" aria-label={`Diapositivas ${s.unitWord === "tema" ? "de este tema" : "de esta semana"}`}>
        <div className="s-box">
          <h2 className="s-head">{wk === 0 ? "Portada" : `${s.unit} ${wk}`} <span>{sideRange[0]}–{sideRange[1]}</span></h2>
          <ul className="s-thumbs" ref={sideRef}>
            {sidePages.map((p) => (
              <li key={p}>
                <a href={href(`/diapositivas?p=${p}`)} aria-current={p === page ? "true" : undefined}
                  onClick={(e) => { e.preventDefault(); go(p); }}>
                  <img src={thumbSrc(p)} alt={`Diapositiva ${p}`} width={384} height={216} loading="lazy" decoding="async" />
                  <span>{p}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="thumbs-wrap" aria-label="Todas las diapositivas">
        {[0, ...WEEKS].map((w) => {
          const [a, b] = w === 0 ? [1, 1] : weekRange(w);
          const pages = Array.from({ length: b - a + 1 }, (_, i) => a + i);
          return (
            <div key={w} className="tgroup">
              <h2>{w === 0 ? "Portada" : `${s.unit} ${w}`}</h2>
              <ul className="thumbs">
                {pages.map((p) => (
                  <li key={p}>
                    <a href={href(`/diapositivas?p=${p}`)} data-thumb={p} aria-current={p === page ? "true" : undefined}
                      onClick={(e) => { e.preventDefault(); navigate(href(`/diapositivas?p=${p}`), { replace: true }); }}>
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
