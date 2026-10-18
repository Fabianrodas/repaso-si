import { useEffect, useRef, useState } from "react";
import { Bubble } from "../components/Sheet";
import { navigate } from "../lib/router";
import { load, save } from "../lib/storage";
import { useSubject } from "../subjects";
import type { Subject } from "../subjects/types";

const posKey = (s: Subject) => (s.id === "si" ? "si-video-positions-v2" : `${s.storage}-video-positions-v1`);
const unitLabel = (s: Subject, w: number) => `${s.unitWord === "tema" ? "del Tema" : "de la Week"} ${w}`;

function Player({ w }: { w: number }) {
  const { s } = useSubject();
  const K_POS = posKey(s);
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(null);
    const src = s.videoSrc(w);
    let destroyed = false;
    let hls: { destroy: () => void } | null = null;

    const positions = load<Record<string, number>>(K_POS, {});
    const resumeAt = positions[w] ?? 0;
    const onMeta = () => { if (resumeAt > 5 && resumeAt < video.duration - 10) video.currentTime = resumeAt; };
    let lastSave = 0;
    const onTime = () => {
      const now = Date.now();
      if (now - lastSave < 4000) return;
      lastSave = now;
      const p = load<Record<string, number>>(K_POS, {});
      p[w] = video.ended ? 0 : video.currentTime;
      save(K_POS, p);
    };
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("timeupdate", onTime);

    import("hls.js").then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        const h = new Hls({ maxBufferLength: 30, enableWorker: true });
        let netRetries = 0, mediaRetries = 0;
        h.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && netRetries < 3) {
            netRetries++;
            window.setTimeout(() => h.startLoad(), 1000 * netRetries);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
            if (mediaRetries === 1) h.swapAudioCodec();
            mediaRetries++;
            h.recoverMediaError();
          } else {
            h.destroy();
            setError(data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? "No se pudo descargar el video. Revisa tu conexión y recarga la página."
              : "Tu navegador no pudo reproducir este video. Prueba con Chrome, Edge, Firefox o Safari actualizados.");
          }
        });
        h.loadSource(src);
        h.attachMedia(video);
        hls = h;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src; // Safari en iPhone/iPad reproduce HLS de forma nativa
      } else {
        setError("Tu navegador no puede reproducir este video. Prueba con Chrome, Edge, Firefox o Safari actualizados.");
      }
    }).catch(() => setError("No se pudo cargar el reproductor. Revisa tu conexión y recarga la página."));

    return () => {
      destroyed = true;
      onTime();
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("timeupdate", onTime);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [w, s]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="player">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={s.slideSrc(s.unitPages[w])}
        aria-label={`Video ${unitLabel(s, w)}`}
      >
        <track kind="subtitles" src={s.subsSrc(w)} srcLang="es" label="Español" default />
      </video>
      {error ? <p className="player-error" role="alert">{error}</p> : null}
    </div>
  );
}

export default function Videos({ query }: { query: URLSearchParams }) {
  const { s, href } = useSubject();
  const qw = Number(query.get("w"));
  const w = s.units.includes(qw) ? qw : s.units[0];
  const meta = s.videos.find((v) => v.u === w)!;
  const pick = (n: number) => navigate(href(`/videos?w=${n}`), { replace: true, keepScroll: true });

  return (
    <div className="videos">
      <h1 className="page-title v-title">Videos</h1>
      <div className="v-main">
        <Player key={w} w={w} />
        <div className="vinfo">
          <div>
            <h2>{s.unit} {w}: {s.unitShort[w]}</h2>
            <p>{meta.dur} min · subtítulos en español</p>
          </div>
          <button type="button" className="btn" onClick={() => navigate(href(`/diapositivas?p=${s.unitPages[w]}`))}>Ver diapositivas</button>
        </div>
      </div>
      <nav className="vlist" aria-label={`Elegir ${s.unitWord}`}>
        <ol>
          {s.videos.map((v) => (
            <li key={v.u}>
              <a href={href(`/videos?w=${v.u}`)} className="vrow" aria-current={v.u === w ? "true" : undefined}
                onClick={(e) => { e.preventDefault(); pick(v.u); }}>
                <Bubble size="md" filled={v.u === w}>{v.u}</Bubble>
                <span className="vrow-t">
                  <b>{s.unit} {v.u}</b>
                  <span>{s.unitShort[v.u]}</span>
                </span>
                <span className="vrow-d">{v.dur}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
