import { useEffect, useRef, type ReactNode } from "react";

type Action = { label: string; onClick: () => void; primary?: boolean };

export function Modal({ title, children, actions, onClose }: { title: string; children: ReactNode; actions: Action[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>(".btn.primary")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog slide" role="dialog" aria-modal="true" aria-labelledby="dlg-title" ref={ref}>
        <header className="slide-bar"><h2 id="dlg-title">{title}</h2></header>
        <div className="slide-body">
          <p>{children}</p>
          <div className="btn-row dialog-actions">
            {actions.map((a) => (
              <button key={a.label} type="button" className={`btn ${a.primary ? "primary" : ""}`} onClick={a.onClick}>{a.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
