import { Bubble } from "../components/Sheet";
import { navigate } from "../lib/router";
import { HlsPlayer } from "../components/HlsPlayer";
import { useSubject } from "../subjects";
import type { Subject } from "../subjects/types";

const posKey = (s: Subject) => (s.id === "si" ? "si-video-positions-v2" : `${s.storage}-video-positions-v1`);
const unitLabel = (s: Subject, w: number) => `${s.unitWord === "tema" ? "del Tema" : "de la Week"} ${w}`;

function Player({ w }: { w: number }) {
  const { s } = useSubject();
  return <HlsPlayer src={s.videoSrc(w)} subs={s.subsSrc(w)} poster={s.slideSrc(s.unitPages[w])} label={`Video ${unitLabel(s, w)}`} posKey={posKey(s)} posId={String(w)} />;
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
