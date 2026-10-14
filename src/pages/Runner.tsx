import { useEffect, useRef, useState } from "react";
import { Flag } from "../components/Icons";
import { Modal } from "../components/Modal";
import { SlideFoot } from "../components/Slide";
import { navigate } from "../lib/router";
import { useQuiz } from "../quiz/QuizContext";
import { CodeBlock, Feedback, QuestionBody, QuestionMeta } from "../quiz/QuestionView";
import { fmtTime, grade, isAnswered, QMAP } from "../quiz/engine";

function Timer({ base, onTick }: { base: number; onTick: (s: number) => void }) {
  const [shown, setShown] = useState(base);
  const acc = useRef(0);
  useEffect(() => {
    let last = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      const d = (now - last) / 1000;
      last = now;
      acc.current += d;
      setShown((s) => s + d);
      if (acc.current >= 5) { onTick(acc.current); acc.current = 0; }
    }, 1000);
    return () => { window.clearInterval(t); if (acc.current > 0) { onTick(acc.current); acc.current = 0; } };
  }, [onTick]);
  return <span className="timer" aria-label="Tiempo transcurrido">{fmtTime(shown)}</span>;
}

export default function Runner() {
  const { attempt, stored, resume, setAnswer, goTo, check, toggleFlag, finish, addTime } = useQuiz();
  const [confirm, setConfirm] = useState<null | "finish" | "exit">(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  // reload on /quiz: pick the saved attempt back up, or go home if there is none
  useEffect(() => {
    if (!attempt) {
      if (stored) resume();
      else navigate("/", { replace: true });
    }
  }, [attempt, stored, resume]);

  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
    // bring the question back into view when jumping from the bottom palette
    const el = document.querySelector<HTMLElement>(".runner");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY > top + 4) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
  }, [attempt?.idx]);

  // order questions count as answered once seen (their initial order is a valid answer)
  const curId = attempt ? attempt.ids[attempt.idx] : undefined;
  useEffect(() => {
    if (!attempt || !curId) return;
    const cq = QMAP[curId];
    if (cq.type === "order" && attempt.answers[curId] === undefined) setAnswer(curId, attempt.order0[curId]);
  }, [curId, attempt, setAnswer]);

  if (!attempt) return null;
  const q = QMAP[attempt.ids[attempt.idx]];
  const a = attempt.answers[q.id];
  const locked = !!attempt.checked[q.id];
  const last = attempt.idx === attempt.ids.length - 1;
  const answeredCount = attempt.ids.filter((id) => isAnswered(QMAP[id], attempt.answers[id])).length;
  const left = attempt.ids.length - answeredCount;
  const canCheck = attempt.instant && !locked;

  const next = () => {
    if (last) { if (left === 0) doFinish(); else setConfirm("finish"); return; }
    goTo(attempt.idx + 1);
  };
  const doFinish = () => { finish(); navigate("/resultados"); };
  const onEnter = () => { if (canCheck && isAnswered(q, a)) check(q.id); else next(); };

  return (
    <div className="runner">
      <div className="runner-bar">
        <p className="runner-title">{attempt.label}</p>
        <Timer base={attempt.elapsed} onTick={addTime} />
        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={() => setConfirm("exit")}>Salir</button>
          <button type="button" className="btn" onClick={() => (left === 0 ? doFinish() : setConfirm("finish"))}>Terminar<span className="hide-sm"> y calificar</span></button>
        </div>
      </div>

      <article className="slide q-slide" aria-labelledby="q-title" data-qid={q.id}>
        <header className="slide-bar">
          <h2 id="q-title" ref={headRef} tabIndex={-1}>Pregunta {attempt.idx + 1} de {attempt.ids.length}</h2>
          {attempt.flags[q.id] ? <div className="slide-bar-aside"><Flag size={16} /> Marcada</div> : null}
        </header>
        <div className="slide-body">
          <QuestionMeta q={q} />
          <p className="q-text">{q.q}</p>
          {q.code ? <CodeBlock code={q.code} /> : null}
          <QuestionBody key={q.id} q={q} attempt={attempt} locked={locked} onAnswer={(v) => setAnswer(q.id, v)} onEnter={onEnter} />
          {locked ? <Feedback q={q} a={a} onSlide={(p) => navigate(`/diapositivas?p=${p}`)} /> : null}
        </div>
        <SlideFoot progress={(attempt.idx + 1) / attempt.ids.length} number={attempt.idx + 1} />
      </article>

      <div className="q-nav">
        <button type="button" className="btn nav-prev" disabled={attempt.idx === 0} onClick={() => goTo(attempt.idx - 1)}>Anterior</button>
        <button type="button" className={`btn ghost nav-flag flag-btn ${attempt.flags[q.id] ? "is-on" : ""}`} aria-pressed={!!attempt.flags[q.id]} onClick={() => toggleFlag(q.id)}>
          <Flag size={16} /> {attempt.flags[q.id] ? "Quitar marca" : "Marcar para revisar"}
        </button>
        {canCheck ? <button type="button" className="btn nav-check" disabled={!isAnswered(q, a)} onClick={() => check(q.id)}>Comprobar</button> : null}
        <button type="button" className="btn primary nav-next" onClick={next}>{last ? "Terminar y calificar" : "Siguiente"}</button>
      </div>

      <details className="palette" open>
        <summary>Todas las preguntas <span className="muted">({answeredCount} de {attempt.ids.length} respondidas)</span></summary>
        <div className="palette-grid">
          {attempt.ids.map((id, i) => {
            const qq = QMAP[id];
            const done = isAnswered(qq, attempt.answers[id]);
            let cls = done ? "is-done" : "";
            if (attempt.checked[id]) { const f = grade(qq, attempt.answers[id]); cls = f === 1 ? "is-ok" : f > 0 ? "is-part" : "is-bad"; }
            return (
              <button key={id} type="button" className={`${cls} ${i === attempt.idx ? "is-current" : ""} ${attempt.flags[id] ? "is-flag" : ""}`}
                aria-label={`Pregunta ${i + 1}${done ? ", respondida" : ""}${attempt.flags[id] ? ", marcada" : ""}`}
                aria-current={i === attempt.idx ? "step" : undefined}
                onClick={() => goTo(i)}>{i + 1}</button>
            );
          })}
        </div>
        <div className="palette-legend">
          <span><i className="lg-done" /> Respondida</span>
          <span><i className="lg-flag" /> Marcada para revisar</span>
        </div>
      </details>

      {confirm === "finish" ? (
        <Modal title="¿Terminar el intento?" onClose={() => setConfirm(null)}
          actions={[{ label: "Seguir respondiendo", onClick: () => setConfirm(null) }, { label: "Terminar y calificar", primary: true, onClick: doFinish }]}>
          Te faltan {left} pregunta{left === 1 ? "" : "s"} sin responder. Contarán como 0 puntos.
        </Modal>
      ) : null}
      {confirm === "exit" ? (
        <Modal title="¿Salir del intento?" onClose={() => setConfirm(null)}
          actions={[{ label: "Quedarme", onClick: () => setConfirm(null) }, { label: "Salir", primary: true, onClick: () => navigate("/") }]}>
          Tu avance queda guardado en este navegador. Puedes continuarlo desde la página de inicio.
        </Modal>
      ) : null}
    </div>
  );
}
