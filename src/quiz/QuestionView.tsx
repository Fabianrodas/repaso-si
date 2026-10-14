import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, Check, X } from "../components/Icons";
import { correctText, fmt1, grade, TYPE_LABEL, type Answer, type Attempt, type Question } from "./engine";

const LETTERS = "ABCDEFGH";

export function QuestionMeta({ q }: { q: Question }) {
  return (
    <div className="q-meta">
      <span className="tag tag-pts">{q.pts} puntos</span>
      <span className="tag">Week {q.w}: {q.topic}</span>
      <span className="tag">{TYPE_LABEL[q.type]}</span>
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code"><code>{code}</code></pre>
  );
}

type Props = {
  q: Question;
  attempt: Attempt;
  locked: boolean;
  onAnswer: (a: Answer) => void;
  onEnter?: () => void;
};

export function QuestionBody({ q, attempt, locked, onAnswer, onEnter }: Props) {
  const a = attempt.answers[q.id];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (q.type === "input" && !locked && window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
  }, [q.id, q.type, locked]);

  if (q.type === "mc" || q.type === "multi") {
    const order = attempt.perm[q.id] ?? q.options.map((_, i) => i);
    const selected = (oi: number) => (q.type === "mc" ? a === oi : ((a as number[] | undefined) ?? []).includes(oi));
    const isCorrect = (oi: number) => (q.type === "mc" ? oi === q.answer : q.answer.includes(oi));
    return (
      <div>
        {q.type === "multi" ? <p className="hint">Marca todas las que sean correctas. Cada marca equivocada resta.</p> : null}
        <div className="options" role={q.type === "mc" ? "radiogroup" : "group"} aria-label="Opciones">
          {order.map((oi, k) => {
            const on = selected(oi);
            let state = "";
            if (locked) state = isCorrect(oi) ? "is-correct" : on ? "is-wrong" : "";
            return (
              <button
                key={oi}
                type="button"
                role={q.type === "mc" ? "radio" : "checkbox"}
                aria-checked={on}
                disabled={locked}
                className={`option ${q.type === "multi" ? "option-multi" : ""} ${on ? "is-on" : ""} ${state}`}
                onClick={() => {
                  if (q.type === "mc") onAnswer(oi);
                  else {
                    const s = new Set((a as number[] | undefined) ?? []);
                    if (s.has(oi)) s.delete(oi); else s.add(oi);
                    onAnswer([...s].sort((x, y) => x - y));
                  }
                }}
              >
                <span className="option-key" aria-hidden="true">{locked && state === "is-correct" ? <Check size={15} /> : locked && state === "is-wrong" ? <X size={15} /> : LETTERS[k]}</span>
                <span className="option-text">{q.options[oi]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "tf") {
    return (
      <div className="options options-tf" role="radiogroup" aria-label="Verdadero o falso">
        {([[true, "Verdadero"], [false, "Falso"]] as const).map(([v, label]) => {
          const on = a === v;
          const state = locked ? (v === q.answer ? "is-correct" : on ? "is-wrong" : "") : "";
          return (
            <button key={label} type="button" role="radio" aria-checked={on} disabled={locked} className={`option ${on ? "is-on" : ""} ${state}`} onClick={() => onAnswer(v)}>
              <span className="option-key" aria-hidden="true">{label[0]}</span>
              <span className="option-text">{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === "match") {
    const cur = (a as string[] | undefined) ?? q.pairs.map(() => "");
    const choices = attempt.choices[q.id] ?? q.pairs.map((p) => p[1]);
    return (
      <div className="match">
        <p className="hint">Elige la opción que corresponde a cada elemento. Una opción puede repetirse.</p>
        {q.pairs.map((p, i) => {
          const id = `m-${q.id}-${i}`;
          const state = locked ? (cur[i] === p[1] ? "is-correct" : "is-wrong") : "";
          return (
            <div key={i} className={`match-row ${state}`}>
              <label htmlFor={id} className="match-left">{p[0]}</label>
              <select
                id={id}
                value={cur[i]}
                disabled={locked}
                onChange={(e) => { const v = cur.slice(); v[i] = e.target.value; onAnswer(v); }}
              >
                <option value="">Elige…</option>
                {choices.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "order") {
    const ord = (a as number[] | undefined) ?? attempt.order0[q.id] ?? q.items.map((_, i) => i);
    const move = (i: number, d: number) => { const o = ord.slice(); [o[i], o[i + d]] = [o[i + d], o[i]]; onAnswer(o); };
    return (
      <div>
        <p className="hint">Mueve cada elemento con las flechas hasta dejarlos en orden. Si ya está bien, solo continúa.</p>
        <ol className="order">
          {ord.map((it, i) => {
            const state = locked ? (it === i ? "is-correct" : "is-wrong") : "";
            return (
              <li key={it} className={`order-item ${state}`}>
                <span className="order-pos" aria-hidden="true">{i + 1}</span>
                <span className="order-text">{q.items[it]}</span>
                <span className="order-moves">
                  <button type="button" className="icon-btn" aria-label={`Subir: ${q.items[it]}`} disabled={locked || i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
                  <button type="button" className="icon-btn" aria-label={`Bajar: ${q.items[it]}`} disabled={locked || i === ord.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // input
  const state = locked ? (grade(q, a) === 1 ? "is-correct" : "is-wrong") : "";
  return (
    <div className="short">
      <label htmlFor={`inp-${q.id}`} className="sr-only">Tu respuesta</label>
      <input
        ref={inputRef}
        id={`inp-${q.id}`}
        className={`input ${state}`}
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={q.placeholder ?? "Tu respuesta"}
        value={(a as string | undefined) ?? ""}
        disabled={locked}
        onChange={(e) => onAnswer(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter?.(); } }}
      />
    </div>
  );
}

export function Feedback({ q, a, onSlide }: { q: Question; a: Answer | undefined; onSlide: (p: number) => void }) {
  const f = grade(q, a);
  const cls = f === 1 ? "ok" : f > 0 ? "part" : "bad";
  const verdict = f === 1 ? `Correcta. Sumas ${fmt1(q.pts)} puntos.` : f > 0 ? `Parcialmente correcta. Sumas ${fmt1(q.pts * f)} de ${q.pts} puntos.` : `Incorrecta. 0 de ${q.pts} puntos.`;
  return (
    <div className={`feedback ${cls}`} role="status">
      <p className="feedback-verdict">{verdict}</p>
      {f < 1 ? (
        <div className="feedback-answer"><span>Respuesta correcta</span><p>{correctText(q)}</p></div>
      ) : null}
      <p>{q.explain}</p>
      <p className="feedback-src">
        {q.src}.{" "}
        <button type="button" className="link-btn" onClick={() => onSlide(q.page)}>Ver diapositiva {q.page}</button>
      </p>
    </div>
  );
}
