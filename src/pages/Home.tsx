import { Cover, Slide } from "../components/Slide";
import { WEEKS, WEEK_SHORT } from "../data/meta";
import { navigate } from "../lib/router";
import { useQuiz } from "../quiz/QuizContext";
import { EXAM_QUOTA, fmt1, fmtTime, isAnswered, PASS, QMAP, QUESTIONS, TOTAL_POINTS } from "../quiz/engine";

const ptsCount = QUESTIONS.reduce<Record<number, number>>((acc, q) => ((acc[q.pts] = (acc[q.pts] ?? 0) + 1), acc), {});

export default function Home() {
  const { start, stored, resume, discard, options, setOptions, history } = useQuiz();

  const go = (kind: "exam" | "bank") => { start(kind); navigate("/quiz"); };
  const doneStored = stored ? stored.ids.filter((id) => isAnswered(QMAP[id], stored.answers[id])).length : 0;

  return (
    <div className="stack">
      <Cover title="Intelligent Systems" lines={["Repaso para el examen", "100 preguntas, 7 videos y 249 diapositivas de las semanas 1 a 7"]} />

      {stored ? (
        <div className="resume" role="region" aria-label="Intento sin terminar">
          <p><strong>Tienes un intento sin terminar.</strong> {stored.label}: {doneStored} de {stored.ids.length} respondidas, {fmtTime(stored.elapsed)} de tiempo.</p>
          <div className="btn-row">
            <button type="button" className="btn ghost" onClick={discard}>Descartar</button>
            <button type="button" className="btn primary" onClick={() => { resume(); navigate("/quiz"); }}>Continuar intento</button>
          </div>
        </div>
      ) : null}

      <Slide title="Elige cómo practicar" id="modes" number={1}>
        <div className="modes">
          <article className="mode">
            <p className="mode-num" aria-hidden="true">20</p>
            <h3>Examen</h3>
            <ul className="dots">
              <li>20 preguntas al azar, repartidas entre las 7 semanas.</li>
              <li>Cada intento sale distinto.</li>
              <li>Toma entre 25 y 30 minutos.</li>
            </ul>
            <button type="button" className="btn primary" onClick={() => go("exam")}>Empezar examen</button>
          </article>
          <article className="mode">
            <p className="mode-num" aria-hidden="true">100</p>
            <h3>Banco completo</h3>
            <ul className="dots">
              <li>Las 100 preguntas, {TOTAL_POINTS} puntos posibles.</li>
              <li>Tu avance se guarda si cierras la página.</li>
              <li>En orden por semana o al azar.</li>
            </ul>
            <button type="button" className="btn primary" onClick={() => go("bank")}>Empezar banco completo</button>
          </article>
        </div>
        <div className="mode-options">
          <label className="check">
            <input type="checkbox" checked={options.instant} onChange={(e) => setOptions({ ...options, instant: e.target.checked })} />
            <span>Mostrar la respuesta correcta al contestar cada pregunta</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={options.shuffleBank} onChange={(e) => setOptions({ ...options, shuffleBank: e.target.checked })} />
            <span>Banco completo en orden aleatorio</span>
          </label>
        </div>
      </Slide>

      <div className="two-col">
        <Slide title="Cómo se califica" id="grading" number={2}>
          <ul className="dots">
            <li>Cada pregunta vale entre 2 y 5 puntos según su dificultad.</li>
            <li>Relacionar, ordenar y varias correctas dan crédito parcial; en varias correctas, una marca equivocada resta.</li>
            <li>Tu nota es tus puntos divididos para los puntos posibles, por 100. Se aprueba con {PASS}.</li>
          </ul>
          <div className="pts-legend" aria-label="Distribución de puntos">
            {Object.keys(ptsCount).sort().map((p) => (
              <span key={p} className="pts-tag"><b>{p} pts</b> {ptsCount[Number(p)]} preguntas</span>
            ))}
          </div>
        </Slide>

        <Slide title="Tus intentos" id="history" number={3}>
          {history.length ? (
            <table className="tbl history">
              <thead><tr><th scope="col">Fecha</th><th scope="col">Modo</th><th scope="col" className="num">Nota</th></tr></thead>
              <tbody>
                {history.slice(0, 6).map((h) => (
                  <tr key={h.id + h.date}>
                    <td>{new Date(h.date).toLocaleDateString("es-EC", { day: "2-digit", month: "short" })}</td>
                    <td>{h.label}</td>
                    <td className={`num score ${h.score >= PASS ? "pass" : "fail"}`}>{fmt1(h.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Cuando termines un examen o el banco, tus notas aparecerán aquí. Se guardan solo en este navegador.</p>
          )}
        </Slide>
      </div>

      <Slide title="Qué cubre el banco de preguntas" id="coverage" number={4}>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead><tr><th scope="col">Semana</th><th scope="col">Tema</th><th scope="col" className="num">Preguntas</th><th scope="col" className="num">Puntos</th><th scope="col" className="num hide-sm">En el examen</th></tr></thead>
            <tbody>
              {WEEKS.map((w) => {
                const qs = QUESTIONS.filter((q) => q.w === w);
                return (
                  <tr key={w}>
                    <td className="nowrap">Week {w}</td>
                    <td>{WEEK_SHORT[w]}</td>
                    <td className="num">{qs.length}</td>
                    <td className="num">{qs.reduce((s, q) => s + q.pts, 0)}</td>
                    <td className="num hide-sm">{EXAM_QUOTA[w]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Slide>
    </div>
  );
}
