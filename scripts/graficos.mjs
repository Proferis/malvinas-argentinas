/**
 * Genera los SVG de marca: la silueta del archipiélago, el Sol de Mayo que
 * hace de marca de agua en la bandera, y el favicon.
 *
 * Están generados y no dibujados a mano para que las coordenadas queden a la
 * vista y se puedan corregir: la silueta sale de longitudes y latitudes
 * reales, y el sol de una fórmula, no de un trazado copiado de algún lado.
 *
 *   node scripts/graficos.mjs
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const CELESTE = "#75AADB";
const ORO = "#C08A12";
const TINTA = "#171009";

/* ==========================================================================
   Sol de Mayo
   ========================================================================== */

const rad = (g) => (g * Math.PI) / 180;
const p2 = (n) => Number(n.toFixed(2));

/** 32 rayos, rectos y flamígeros alternados, alrededor de un disco vacío. */
function sol({ cx = 0, cy = 0, ri = 26, ro = 62 } = {}) {
  const rectos = [];
  const flamas = [];

  for (let i = 0; i < 32; i++) {
    const a = i * 11.25 - 90;          // el primer rayo apunta hacia arriba
    const medio = 4.6;                 // semiancho angular de la base del rayo
    const x = (r, g) => p2(cx + r * Math.cos(rad(g)));
    const y = (r, g) => p2(cy + r * Math.sin(rad(g)));

    if (i % 2 === 0) {
      rectos.push(
        `M${x(ri, a - medio)} ${y(ri, a - medio)}` +
        `L${x(ro, a)} ${y(ro, a)}` +
        `L${x(ri, a + medio)} ${y(ri, a + medio)}Z`
      );
    } else {
      const rm = ri + (ro - ri) * 0.55;
      flamas.push(
        `M${x(ri, a - medio)} ${y(ri, a - medio)}` +
        `Q${x(rm, a - medio * 1.9)} ${y(rm, a - medio * 1.9)} ${x(ro, a - 0.6)} ${y(ro, a - 0.6)}` +
        `Q${x(rm, a + medio * 1.9)} ${y(rm, a + medio * 1.9)} ${x(ri, a + medio)} ${y(ri, a + medio)}Z`
      );
    }
  }
  return { rectos: rectos.join(""), flamas: flamas.join(""), ri, ro };
}

/* ==========================================================================
   El archipiélago
   Vértices en (longitud O, latitud S) siguiendo los accidentes reales de la
   costa; proyección lineal:  x = (61.7 − lon) × 28.6,  y = (lat − 51.1) × 47.6
   ========================================================================== */

const X = (lon) => Number(((61.7 - lon) * 28.6).toFixed(2));
const Y = (lat) => Number(((lat - 51.1) * 47.6).toFixed(2));
const trazar = (p) => "M" + p.map(([o, a]) => `${X(o)} ${Y(a)}`).join("L") + "Z";

/* Gran Malvina: horario desde el norte. Bahías profundas al oeste
   (Reina Carlota, Rey Jorge) y el cabo Meredith como punta sur. */
const GRAN_MALVINA = trazar([
  [60.42, 51.23], [60.22, 51.26], [60.05, 51.24], [59.92, 51.30],
  [59.83, 51.38], [59.72, 51.44], [59.62, 51.53], [59.58, 51.62],
  [59.68, 51.68], [59.66, 51.76], [59.80, 51.82], [59.94, 51.86],
  [59.98, 51.94], [60.14, 51.97], [60.30, 51.95], [60.44, 52.00],
  [60.58, 52.06], [60.72, 52.05], [60.84, 52.12], [60.95, 52.20],
  [61.03, 52.26], [61.10, 52.20], [61.06, 52.10], [60.94, 52.02],
  [60.80, 51.97], [60.88, 51.90], [61.04, 51.88], [61.18, 51.83],
  [61.30, 51.76], [61.20, 51.70], [61.04, 51.68], [60.88, 51.72],
  [60.74, 51.70], [60.82, 51.62], [60.98, 51.58], [61.14, 51.60],
  [61.28, 51.55], [61.40, 51.47], [61.30, 51.40], [61.14, 51.38],
  [61.00, 51.42], [60.90, 51.36], [60.98, 51.30], [61.12, 51.26],
  [61.02, 51.20], [60.86, 51.19], [60.72, 51.24], [60.58, 51.21]
]);

/* Isla Soledad: lóbulo norte, istmo de Darwin y Lafonia. El punto más oriental
   es el cabo Pembroke; el seno Choiseul y el Brenton Loch casi se tocan en
   Darwin, y ese pellizco es el istmo. */
const SOLEDAD = trazar([
  [58.93, 51.26], [58.78, 51.30], [58.64, 51.27], [58.50, 51.31],
  [58.38, 51.29], [58.30, 51.37], [58.44, 51.47], [58.32, 51.46],
  [58.18, 51.41], [58.02, 51.40], [57.88, 51.45], [57.92, 51.53],
  [58.06, 51.55], [58.24, 51.59], [58.10, 51.63], [57.94, 51.64],
  [57.78, 51.65], [57.71, 51.69], [57.84, 51.73], [57.98, 51.74],
  [58.14, 51.79], [58.26, 51.77], [58.22, 51.85], [58.40, 51.87],
  [58.58, 51.85], [58.74, 51.82], [58.90, 51.84], [58.98, 51.83],
  [58.97, 51.87],                                   // istmo de Darwin
  [58.82, 51.89], [58.66, 51.88], [58.50, 51.92],
  [58.36, 51.98], [58.30, 52.07], [58.42, 52.14], [58.56, 52.20],
  [58.68, 52.29], [58.84, 52.34], [59.00, 52.33], [59.14, 52.27],
  [59.24, 52.19], [59.20, 52.09], [59.32, 52.03], [59.22, 51.96],
  [59.06, 51.92], [59.00, 51.87],
  [59.10, 51.80], [59.26, 51.76], [59.40, 51.70], [59.34, 51.62],
  [59.18, 51.57], [59.06, 51.52], [59.22, 51.48], [59.36, 51.50],
  [59.32, 51.41], [59.18, 51.36], [59.04, 51.30]
]);

/** Recuadro que encierra los trazados, con un margen para el contorno. */
function encuadre(paths, margen = 2) {
  const nums = paths.join(" ").match(/-?\d+(\.\d+)?/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const x0 = Math.min(...xs) - margen;
  const y0 = Math.min(...ys) - margen;
  const w = Math.max(...xs) - Math.min(...xs) + margen * 2;
  const h = Math.max(...ys) - Math.min(...ys) + margen * 2;
  return [x0, y0, w, h].map((n) => Number(n.toFixed(2)));
}

/* ==========================================================================
   Salida
   ========================================================================== */

const CAJA = encuadre([GRAN_MALVINA, SOLEDAD]);

/* islas.svg se pinta con currentColor, así sigue al tema y al foco sin
   necesidad de una copia por color */
const islas = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CAJA.join(" ")}" role="img" aria-label="Islas Malvinas">
  <g fill="currentColor" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round">
    <path d="${GRAN_MALVINA}"/>
    <path d="${SOLEDAD}"/>
  </g>
</svg>
`;

/* sol.svg lleva la opacidad horneada: va como capa de background-image y CSS
   no puede atenuar una capa suelta */
const s = sol({ cx: 100, cy: 100, ri: 34, ro: 96 });
const solSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="presentation">
  <g fill="${ORO}" opacity=".26">
    <path d="${s.rectos}"/>
    <path d="${s.flamas}"/>
  </g>
  <circle cx="100" cy="100" r="${s.ri - 2}" fill="none" stroke="${ORO}" stroke-width="4" opacity=".26"/>
</svg>
`;

/* El favicon es la silueta sobre la bandera, sin el sol: a 16 px el sol se
   vuelve ruido y se come lo único que identifica al sitio. */
const ANCHO = 50;
const ESCALA = ANCHO / CAJA[2];
const DX = (64 - ANCHO) / 2;
const DY = (64 - CAJA[3] * ESCALA) / 2;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Prometeo">
  <defs><clipPath id="r"><rect width="64" height="64" rx="11"/></clipPath></defs>
  <g clip-path="url(#r)">
    <rect width="64" height="64" fill="#FBFAF6"/>
    <rect width="64" height="17" fill="${CELESTE}"/>
    <rect y="47" width="64" height="17" fill="${CELESTE}"/>
    <g fill="${TINTA}" stroke="${TINTA}" stroke-width="1.2" stroke-linejoin="round"
       transform="translate(${DX.toFixed(2)} ${DY.toFixed(2)}) scale(${ESCALA.toFixed(4)}) translate(${-CAJA[0]} ${-CAJA[1]})">
      <path d="${GRAN_MALVINA}"/>
      <path d="${SOLEDAD}"/>
    </g>
  </g>
</svg>
`;

await writeFile(join(RAIZ, "assets", "img", "islas.svg"), islas, "utf8");
await writeFile(join(RAIZ, "assets", "img", "sol.svg"), solSvg, "utf8");
await writeFile(join(RAIZ, "assets", "favicon.svg"), favicon, "utf8");
console.log("assets/img/islas.svg, assets/img/sol.svg y assets/favicon.svg regenerados");
