import { useState } from "react";
import { ArrowRight, Play, Slides } from "../components/Icons";
import { Modal } from "../components/Modal";
import { ReviewBlock } from "../components/Review";
import { Bubble } from "../components/Sheet";
import { navigate, useLinkClick } from "../lib/router";
import { useSubject } from "../subjects";
import { useQuiz, type StartKind } from "../quiz/QuizContext";
import { fmt1, fmtTime, isAnswered, PASS, RANDOM_N } from "../quiz/engine";

export default function Home() {
  const { start, stored, resume, discard, options, setOptions, history, best } = useQuiz();
  const [pending, setPending] = useState<StartKind | null>(null);
  const onLink = useLinkClick();
  const { s, bank, href } = useSubject();
  const { QMAP, TOTAL_Q } = bank;
  const lessonN = bank.weekIds(s.units[0]).length;
  const allSame = s.units.every((u) => bank.weekIds(u).length === lessonN);

  const answered = stored ? stored.ids.filter((id) => isAnswered(QMAP[id], stored.answers[id])).length : 0;
  const begin = (k: StartKind) => { start(k); navigate(href("/quiz")); };
  const go = (k: StartKind) => (stored && answered > 0 ? setPending(k) : begin(k));

  return (
    <div className="home">
      <div className="home-head">
        <h1 className="hero">¿Qué repasas hoy?</h1>
        <label className="switch">
          <input type="checkbox" checked={options.instant} onChange={(e) => setOptions({ ...options, instant: e.target.checked })} />
          <span className="switch-ui" aria-hidden="true" />
          <span>Ver la respuesta al contestar cada pregunta</span>
        </label>
      </div>

      {stored ? (
        <div className="resume" role="region" aria-label="Intento sin terminar">
          <div className="resume-meter" aria-hidden="true"><i style={{ width: `${(answered / stored.ids.length) * 100}%` }} /></div>
          <p><b>{stored.label}</b> sin terminar · {answered} de {stored.ids.length} · {fmtTime(stored.elapsed)}</p>
          <div className="row">
            <button type="button" className="btn quiet" onClick={discard}>Descartar</button>
            <button type="button" className="btn primary" onClick={() => { resume(); navigate(href("/quiz")); }}>Continuar</button>
          </div>
        </div>
      ) : null}

      {s.review ? <ReviewBlock r={s.review} storage={s.storage} /> : null}

      <section className="lessons" aria-labelledby="lessons-title">
        <h2 id="lessons-title" className="sec-title">Lección por {s.unitWord} {allSame ? <span>{lessonN} preguntas</span> : null}</h2>
        <ol className="weeks" data-n={s.units.length}>
          {s.units.map((w) => {
            const b = best[w];
            return (
              <li key={w} className="week-card">
                <button type="button" className="week" onClick={() => go({ mode: "lesson", week: w })}
                  aria-label={`Lección ${s.unit} ${w}: ${s.unitShort[w]}${b !== undefined ? `, mejor nota ${fmt1(b)}` : ""}`}>
                  <Bubble size="lg" filled={b !== undefined}>{w}</Bubble>
                  <span className="week-name">{s.unitShort[w]}</span>
                  <span className="week-foot" aria-hidden="true">
                    <span className={`week-bar ${b === undefined ? "" : b >= PASS ? "is-pass" : "is-fail"}`}><i style={{ width: `${b ?? 0}%` }} /></span>
                    <span className="week-best">{b !== undefined ? fmt1(b) : "–"}</span>
                  </span>
                </button>
                <div className="week-links">
                  <a href={href(`/videos?w=${w}`)} onClick={onLink} aria-label={`Video ${s.unitWord === "tema" ? "del Tema" : "de la Week"} ${w}`}><Play size={12} /> Video</a>
                  <a href={href(`/diapositivas?p=${s.unitPages[w]}`)} onClick={onLink} aria-label={`Diapositivas ${s.unitWord === "tema" ? "del Tema" : "de la Week"} ${w}`}><Slides size={14} /> Diapos</a>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="home-grid">
        <button type="button" className="mix" onClick={() => go({ mode: "random" })}>
          <span className="mix-n">{RANDOM_N}</span>
          <span className="mix-t"><b>Al azar</b><span>de {s.unitWord === "tema" ? "todos los temas" : "todas las semanas"}</span></span>
          <ArrowRight className="mix-go" size={22} />
        </button>
        <button type="button" className="mix" onClick={() => go({ mode: "bank" })}>
          <span className="mix-n">{TOTAL_Q}</span>
          <span className="mix-t"><b>Banco completo</b><span>todas las preguntas</span></span>
          <ArrowRight className="mix-go" size={22} />
        </button>
        <section className="sheet recent" aria-labelledby="recent-title">
          <h2 id="recent-title">Últimos intentos</h2>
          {history.length ? (
            <ul>
              {history.slice(0, 5).map((h) => (
                <li key={h.id + h.date}>
                  <span className="recent-name">{h.label}</span>
                  <span className="recent-date">{new Date(h.date).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}</span>
                  <span className={`recent-score ${h.score >= PASS ? "is-pass" : "is-fail"}`}>{fmt1(h.score)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="recent-empty">Aquí aparecerán tus notas.</p>
          )}
        </section>
      </div>

      {pending ? (
        <Modal title="Tienes un intento sin terminar" onClose={() => setPending(null)}
          actions={[
            { label: "Continuar el anterior", onClick: () => { setPending(null); resume(); navigate(href("/quiz")); } },
            { label: "Empezar uno nuevo", primary: true, onClick: () => { const k = pending; setPending(null); begin(k); } },
          ]}>
          {stored?.label}: llevas {answered} de {stored?.ids.length}. Si empiezas otro, se pierde ese avance.
        </Modal>
      ) : null}
    </div>
  );
}
