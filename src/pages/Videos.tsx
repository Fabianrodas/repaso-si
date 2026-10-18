import { useEffect, useRef, useState } from "react";
import { Bubble } from "../components/Sheet";
import { slideSrc, subsSrc, VIDEOS, videoSrc, WEEK_PAGES, WEEK_SHORT, type WeekNum } from "../data/meta";
import { navigate } from "../lib/router";
import { load, save } from "../lib/storage";

const K_POS = "si-video-positions-v2";

function Player({ w }: { w: WeekNum }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(null);
    const src = videoSrc(w);
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
  }, [w]);

  return (
    <div className="player">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={slideSrc(WEEK_PAGES[w])}
        aria-label={`Video de la Week ${w}`}
      >
        <track kind="subtitles" src={subsSrc(w)} srcLang="es" label="Español" default />
      </video>
      {error ? <p className="player-error" role="alert">{error}</p> : null}
    </div>
  );
}

export default function Videos({ query }: { query: URLSearchParams }) {
  const qw = Number(query.get("w"));
  const w = (qw >= 1 && qw <= 7 ? qw : 1) as WeekNum;
  const meta = VIDEOS.find((v) => v.w === w)!;
  const pick = (n: WeekNum) => navigate(`/videos?w=${n}`, { replace: true, keepScroll: true });

  return (
    <div className="videos">
      <h1 className="page-title">Videos</h1>
      <div className="vweeks" role="group" aria-label="Elegir semana">
        {VIDEOS.map((v) => (
          <a key={v.w} href={`/videos?w=${v.w}`} className="vweek" aria-current={v.w === w ? "true" : undefined}
            onClick={(e) => { e.preventDefault(); pick(v.w); }}>
            <Bubble size="md" filled={v.w === w}>{v.w}</Bubble>
            <span>{v.dur}</span>
          </a>
        ))}
      </div>
      <Player key={w} w={w} />
      <div className="vinfo">
        <h2>Week {w}: {WEEK_SHORT[w]}</h2>
        <p>{meta.dur} min, subtítulos en español</p>
        <button type="button" className="link" onClick={() => navigate(`/diapositivas?p=${WEEK_PAGES[w]}`)}>Ver las diapositivas de esta semana</button>
      </div>
    </div>
  );
}
