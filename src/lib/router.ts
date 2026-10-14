import { useEffect, useState, useCallback } from "react";

export type Route = { path: string; query: URLSearchParams };

const read = (): Route => ({ path: window.location.pathname.replace(/\/+$/, "") || "/", query: new URLSearchParams(window.location.search) });

const listeners = new Set<() => void>();
window.addEventListener("popstate", () => listeners.forEach((l) => l()));

export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) {
  const url = new URL(to, window.location.origin);
  const same = url.pathname + url.search === window.location.pathname + window.location.search;
  if (!same) {
    if (opts.replace) window.history.replaceState(null, "", url.pathname + url.search);
    else window.history.pushState(null, "", url.pathname + url.search);
  }
  listeners.forEach((l) => l());
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const l = () => setRoute(read());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return route;
}

/** Click handler for <a href> links that keeps navigation inside the SPA. */
export function useLinkClick() {
  return useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.currentTarget;
    if (a.target && a.target !== "_self") return;
    const url = new URL(a.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.search);
  }, []);
}
