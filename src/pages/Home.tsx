import { useState } from "react";
import { Modal } from "../components/Modal";
import { Bubble } from "../components/Sheet";
import { WEEKS, WEEK_SHORT } from "../data/meta";
import { navigate } from "../lib/router";
import { useQuiz, TOTAL_Q, type StartKind } from "../quiz/QuizContext";
import { fmt1, fmtTime, isAnswered, PASS, QMAP, RANDOM_N, weekIds } from "../quiz/engine";

export default function Home() {
  const { start, stored, resume, discard, options, setOptions, history, best } = useQuiz();
  const [pending, setPending] = useState<StartKind | null>(null);

  const answered = stored ? stored.ids.filter((id) => isAnswered(QMAP[id], stored.answers[id])).length : 0;
  const begin = (k: StartKind) => { start(k); navigate("/quiz"); };
  const go = (k: StartKind) => (stored && answered > 0 ? setPending(k) : begin(k));

  return (
    <div className="home">
      <h1 className="hero">¿Qué repasas hoy?</h1>

      {stored ? (
        <div className="resume" role="region" aria-label="Intento sin terminar">
          <p><b>{stored.label}</b> sin terminar: {answered} de {stored.ids.length} respondidas, {fmtTime(stored.elapsed)}</p>
          <div className="row">
            <button type="button" className="btn quiet" onClick={discard}>Descartar</button>
            <button type="button" className="btn primary" onClick={() => { resume(); navigate("/quiz"); }}>Continuar</button>
          </div>
        </div>
      ) : null}

      <section className="sheet lessons" aria-labelledby="lessons-title">
        <header className="sheet-head">
          <h2 id="lessons-title">Lección por semana</h2>
          <p>{weekIds(1).length} preguntas de cada semana</p>
        </header>
        <ol className="weeks">
          {WEEKS.map((w) => (
            <li key={w}>
              <button type="button" className="week" onClick={() => go({ mode: "lesson", week: w })}
                aria-label={`Lección Week ${w}: ${WEEK_SHORT[w]}${best[w] !== undefined ? `, mejor nota ${fmt1(best[w]!)}` : ""}`}>
                <Bubble size="lg" filled={best[w] !== undefined}>{w}</Bubble>
                <span className="week-name">{WEEK_SHORT[w]}</span>
                {best[w] !== undefined ? <span className={`week-best ${best[w]! >= PASS ? "is-pass" : ""}`}>Mejor: {fmt1(best[w]!)}</span> : null}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <div className="mixes">
        <button type="button" className="mix" onClick={() => go({ mode: "random" })}>
          <span className="mix-n">{RANDOM_N}</span>
          <span className="mix-t"><b>Al azar</b><span>de todas las semanas</span></span>
        </button>
        <button type="button" className="mix" onClick={() => go({ mode: "bank" })}>
          <span className="mix-n">{TOTAL_Q}</span>
          <span className="mix-t"><b>Banco completo</b><span>todas las preguntas</span></span>
        </button>
      </div>

      <label className="switch">
        <input type="checkbox" checked={options.instant} onChange={(e) => setOptions({ ...options, instant: e.target.checked })} />
        <span className="switch-ui" aria-hidden="true" />
        <span>Ver la respuesta al contestar cada pregunta</span>
      </label>

      {history.length ? (
        <section className="recent" aria-labelledby="recent-title">
          <h2 id="recent-title">Últimos intentos</h2>
          <ul>
            {history.slice(0, 5).map((h) => (
              <li key={h.id + h.date}>
                <span className="recent-name">{h.label}</span>
                <span className="recent-date">{new Date(h.date).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}</span>
                <span className={`recent-score ${h.score >= PASS ? "is-pass" : "is-fail"}`}>{fmt1(h.score)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending ? (
        <Modal title="Tienes un intento sin terminar" onClose={() => setPending(null)}
          actions={[
            { label: "Continuar el anterior", onClick: () => { setPending(null); resume(); navigate("/quiz"); } },
            { label: "Empezar uno nuevo", primary: true, onClick: () => { const k = pending; setPending(null); begin(k); } },
          ]}>
          {stored?.label}: llevas {answered} de {stored?.ids.length}. Si empiezas otro, se pierde ese avance.
        </Modal>
      ) : null}
    </div>
  );
}
