import { useEffect, useRef, useState } from "react";
import { load, save } from "../lib/storage";

/** Reproductor HLS reutilizable: recuerda la posición en localStorage (posKey → { posId: segundos }). */
export function HlsPlayer({ src, subs, poster, label, posKey: K_POS, posId, videoRef }: {
  src: string; subs: string; poster: string; label: string; posKey: string; posId: string; videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (videoRef) videoRef.current = ref.current; });
  const w = posId;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(null);
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
  }, [src, K_POS, w]);

  return (
    <div className="player">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={label}
      >
        <track kind="subtitles" src={subs} srcLang="es" label="Español" default />
      </video>
      {error ? <p className="player-error" role="alert">{error}</p> : null}
    </div>
  );
}

