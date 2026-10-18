import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp } from "../components/Icons";
import { Bubble, Tick } from "../components/Sheet";
import { correctText, fmt1, grade, TYPE_LABEL, type Answer, type Attempt, type Question } from "./engine";

const LETTERS = "ABCDEFGH";

export function QuestionMeta({ q }: { q: Question }) {
  return (
    <p className="q-meta">
      <span>Week {q.w}: {q.topic}</span>
      <span className="q-pts">{q.pts} pts</span>
      {q.type !== "mc" ? <span>{TYPE_LABEL[q.type]}</span> : null}
    </p>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return <pre className="code"><code>{code}</code></pre>;
}

type Props = { q: Question; attempt: Attempt; locked: boolean; onAnswer: (a: Answer) => void; onEnter?: () => void };

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
        {q.type === "multi" ? <p className="hint">Marca todas las correctas. Una marca de más resta.</p> : null}
        <div className="opts" role={q.type === "mc" ? "radiogroup" : "group"} aria-label="Opciones">
          {order.map((oi, k) => {
            const on = selected(oi);
            const state = locked ? (isCorrect(oi) ? "ok" : on ? "bad" : undefined) : undefined;
            return (
              <button
                key={oi}
                type="button"
                role={q.type === "mc" ? "radio" : "checkbox"}
                aria-checked={on}
                disabled={locked}
                className={`opt ${on ? "is-on" : ""} ${state ? `is-${state}` : ""}`}
                onClick={() => {
                  if (q.type === "mc") onAnswer(oi);
                  else {
                    const s = new Set((a as number[] | undefined) ?? []);
                    if (s.has(oi)) s.delete(oi); else s.add(oi);
                    onAnswer([...s].sort((x, y) => x - y));
                  }
                }}
              >
                <Bubble filled={on} state={state === "ok" && !on ? "key" : state}>{LETTERS[k]}</Bubble>
                <span className="opt-txt">{q.options[oi]}</span>
                {state ? <Tick ok={state === "ok"} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "tf") {
    return (
      <div className="opts opts-tf" role="radiogroup" aria-label="Verdadero o falso">
        {([[true, "Verdadero"], [false, "Falso"]] as const).map(([v, label]) => {
          const on = a === v;
          const state = locked ? (v === q.answer ? "ok" : on ? "bad" : undefined) : undefined;
          return (
            <button key={label} type="button" role="radio" aria-checked={on} disabled={locked}
              className={`opt ${on ? "is-on" : ""} ${state ? `is-${state}` : ""}`} onClick={() => onAnswer(v)}>
              <Bubble filled={on} state={state === "ok" && !on ? "key" : state}>{label[0]}</Bubble>
              <span className="opt-txt">{label}</span>
              {state ? <Tick ok={state === "ok"} /> : null}
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
        {q.pairs.map((p, i) => {
          const id = `m-${q.id}-${i}`;
          const state = locked ? (cur[i] === p[1] ? "is-ok" : "is-bad") : "";
          return (
            <div key={i} className={`match-row ${state}`}>
              <label htmlFor={id}>{p[0]}</label>
              <select id={id} value={cur[i]} disabled={locked}
                onChange={(e) => { const v = cur.slice(); v[i] = e.target.value; onAnswer(v); }}>
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
      <ol className="order">
        {ord.map((it, i) => {
          const state = locked ? (it === i ? "is-ok" : "is-bad") : "";
          return (
            <li key={it} className={`order-row ${state}`}>
              <Bubble size="sm">{i + 1}</Bubble>
              <span className="order-txt">{q.items[it]}</span>
              <span className="order-btns">
                <button type="button" className="icon-btn" aria-label={`Subir: ${q.items[it]}`} disabled={locked || i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
                <button type="button" className="icon-btn" aria-label={`Bajar: ${q.items[it]}`} disabled={locked || i === ord.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  const state = locked ? (grade(q, a) === 1 ? "is-ok" : "is-bad") : "";
  return (
    <div className="short">
      <label htmlFor={`inp-${q.id}`} className="sr-only">Tu respuesta</label>
      <input
        ref={inputRef}
        id={`inp-${q.id}`}
        className={`field ${state}`}
        type="text"
        inputMode={q.numeric ? "decimal" : "text"}
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
  const tone = f === 1 ? "ok" : f > 0 ? "part" : "bad";
  const verdict = f === 1 ? `Correcta: +${fmt1(q.pts)} pts` : f > 0 ? `Parcial: ${fmt1(q.pts * f)} de ${q.pts} pts` : `Incorrecta: 0 de ${q.pts} pts`;
  return (
    <div className={`fb fb-${tone}`} role="status">
      <p className="fb-verdict"><Tick ok={f === 1} /> {verdict}</p>
      {f < 1 ? <p className="fb-key"><span>Respuesta:</span> {correctText(q)}</p> : null}
      <p className="fb-why">{q.explain}</p>
      <button type="button" className="link" onClick={() => onSlide(q.page)}>Ver diapositiva {q.page}</button>
    </div>
  );
}
