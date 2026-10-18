import { ArrowRight } from "../components/Icons";
import { useLinkClick } from "../lib/router";
import { load } from "../lib/storage";
import { PASS } from "../quiz/engine";
import type { HistoryEntry } from "../quiz/QuizContext";
import { bankOf, SUBJECTS } from "../subjects";
import type { Subject } from "../subjects/types";

function progress(s: Subject) {
  const h = load<HistoryEntry[]>(`${s.storage}-quiz-history-v3`, []);
  const hist = Array.isArray(h) ? h : [];
  const best: Record<number, number> = {};
  for (const e of hist) if (e.mode === "lesson" && e.week && s.units.includes(e.week)) best[e.week] = Math.max(best[e.week] ?? 0, e.score);
  return { best, passed: Object.values(best).filter((v) => v >= PASS).length, attempts: hist.length };
}

export default function Subjects() {
  const onLink = useLinkClick();
  return (
    <div className="subjects">
      <h1 className="hero">¿Qué materia repasas hoy?</h1>
      <ul className="subj-grid">
        {SUBJECTS.map((s) => {
          const bank = bankOf(s);
          const p = progress(s);
          const first = s.units[0], last = s.units[s.units.length - 1];
          return (
            <li key={s.id} data-subject={s.id} className="subj">
              <a href={s.base} onClick={onLink} className="subj-link" aria-label={`Entrar a ${s.name}`}>
                <span className="subj-top">
                  <span className="subj-bub" aria-hidden="true">{s.short}</span>
                  <span className="subj-name">
                    <b>{s.name}</b>
                    <span>{s.unit === "Week" ? "Weeks" : "Temas"} {first} a {last}</span>
                  </span>
                  <ArrowRight className="subj-go" size={24} />
                </span>
                <span className="subj-stats">
                  <span><b>{bank.TOTAL_Q}</b> preguntas</span>
                  <span><b>{s.videos.length}</b> videos</span>
                  <span><b>{s.slideCount}</b> diapositivas</span>
                </span>
                <span className="subj-units" aria-hidden="true">
                  {s.units.map((u) => {
                    const b = p.best[u];
                    return (
                      <span key={u} className={`subj-unit ${b === undefined ? "" : b >= PASS ? "is-pass" : "is-fail"}`}>
                        <i>{u}</i>
                        <span className="subj-unit-t"><b>{s.unitShort[u]}</b><small>{s.unitTopic[u]}</small></span>
                        {b !== undefined ? <em>{Math.round(b)}</em> : null}
                      </span>
                    );
                  })}
                </span>
                <span className="subj-foot">
                  {p.attempts
                    ? `${p.passed} de ${s.units.length} lecciones aprobadas · ${p.attempts} intento${p.attempts === 1 ? "" : "s"}`
                    : "Sin intentos todavía"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
