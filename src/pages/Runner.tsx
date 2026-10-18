import { useCallback, useEffect, useRef, useState } from "react";
import { Flag } from "../components/Icons";
import { Modal } from "../components/Modal";
import { Bubble } from "../components/Sheet";
import { navigate } from "../lib/router";
import { useQuiz } from "../quiz/QuizContext";
import { CodeBlock, Feedback, QuestionBody, QuestionMeta } from "../quiz/QuestionView";
import { fmtTime, grade, isAnswered } from "../quiz/engine";
import { useSubject } from "../subjects";

function Timer({ base, onTick }: { base: number; onTick: (s: number) => void }) {
  const [shown, setShown] = useState(base);
  const acc = useRef(0);
  useEffect(() => {
    let last = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      const d = Math.min(5, (now - last) / 1000); // si la pestaña estuvo dormida no se cuenta ese tiempo
      last = now;
      acc.current += d;
      setShown((s) => s + d);
      if (acc.current >= 5) { onTick(acc.current); acc.current = 0; }
    }, 1000);
    return () => { window.clearInterval(t); if (acc.current > 0) { onTick(acc.current); acc.current = 0; } };
  }, [onTick]);
  return <span className="timer" role="timer" aria-label="Tiempo">{fmtTime(shown)}</span>;
}

export default function Runner() {
  const { attempt, stored, resume, setAnswer, goTo, check, toggleFlag, finish, addTime } = useQuiz();
  const [confirm, setConfirm] = useState<null | "finish" | "exit">(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const { bank, href } = useSubject();
  const { QMAP } = bank;

  // al recargar /quiz: retoma el intento guardado, o vuelve al inicio si no hay ninguno
  useEffect(() => {
    if (!attempt) {
      if (stored) resume();
      else navigate(href("/"), { replace: true });
    }
  }, [attempt, stored, resume]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!attempt) return;
    if (first.current) { first.current = false; return; }
    headRef.current?.focus({ preventScroll: true });
    const el = document.querySelector<HTMLElement>(".qcard");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    if (window.scrollY > top + 4) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
  }, [attempt?.idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // las preguntas de ordenar cuentan como respondidas al verlas (su orden inicial ya es una respuesta)
  const curId = attempt ? attempt.ids[attempt.idx] : undefined;
  useEffect(() => {
    if (!attempt || !curId) return;
    const cq = QMAP[curId];
    if (cq.type === "order" && attempt.answers[curId] === undefined) setAnswer(curId, attempt.order0[curId]);
  }, [curId, attempt, setAnswer, QMAP]);

  const doFinish = useCallback(() => { finish(); navigate(href("/resultados")); }, [finish]); // eslint-disable-line react-hooks/exhaustive-deps

  // ← y → para moverse entre preguntas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!attempt || confirm) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowRight" && attempt.idx < attempt.ids.length - 1) goTo(attempt.idx + 1);
      if (e.key === "ArrowLeft" && attempt.idx > 0) goTo(attempt.idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attempt, confirm, goTo]);

  if (!attempt) return null;
  const q = QMAP[attempt.ids[attempt.idx]];
  const a = attempt.answers[q.id];
  const locked = !!attempt.checked[q.id];
  const n = attempt.ids.length;
  const last = attempt.idx === n - 1;
  const answeredCount = attempt.ids.filter((id) => isAnswered(QMAP[id], attempt.answers[id])).length;
  const left = n - answeredCount;
  const canCheck = attempt.instant && !locked;

  const next = () => {
    if (last) { if (left === 0) doFinish(); else setConfirm("finish"); return; }
    goTo(attempt.idx + 1);
  };
  const onEnter = () => { if (canCheck && isAnswered(q, a)) check(q.id); else next(); };

  return (
    <div className="run">
      <div className="run-head">
        <div className="run-top">
          <p className="run-title">{attempt.label}</p>
          <Timer base={attempt.elapsed} onTick={addTime} />
          <button type="button" className="btn quiet" onClick={() => setConfirm("exit")}>Salir</button>
          <button type="button" className="btn" onClick={() => (left === 0 ? doFinish() : setConfirm("finish"))}>Terminar</button>
        </div>
        <div className="meter" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin={0} aria-valuemax={n} aria-valuenow={answeredCount}>
          <i style={{ width: `${(answeredCount / n) * 100}%` }} />
        </div>
      </div>

      <article className="sheet qcard" aria-labelledby="q-title" data-qid={q.id}>
        <div className="q-grid">
          <div className="q-prompt">
            <h2 id="q-title" ref={headRef} tabIndex={-1} className="q-num">
              {attempt.idx + 1}<span> de {n}</span>
              {attempt.flags[q.id] ? <span className="q-flag"><Flag size={15} /> Marcada</span> : null}
            </h2>
            <QuestionMeta q={q} />
            <p className="q-text">{q.q}</p>
            {q.code ? <CodeBlock code={q.code} /> : null}
          </div>
          <div className="q-answer">
            <QuestionBody key={q.id} q={q} attempt={attempt} locked={locked} onAnswer={(v) => setAnswer(q.id, v)} onEnter={onEnter} />
            {locked ? <Feedback q={q} a={a} onSlide={(p) => navigate(href(`/diapositivas?p=${p}`))} /> : null}
          </div>
        </div>
      </article>

      <div className="run-nav">
        <button type="button" className="btn quiet nav-prev" disabled={attempt.idx === 0} onClick={() => goTo(attempt.idx - 1)}>Anterior</button>
        <button type="button" className={`btn quiet nav-flag ${attempt.flags[q.id] ? "is-on" : ""}`} aria-pressed={!!attempt.flags[q.id]} onClick={() => toggleFlag(q.id)}>
          <Flag size={16} /> {attempt.flags[q.id] ? "Desmarcar" : "Marcar"}
        </button>
        {canCheck ? <button type="button" className="btn nav-check" disabled={!isAnswered(q, a)} onClick={() => check(q.id)}>Comprobar</button> : null}
        <button type="button" className="btn primary nav-next" onClick={next}>{last ? "Terminar" : "Siguiente"}</button>
      </div>

      <section className="grid-sheet" aria-labelledby="grid-title">
        <h3 id="grid-title">Hoja de respuestas <span>{answeredCount} de {n}</span></h3>
        <div className={`grid ${n > 40 ? "is-dense" : ""}`}>
          {attempt.ids.map((id, i) => {
            const qq = QMAP[id];
            const done = isAnswered(qq, attempt.answers[id]);
            let state: "ok" | "bad" | undefined;
            if (attempt.checked[id]) state = grade(qq, attempt.answers[id]) === 1 ? "ok" : "bad";
            return (
              <button key={id} type="button" className={`cell ${i === attempt.idx ? "is-current" : ""} ${attempt.flags[id] ? "is-flag" : ""}`}
                aria-label={`Pregunta ${i + 1}${done ? ", respondida" : ""}${attempt.flags[id] ? ", marcada" : ""}`}
                aria-current={i === attempt.idx ? "step" : undefined} onClick={() => goTo(i)}>
                <Bubble size="sm" filled={done && !state} state={state}>{i + 1}</Bubble>
              </button>
            );
          })}
        </div>
      </section>

      {confirm === "finish" ? (
        <Modal title="¿Terminar ahora?" onClose={() => setConfirm(null)}
          actions={[{ label: "Seguir", onClick: () => setConfirm(null) }, { label: "Terminar y calificar", primary: true, onClick: doFinish }]}>
          Te falta{left === 1 ? "" : "n"} {left} pregunta{left === 1 ? "" : "s"}. Cuentan como 0.
        </Modal>
      ) : null}
      {confirm === "exit" ? (
        <Modal title="¿Salir?" onClose={() => setConfirm(null)}
          actions={[{ label: "Quedarme", onClick: () => setConfirm(null) }, { label: "Salir", primary: true, onClick: () => navigate(href("/")) }]}>
          Tu avance queda guardado y puedes continuarlo desde el inicio.
        </Modal>
      ) : null}
    </div>
  );
}
