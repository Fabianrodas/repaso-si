import { Slide } from "../components/Slide";
import { navigate } from "../lib/router";

export default function NotFound() {
  return (
    <Slide title="Esta página no existe" id="nf" number="404">
      <p>La dirección que abriste no corresponde a ninguna sección del repaso.</p>
      <div className="btn-row"><button type="button" className="btn primary" onClick={() => navigate("/")}>Ir al quiz</button></div>
    </Slide>
  );
}
