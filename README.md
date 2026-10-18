# Repaso UEES · Sistemas Inteligentes e Ingeniería de Software II

App web para repasar dos materias. La página de inicio (`/`) deja elegir la materia:

| Materia | Ruta | Unidades | Preguntas | Videos | Diapositivas |
| --- | --- | --- | --- | --- | --- |
| Sistemas Inteligentes | `/si` | Weeks 1 a 7 | 140 | 7 | 249 |
| Ingeniería de Software II | `/is2` | Temas 1 a 8 | 160 | 8 | 289 |

En cada materia:

- **Practicar**: lección de 20 preguntas por unidad, 20 preguntas al azar o el banco completo. Cada pregunta vale de 2 a 5 puntos y la nota final es sobre 100 (se aprueba con 70). Al terminar puedes repasar solo las falladas.
- **Videos**: un video narrado por unidad, con subtítulos en español.
- **Diapositivas**: el PDF unificado (con ejemplos y ejercicios resueltos extra) y su descarga.

Las rutas antiguas (`/quiz`, `/videos`, `/diapositivas`, `/resultados`) redirigen a `/si/...`.

Todas las preguntas salen de las diapositivas originales del curso y son independientes entre sí. Es solo frontend: el avance, las notas, el tema y la posición de cada video se guardan en el navegador (localStorage).

## Comandos

Requiere Node 18.18 o superior (Netlify usa Node 20 por `netlify.toml`).

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4173
```

## Publicar en Netlify

- **Desde GitHub**: Netlify lee `netlify.toml` (comando `npm run build`, carpeta `dist`).
- **Netlify Drop**: `npm run build` y arrastra la carpeta `dist/` a https://app.netlify.com/drop.

`public/_redirects` hace que todas las rutas (/si/videos, /is2/diapositivas…) funcionen al recargar, y `public/_headers` define caché y cabeceras de seguridad.

## Dónde cambiar cosas

| Qué | Archivo |
| --- | --- |
| Preguntas, respuestas, puntos y explicaciones | `src/data/si/questions.json` y `src/data/is2/questions.json` |
| Unidades, videos, diapositivas y PDF de cada materia | `src/subjects/si.ts` y `src/subjects/is2.ts` |
| Cantidad de preguntas al azar | `src/quiz/engine.ts` (`RANDOM_N`) |
| Nota para aprobar y reglas de calificación | `src/quiz/engine.ts` (`PASS`, `grade`) |
| Nombre y GitHub del footer | `src/subjects/index.ts` (`SITE`) |
| Colores de modo claro y oscuro (vino para SI, azul marino para IS2) | `src/styles/tokens.css` |
| Videos (HLS), subtítulos, diapositivas y PDF | `public/media/` (SI) y `public/media/is2/` (IS2) |

### Formato de una pregunta

```json
{
  "id": "w3-17", "w": 3, "topic": "Slicing", "type": "mc", "pts": 5,
  "q": "¿Qué imprime print(lst2[1:-1])?", "code": "lst = [10, 8, 6, 4, 2] ...",
  "options": ["[8, 6, 4]", "[10, 6, 4]", "..."], "answer": 1,
  "explain": "Por qué es la correcta", "src": "Week 3 · Slicing in Python - example", "page": 126
}
```

Tipos: `mc` (una correcta, `answer` = índice), `multi` (varias, `answer` = lista de índices), `tf` (`answer` = true/false), `match` (`pairs` = [[izquierda, derecha]], `extra` opcional), `order` (`items` en el orden correcto), `input` (`answer` = respuestas aceptadas, `numeric` opcional). `w` es la unidad (Week o Tema) y `page` es la diapositiva del PDF unificado de esa materia.

Hecho por Fabián Rodas · https://github.com/Fabianrodas
