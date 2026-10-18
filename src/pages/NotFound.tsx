import { navigate } from "../lib/router";

export default function NotFound() {
  return (
    <div className="nf">
      <h1 className="page-title">Esta página no existe</h1>
      <button type="button" className="btn primary" onClick={() => navigate("/")}>Ir a practicar</button>
    </div>
  );
}
