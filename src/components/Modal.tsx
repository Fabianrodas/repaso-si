import { useEffect, useRef, type ReactNode } from "react";

type Action = { label: string; onClick: () => void; primary?: boolean };

export function Modal({ title, children, actions, onClose }: { title: string; children: ReactNode; actions: Action[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>(".btn.primary")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, []);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) close.current(); }}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-body" ref={ref}>
        <h2 id="dlg-title">{title}</h2>
        <p id="dlg-body">{children}</p>
        <div className="row dlg-actions">
          {actions.map((a) => (
            <button key={a.label} type="button" className={`btn ${a.primary ? "primary" : "quiet"}`} onClick={a.onClick}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
