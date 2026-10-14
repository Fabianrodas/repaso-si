import { useEffect, useMemo, useState } from "react";
import { Slide } from "../components/Slide";
import { WEEK_SHORT, type WeekNum } from "../data/meta";
import { navigate } from "../lib/router";
import { useQuiz } from "../quiz/QuizContext";
import { CodeBlock } from "../quiz/QuestionView";
import { answerText, computeResult, correctText, fmt1, fmtTime, PASS, shuffle, TYPE_LABEL } from "../quiz/engine";

type Filter = "review" | "all" | "ok";

export default function Results() {
  const { last, start } = useQuiz();
  const result = useMemo(() => (last ? computeResult(last) : null), [last]);
  const [filter, setFilter] = useState<Filter>("review");

  useEffect(() => { if (!last) navigate("/", { replace: true }); }, [last]);
  useEffect(() => { if (result && result.nPart + result.nBad === 0) setFilter("all"); }, [result]);
  if (!last || !result) return null;

  const pass = result.score >= PASS;
  const failed = result.rows.filter((r) => r.f < 1).map((r) => r.q.id);
  const rows = result.rows.map((r, i) => ({ ...r, n: i + 1 })).filter((r) => (filter === "all" ? true : filter === "ok" ? r.f === 1 : r.f < 1));

  return (
    <div className="stack">
      <div className={`cover result-cover ${pass ? "is-pass" : "is-fail"}`}>
        <div className="cover-block">
          <p className="result-label">{last.label}</p>
          <p className="result-score" aria-label={`Nota ${fmt1(result.score)} sobre 100`}>
            <span>{fmt1(result.score)}</span><small>/100</small>
          </p>
          <p className="cover-line result-verdict">{pass ? "Aprobado: superas la nota mínima de 70." : `Aún no llegas a 70. Te faltan ${fmt1(PASS - result.score)} puntos de nota.`}</p>
        </div>
      </div>

      <Slide title="Resumen del intento" id="summary" number={1}>
        <dl className="stats">
          <div><dt>Puntos</dt><dd>{fmt1(result.earned)} de {result.possible}</dd></div>
          <div><dt>Correctas</dt><dd>{result.nOk}</dd></div>
          <div><dt>Parciales</dt><dd>{result.nPart}</dd></div>
          <div><dt>Incorrectas</dt><dd>{result.nBad}</dd></div>
          <div><dt>Tiempo</dt><dd>{fmtTime(last.elapsed)}</dd></div>
        </dl>
        <div className="btn-row">
          {failed.length ? (
            <button type="button" className="btn primary" onClick={() => { start({ ids: shuffle(failed), label: `Repaso de ${failed.length} preguntas falladas` }); navigate("/quiz"); }}>
              Repasar las {failed.length} falladas
            </button>
          ) : null}
          <button type="button" className="btn" onClick={() => { start("exam"); navigate("/quiz"); }}>Nuevo examen de 20</button>
          <button type="button" className="btn ghost" onClick={() => navigate("/")}>Volver al inicio</button>
        </div>
      </Slide>

      <Slide title="Resultado por semana" id="byweek" number={2}>
        <ul className="week-bars">
          {(Object.keys(result.byWeek) as unknown as WeekNum[]).sort().map((wk) => {
            const w = Number(wk) as WeekNum;
            const v = result.byWeek[w]!;
            const pct = (v.earned / v.possible) * 100;
            const tone = pct >= PASS ? "ok" : pct >= 40 ? "part" : "bad";
            return (
              <li key={w}>
                <span className="wb-name">Week {w}</span>
                <span className="wb-topic">{WEEK_SHORT[w]}</span>
                <span className={`wb-track tone-${tone}`} role="img" aria-label={`${Math.round(pct)} por ciento`}><i style={{ width: `${pct}%` }} /></span>
                <span className="wb-val">{Math.round(pct)}%</span>
              </li>
            );
          })}
        </ul>
      </Slide>

      <Slide title="Revisión de respuestas" id="review" number={3}
        aside={
          <div className="seg" role="group" aria-label="Filtrar">
            {([["review", `Para repasar (${result.nPart + result.nBad})`], ["all", "Todas"], ["ok", `Correctas (${result.nOk})`]] as [Filter, string][]).map(([f, label]) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{label}</button>
            ))}
          </div>
        }>
        {rows.length ? (
          <ol className="review-list">
            {rows.map((r) => {
              const cls = r.f === 1 ? "ok" : r.f > 0 ? "part" : "bad";
              return (
                <li key={r.q.id} className={`review-item tone-${cls}`}>
                  <div className="review-head">
                    <span className="review-n">{r.n}</span>
                    <span className="tag">Week {r.q.w}: {r.q.topic}</span>
                    <span className="tag">{TYPE_LABEL[r.q.type]}</span>
                    <span className={`review-pts tone-text-${cls}`}>{fmt1(r.earned)} de {r.q.pts} pts</span>
                  </div>
                  <p className="review-q">{r.q.q}</p>
                  {r.q.code ? <CodeBlock code={r.q.code} /> : null}
                  <dl className="review-ans">
                    <div><dt>Tu respuesta</dt><dd>{answerText(r.q, r.a)}</dd></div>
                    <div><dt>Correcta</dt><dd>{correctText(r.q)}</dd></div>
                  </dl>
                  <p className="review-ex">{r.q.explain}</p>
                  <p className="review-src">{r.q.src}. <button type="button" className="link-btn" onClick={() => navigate(`/diapositivas?p=${r.q.page}`)}>Ver diapositiva {r.q.page}</button></p>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="muted">{filter === "ok" ? "Ninguna respuesta completamente correcta todavía." : "No tienes preguntas para repasar. Todas fueron correctas."}</p>
        )}
      </Slide>
    </div>
  );
}
