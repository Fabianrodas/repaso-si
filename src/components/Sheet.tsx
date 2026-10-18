// Piezas de la hoja de respuestas: la burbuja que se rellena y el círculo de bolígrafo de la nota.

export function Bubble({ children, filled, state, size = "md" }: { children?: React.ReactNode; filled?: boolean; state?: "ok" | "bad" | "key"; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`bub bub-${size} ${filled ? "is-filled" : ""} ${state ? `is-${state}` : ""}`} aria-hidden="true">
      <span className="bub-txt">{children}</span>
    </span>
  );
}

/** Círculo hecho a mano, como el que un profesor dibuja alrededor de la nota. */
export function PenCircle() {
  return (
    <svg className="pen-circle" viewBox="0 0 300 170" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M58 32 C 112 6, 236 10, 274 52 C 306 88, 262 150, 160 156 C 72 161, 14 132, 20 88 C 25 52, 70 30, 118 22 C 150 17, 182 18, 206 24"
        pathLength={1}
      />
    </svg>
  );
}

export function Tick({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="mark-pen ok" viewBox="0 0 28 24" aria-hidden="true"><path d="M3 13 C 7 16, 9 19, 11 21 C 15 13, 20 7, 26 3" /></svg>
  ) : (
    <svg className="mark-pen bad" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4 C 10 10, 15 15, 20 21 M 20 4 C 14 10, 9 15, 4 20" /></svg>
  );
}
