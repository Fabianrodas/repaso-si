import type { ReactNode } from "react";

/**
 * Un "slide" del curso: barra granate con el título, contenido y la línea inferior
 * (gris con un tramo granate) que en las diapositivas originales acompaña al número de página.
 * Aquí la línea muestra progreso real cuando se pasa `progress`.
 */
export function Slide({
  title, aside, children, number, progress = 0.5, id, className = "", as: Tag = "section", labelledBy,
}: {
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  number?: ReactNode;
  progress?: number;
  id?: string;
  className?: string;
  as?: "section" | "article" | "div";
  labelledBy?: string;
}) {
  const hid = id ? `${id}-title` : undefined;
  return (
    <Tag className={`slide ${className}`} id={id} aria-labelledby={labelledBy ?? hid}>
      <header className="slide-bar">
        <h2 id={hid}>{title}</h2>
        {aside ? <div className="slide-bar-aside">{aside}</div> : null}
      </header>
      <div className="slide-body">{children}</div>
      <SlideFoot progress={progress} number={number} />
    </Tag>
  );
}

export function SlideFoot({ progress = 0.5, number }: { progress?: number; number?: ReactNode }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className="slide-foot">
      <div className="slide-line" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      {number !== undefined ? <span className="slide-num">{number}</span> : null}
    </div>
  );
}

/** Bloque de portada, como la primera diapositiva de cada semana. */
export function Cover({ title, lines, children, className = "" }: { title: ReactNode; lines?: ReactNode[]; children?: ReactNode; className?: string }) {
  return (
    <div className={`cover ${className}`}>
      <div className="cover-block">
        <h1 className="cover-title">{title}</h1>
        {lines?.map((l, i) => <p key={i} className="cover-line">{l}</p>)}
        {children}
      </div>
    </div>
  );
}
