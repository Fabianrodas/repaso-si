import { lazy, Suspense, useEffect } from "react";
import { Footer, Header } from "./components/Chrome";
import { useRoute } from "./lib/router";
import Home from "./pages/Home";
import Runner from "./pages/Runner";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import { QuizProvider } from "./quiz/QuizContext";

const Videos = lazy(() => import("./pages/Videos"));
const Slides = lazy(() => import("./pages/Slides"));

const TITLES: Record<string, string> = {
  "/": "Practicar",
  "/quiz": "Quiz en curso",
  "/resultados": "Resultados",
  "/videos": "Videos",
  "/diapositivas": "Diapositivas",
};

export default function App() {
  const { path, query } = useRoute();

  useEffect(() => {
    document.title = `${TITLES[path] ?? "Página no encontrada"} | Sistemas Inteligentes`;
  }, [path]);

  let page: React.ReactNode;
  switch (path) {
    case "/": page = <Home />; break;
    case "/quiz": page = <Runner />; break;
    case "/resultados": page = <Results />; break;
    case "/videos": page = <Videos query={query} />; break;
    case "/diapositivas": page = <Slides query={query} />; break;
    default: page = <NotFound />;
  }

  return (
    <QuizProvider>
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <Header path={path} />
      <main id="main" className="wrap main" tabIndex={-1}>
        <Suspense fallback={<div className="loading" role="status">Cargando</div>}>{page}</Suspense>
      </main>
      <Footer />
    </QuizProvider>
  );
}
