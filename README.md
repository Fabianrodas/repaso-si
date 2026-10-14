# Intelligent Systems · Repaso

App web para repasar Sistemas Inteligentes (semanas 1 a 7):

- **Quiz**: examen de 20 preguntas al azar o banco completo de 100. Las preguntas valen de 2 a 5 puntos y la nota final es sobre 100. Al terminar muestra la revisión de cada respuesta con enlace a la diapositiva de donde sale.
- **Videos**: los 7 videos narrados (uno por semana) con subtítulos en español.
- **Diapositivas**: visor de las 249 diapositivas del PDF unificado y descarga del PDF completo.

Todo es frontend estático: no hay servidor ni base de datos. El avance del quiz, el historial de notas, el tema y la posición de cada video se guardan en el navegador (localStorage).

## Stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript.
- Videos en **HLS** (segmentos de ~10 s, máx. ~460 KB cada uno) reproducidos con [hls.js](https://github.com/video-dev/hls.js), que se carga solo al abrir Videos. Safari en iPhone/iPad usa su reproductor HLS nativo.
- Diapositivas como imágenes WebP (1600×900, ~37 KB cada una) con miniaturas: cambian al instante y no hace falta cargar un visor de PDF.
- Fuentes autoalojadas con Fontsource: Montserrat (títulos, en lugar de Proxima Nova de las diapositivas), Teachers (texto, la misma de las diapositivas) y JetBrains Mono (código).
- Modo claro y oscuro: sigue al sistema hasta que eliges uno con el botón del encabezado.

## Si el proyecto vino sin videos ni diapositivas

El zip del código fuente no repite los medios (pesan ~100 MB). Antes de `npm run build`, copia la carpeta `media/` del dist a `public/media/`:

```bash
cp -r ruta/al/dist/media public/media
```

## Comandos

Requiere Node 18.18 o superior (Netlify usa Node 20 por `netlify.toml`).

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4173
```

## Publicar en Netlify

**Opción A, subir la carpeta ya construida (Netlify Drop)**

1. `npm install && npm run build` (o usa el `dist/` que viene incluido).
2. Entra a https://app.netlify.com/drop y arrastra la carpeta `dist/`.

`dist/` ya incluye `_redirects` (para que /videos y /diapositivas funcionen al recargar) y `_headers` (caché y cabeceras de seguridad).

**Opción B, desde un repositorio de GitHub**

1. Sube este proyecto a un repositorio.
2. En Netlify: *Add new site → Import an existing project* y elige el repositorio.
3. Netlify lee `netlify.toml`: comando `npm run build`, carpeta `dist`.

**Opción C, Netlify CLI**

```bash
npx netlify-cli deploy --prod --dir=dist
```

## Dónde cambiar cosas

| Qué | Archivo |
| --- | --- |
| Nombre y enlace de GitHub del footer | `src/data/meta.ts` (`SITE`) |
| Preguntas, respuestas, puntajes y explicaciones | `src/data/questions.json` |
| Preguntas por semana en el examen de 20 | `src/quiz/engine.ts` (`EXAM_QUOTA`) |
| Reglas de calificación | `src/quiz/engine.ts` (`grade`) |
| Colores de modo claro y oscuro | `src/styles/tokens.css` |
| Videos, subtítulos, diapositivas y PDF | `public/media/` |

### Formato de una pregunta

```json
{
  "id": "w3-15", "w": 3, "topic": "Slicing", "type": "mc", "pts": 5,
  "q": "Texto de la pregunta", "code": "código opcional",
  "options": ["A", "B", "C", "D"], "answer": 1,
  "explain": "Por qué es la correcta", "src": "Week 3 · Slicing in Python", "page": 126
}
```

Tipos: `mc` (una correcta, `answer` = índice), `multi` (varias, `answer` = lista de índices), `tf` (`answer` = true/false), `match` (`pairs` = [[izquierda, derecha]], `extra` opcional), `order` (`items` en el orden correcto), `input` (`answer` = respuestas aceptadas, `numeric` opcional). `page` es la diapositiva del PDF unificado.

## Estructura

```
public/
  _redirects, _headers, favicon.svg
  media/videos/w1..w7/   index.m3u8 + segmentos .ts
  media/subs/            subtítulos .vtt
  media/slides/          001..249.webp
  media/thumbs/          miniaturas
  media/pdf/             PDF unificado
src/
  data/                  preguntas y datos del sitio
  quiz/                  lógica de calificación, estado y vistas de preguntas
  pages/                 Inicio, Quiz, Resultados, Videos, Diapositivas
  components/            slide, encabezado, footer, modal, íconos
  styles/                tokens de color y estilos
```

Hecho por Fabián Rodas · https://github.com/Fabianrodas
