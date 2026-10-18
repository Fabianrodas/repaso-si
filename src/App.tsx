import { lazy, Suspense, useEffect } from "react";
import { Footer, Header } from "./components/Chrome";
import { navigate, useRoute } from "./lib/router";
import Home from "./pages/Home";
import Runner from "./pages/Runner";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import Subjects from "./pages/Subjects";
import { QuizProvider } from "./quiz/QuizContext";
import { SITE, splitPath, SubjectCtx } from "./subjects";

const Videos = lazy(() => import("./pages/Videos"));
const Slides = lazy(() => import("./pages/Slides"));

const TITLES: Record<string, string> = {
  "/": "Practicar",
  "/quiz": "Quiz en curso",
  "/resultados": "Resultados",
  "/videos": "Videos",
  "/diapositivas": "Diapositivas",
};

// Las rutas de antes (cuando la app solo tenía Sistemas Inteligentes) siguen funcionando.
const LEGACY = new Set(["/quiz", "/resultados", "/videos", "/diapositivas"]);

export default function App() {
  const { path, query } = useRoute();
  const { subject, sub } = splitPath(path);
  const legacy = !subject && LEGACY.has(path);

  useEffect(() => {
    if (legacy) navigate(`/si${path}${window.location.search}`, { replace: true });
  }, [legacy, path]);

  useEffect(() => {
    const root = document.documentElement;
    if (subject) root.setAttribute("data-subject", subject.id);
    else root.removeAttribute("data-subject");
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) icon.href = subject?.favicon ?? "/favicon.svg";
    document.title = subject
      ? `${TITLES[sub] ?? "Página no encontrada"} | ${subject.name}`
      : path === "/" ? `${SITE.title} | Sistemas Inteligentes e Ingeniería de Software II` : `Página no encontrada | ${SITE.title}`;
  }, [subject, sub, path]);

  if (legacy) return null;

  let page: React.ReactNode;
  if (!subject) page = path === "/" ? <Subjects /> : <NotFound />;
  else {
    switch (sub) {
      case "/": page = <Home />; break;
      case "/quiz": page = <Runner />; break;
      case "/resultados": page = <Results />; break;
      case "/videos": page = <Videos query={query} />; break;
      case "/diapositivas": page = <Slides query={query} />; break;
      default: page = <NotFound />;
    }
  }

  const body = (
    <>
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <Header subject={subject} sub={sub} />
      <main id="main" className="wrap main" tabIndex={-1}>
        <Suspense fallback={<div className="loading" role="status">Cargando</div>}>{page}</Suspense>
      </main>
      <Footer />
    </>
  );

  if (!subject) return body;
  return (
    <SubjectCtx.Provider value={subject}>
      <QuizProvider key={subject.id} subject={subject}>{body}</QuizProvider>
    </SubjectCtx.Provider>
  );
}
