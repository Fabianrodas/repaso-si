import { useEffect, useRef, useState } from "react";
import type { Review } from "../subjects/types";
import { HlsPlayer } from "./HlsPlayer";

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Video de repaso de toda la materia, con capítulos que saltan al minuto de cada parte. */
export function ReviewBlock({ r, storage }: { r: Review; storage: string }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [cur, setCur] = useState(-1);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onTime = () => {
      let i = -1;
      r.chapters.forEach((c, k) => { if (v.currentTime >= c.t - 0.5) i = k; });
      setCur(i);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  });

  const jump = (t: number) => {
    const v = video.current;
    if (!v) return;
    const go = () => { v.currentTime = t; void v.play().catch(() => {}); };
    if (v.readyState >= 1) go();
    else v.addEventListener("loadedmetadata", go, { once: true });
    if (window.matchMedia("(max-width: 900px)").matches) v.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="review-final" aria-labelledby="rf-title">
      <div className="rf-player">
        <HlsPlayer src={r.src} subs={r.subs} poster={r.poster} label={r.title} posKey={`${storage}-review-position-v1`} posId="final" videoRef={video} />
      </div>
      <div className="rf-info">
        <p className="rf-kicker">Repaso final · {r.dur} min</p>
        <h2 id="rf-title" className="rf-title">{r.title}</h2>
        <p className="rf-blurb">{r.blurb}</p>
        <ol className="rf-chapters" aria-label="Capítulos">
          {r.chapters.map((c, i) => (
            <li key={c.t}>
              <button type="button" className="rf-ch" aria-current={i === cur ? "true" : undefined} onClick={() => jump(c.t)}>
                <span className="rf-n" aria-hidden="true">{i + 1}</span>
                <span className="rf-l"><b>{c.label}</b>{c.sub ? <small>{c.sub}</small> : null}</span>
                <span className="rf-t">{mmss(c.t)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
