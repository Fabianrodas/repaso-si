import { useEffect, useMemo, useState } from "react";
import { PenCircle, Tick } from "../components/Sheet";
import { WEEK_SHORT, type WeekNum } from "../data/meta";
import { navigate } from "../lib/router";
import { useQuiz, type StartKind } from "../quiz/QuizContext";
import { CodeBlock } from "../quiz/QuestionView";
import { answerText, computeResult, correctText, fmt1, fmtTime, PASS, shuffle } from "../quiz/engine";

type Filter = "review" | "all";

export default function Results() {
  const { last, start } = useQuiz();
  const result = useMemo(() => (last ? computeResult(last) : null), [last]);
  const [filter, setFilter] = useState<Filter>("review");

  useEffect(() => { if (!last) navigate("/", { replace: true }); }, [last]);
  useEffect(() => { if (result && result.nPart + result.nBad === 0) setFilter("all"); }, [result]);
  if (!last || !result) return null;

  const pass = result.score >= PASS;
  const failed = result.rows.filter((r) => r.f < 1).map((r) => r.q.id);
  const rows = result.rows.map((r, i) => ({ ...r, n: i + 1 })).filter((r) => (filter === "all" ? true : r.f < 1));
  const weeks = (Object.keys(result.byWeek) as unknown as WeekNum[]).map(Number).sort() as WeekNum[];
  const again: StartKind | null = last.mode === "lesson" && last.week ? { mode: "lesson", week: last.week }
    : last.mode === "random" ? { mode: "random" } : last.mode === "bank" ? { mode: "bank" } : null;
  const go = (k: StartKind) => { start(k); navigate("/quiz"); };

  return (
    <div className="results">
      <div className="res-side">
      <section className="sheet grade" aria-labelledby="grade-title">
        <h1 id="grade-title" className="sr-only">Resultado</h1>
        <p className="grade-label">{last.label}</p>
        <div className="grade-score" aria-label={`Nota ${fmt1(result.score)} sobre 100`}>
          <PenCircle />
          <span className="grade-n">{fmt1(result.score)}</span>
          <span className="grade-of">/100</span>
        </div>
        <p className={`grade-verdict ${pass ? "is-pass" : "is-fail"}`}>{pass ? "Aprobado" : `Te faltan ${fmt1(PASS - result.score)} para llegar a 70`}</p>
        <dl className="grade-stats">
          <div><dt>Correctas</dt><dd>{result.nOk}</dd></div>
          {result.nPart ? <div><dt>Parciales</dt><dd>{result.nPart}</dd></div> : null}
          <div><dt>Incorrectas</dt><dd>{result.nBad}</dd></div>
          <div><dt>Puntos</dt><dd>{fmt1(result.earned)}/{result.possible}</dd></div>
          <div><dt>Tiempo</dt><dd>{fmtTime(last.elapsed)}</dd></div>
        </dl>
        <div className="row grade-actions">
          {failed.length ? (
            <button type="button" className="btn primary" onClick={() => go({ mode: "review", ids: shuffle(failed), label: `Repaso de ${failed.length} falladas` })}>
              Repasar {failed.length} fallada{failed.length === 1 ? "" : "s"}
            </button>
          ) : null}
          {again ? <button type="button" className="btn" onClick={() => go(again)}>Otra vez</button> : null}
          <button type="button" className="btn quiet" onClick={() => navigate("/")}>Inicio</button>
        </div>
      </section>

      {weeks.length > 1 ? (
        <section className="sheet byweek" aria-labelledby="bw-title">
          <h2 id="bw-title">Por semana</h2>
          <ul>
            {weeks.map((w) => {
              const v = result.byWeek[w]!;
              const pct = (v.earned / v.possible) * 100;
              return (
                <li key={w}>
                  <span className="bw-w">Week {w}</span>
                  <span className="bw-t">{WEEK_SHORT[w]}</span>
                  <span className={`bw-bar ${pct >= PASS ? "is-pass" : "is-fail"}`} role="img" aria-label={`${Math.round(pct)} por ciento`}><i style={{ width: `${pct}%` }} /></span>
                  <span className="bw-v">{Math.round(pct)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      </div>

      <section className="review" aria-labelledby="rv-title">
        <div className="review-head">
          <h2 id="rv-title">Revisión</h2>
          <div className="seg" role="group" aria-label="Filtrar preguntas">
            <button type="button" aria-pressed={filter === "review"} onClick={() => setFilter("review")}>Para repasar ({result.nPart + result.nBad})</button>
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas ({result.rows.length})</button>
          </div>
        </div>
        {rows.length ? (
          <ol className="rv-list">
            {rows.map((r) => {
              const tone = r.f === 1 ? "ok" : r.f > 0 ? "part" : "bad";
              return (
                <li key={r.q.id} className={`rv rv-${tone}`}>
                  <div className="rv-top">
                    <span className="rv-n">{r.n}</span>
                    <Tick ok={r.f === 1} />
                    <span className="rv-topic">Week {r.q.w}: {r.q.topic}</span>
                    <span className="rv-pts">{fmt1(r.earned)}/{r.q.pts} pts</span>
                  </div>
                  <div className="rv-grid">
                    <div className="rv-left">
                      <p className="rv-q">{r.q.q}</p>
                      {r.q.code ? <CodeBlock code={r.q.code} /> : null}
                    </div>
                    <div className="rv-right">
                      <dl className="rv-ans">
                        {r.f < 1 ? <div><dt>Tu respuesta</dt><dd>{answerText(r.q, r.a)}</dd></div> : null}
                        <div><dt>Correcta</dt><dd>{correctText(r.q)}</dd></div>
                      </dl>
                      <p className="rv-why">{r.q.explain}</p>
                      <button type="button" className="link" onClick={() => navigate(`/diapositivas?p=${r.q.page}`)}>Ver diapositiva {r.q.page}</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="empty">Todo correcto. No hay nada que repasar.</p>
        )}
      </section>
    </div>
  );
}
