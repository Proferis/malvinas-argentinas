/**
 * Recolector de novedades oficiales sobre la causa Malvinas.
 *
 * No usa base de datos ni servicios externos: lee fuentes oficiales, filtra por
 * palabras clave y reescribe data/novedades.js, que el front carga como un
 * script estático. El historial de cambios queda en los commits del repo.
 *
 *   node scripts/scrape.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "data", "novedades.js");
const HISTORIAL = join(RAIZ, "data", "historial.js");
const MAXIMO = 60;
const AGENTE = "Prometeo/1.0 (+sitio ciudadano; contacto en el repositorio)";

const CLAVES = /malvinas|atl[áa]ntico sur|georgias del sur|s[áa]ndwich del sur|islas del atl[áa]ntico/i;

async function traer(url) {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), 25000);
  try {
    const respuesta = await fetch(url, {
      headers: { "User-Agent": AGENTE, "Accept-Language": "es-AR,es;q=0.9" },
      signal: control.signal
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return await respuesta.text();
  } finally {
    clearTimeout(corte);
  }
}

function limpiar(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cancillería: listado de noticias (Drupal Views, con fecha, título y copete). */
async function cancilleria() {
  const base = "https://www.cancilleria.gob.ar";
  const html = await traer(`${base}/es/actualidad/noticias`);
  const patron = /<a[^>]+href="(\/es\/actualidad\/noticias\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const vistos = new Set();
  const items = [];

  for (const coincidencia of html.matchAll(patron)) {
    const ruta = coincidencia[1];
    const bloque = coincidencia[2];
    if (vistos.has(ruta)) continue;
    vistos.add(ruta);

    const titulo = limpiar(
      (bloque.match(/views-field-title-1[^"]*"[\s\S]*?<span class="field-content">([\s\S]*?)<\/span>/) || [])[1] || ""
    );
    if (titulo.length < 15) continue;

    const copete = limpiar(
      (bloque.match(/views-field-field-copete-com"[\s\S]*?<div class="field-content">([\s\S]*?)<\/div>/) || [])[1] || ""
    );
    if (!CLAVES.test(titulo + " " + copete)) continue;

    const iso = (bloque.match(/date-display-single"[^>]*content="([^"]+)"/) || [])[1];
    const fecha = iso && !isNaN(new Date(iso)) ? new Date(iso).toISOString() : new Date().toISOString();

    items.push({
      fecha,
      titulo,
      resumen: copete || undefined,
      tipo: "Comunicado",
      fuente: "Cancillería Argentina",
      url: base + ruta,
      origen: "scraper"
    });
  }
  return items;
}

/** Boletín Oficial: avisos de la Primera Sección de la edición del día. */
async function boletinOficial() {
  const base = "https://www.boletinoficial.gob.ar";
  const html = await traer(`${base}/seccion/primera`);
  const patron = /<a[^>]+href="(\/detalleAviso\/primera\/\d+\/(\d{8})[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const vistos = new Set();
  const items = [];

  for (const coincidencia of html.matchAll(patron)) {
    const ruta = coincidencia[1].split("?")[0];
    const crudo = coincidencia[2];
    const titulo = limpiar(coincidencia[3]);
    if (titulo.length < 15 || vistos.has(ruta)) continue;
    vistos.add(ruta);
    if (!CLAVES.test(titulo)) continue;

    const fecha = new Date(Date.UTC(
      Number(crudo.slice(0, 4)), Number(crudo.slice(4, 6)) - 1, Number(crudo.slice(6, 8)), 12
    )).toISOString();

    items.push({
      fecha,
      titulo: titulo.slice(0, 220),
      tipo: "Normativa",
      fuente: "Boletín Oficial",
      url: base + ruta,
      origen: "scraper"
    });
  }
  return items;
}

const FUENTES = [
  { nombre: "Cancillería", recolectar: cancilleria },
  { nombre: "Boletín Oficial", recolectar: boletinOficial }
];

async function existentes() {
  try {
    const texto = await readFile(SALIDA, "utf8");
    const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
    return JSON.parse(json).items || [];
  } catch (e) {
    return [];
  }
}

function fusionar(previos, nuevos) {
  const porUrl = new Map();
  for (const item of [...previos, ...nuevos]) {
    if (!porUrl.has(item.url)) porUrl.set(item.url, item);
  }
  return [...porUrl.values()]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, MAXIMO);
}

/**
 * Carga un archivo de datos del front (`window.X = {...}`) desde Node.
 * Son scripts pensados para el navegador, no módulos: se evalúan con un
 * `window` de mentira y se devuelve lo que hayan colgado ahí.
 */
async function leerDatos(ruta) {
  const ventana = {};
  new Function("window", await readFile(ruta, "utf8"))(ventana);
  return ventana;
}

/** Recuento de votos del Worker, si está desplegado. Sin endpoint, no hay votos. */
async function votosDelDia(config) {
  const endpoint = (config.contador.endpoint || "").replace(/\/$/, "");
  if (!endpoint) return { votosSi: 0, votosNo: 0, fuente: "sin-endpoint" };

  const claves = [config.contador.claves.si, config.contador.claves.no];
  try {
    const respuesta = await fetch(`${endpoint}/leer?claves=${encodeURIComponent(claves.join(","))}`, {
      headers: { "User-Agent": AGENTE }
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const datos = await respuesta.json();
    return {
      votosSi: Number(datos[claves[0]]) || 0,
      votosNo: Number(datos[claves[1]]) || 0,
      fuente: "worker"
    };
  } catch (error) {
    console.warn(`Votos: sin datos (${error.message})`);
    return { votosSi: 0, votosNo: 0, fuente: "error" };
  }
}

/**
 * Agrega —o pisa— el punto de hoy en data/historial.js.
 *
 * Guarda sólo el recuento de votos: la probabilidad se deriva después con
 * assets/js/modelo.js, así que cambiar la fórmula recalcula toda la serie en
 * vez de dejar puntos viejos con una fórmula vieja.
 */
async function actualizarHistorial(config) {
  await import(pathToFileURL(join(RAIZ, "assets", "js", "modelo.js")).href);
  const hoy = globalThis.Modelo.diaAR(new Date());

  const { HISTORIAL: previo } = await leerDatos(HISTORIAL);
  const desde = previo.desde || globalThis.Modelo.diaAR(config.ancla);

  if (hoy < desde) {
    console.log(`Historial: ${hoy} es anterior al ancla ${desde}, no se registra`);
    return;
  }

  const votos = await votosDelDia(config);
  const puntos = (previo.puntos || []).filter((p) => p.fecha !== hoy);
  puntos.push({ fecha: hoy, votosSi: votos.votosSi, votosNo: votos.votosNo });
  puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const datos = { desde, actualizado: new Date().toISOString(), puntos };
  const cabecera = (await readFile(HISTORIAL, "utf8")).split("window.HISTORIAL")[0];
  await writeFile(HISTORIAL, `${cabecera}window.HISTORIAL = ${JSON.stringify(datos, null, 2)};\n`, "utf8");
  console.log(`Historial: ${puntos.length} punto(s), último ${hoy} (votos: ${votos.fuente})`);
}

async function actualizarNovedades() {
  const recolectados = [];

  for (const fuente of FUENTES) {
    try {
      const items = await fuente.recolectar();
      console.log(`${fuente.nombre}: ${items.length} novedad(es)`);
      recolectados.push(...items);
    } catch (error) {
      console.warn(`${fuente.nombre}: sin datos (${error.message})`);
    }
  }

  const previos = await existentes();
  const items = fusionar(previos, recolectados);

  // Sin cambios reales no se reescribe el archivo: así el cron diario no genera
  // un commit por día sólo por mover la fecha de actualización.
  if (JSON.stringify(previos) === JSON.stringify(items)) {
    console.log("Sin novedades nuevas: data/novedades.js queda igual");
    return;
  }

  const datos = { actualizado: new Date().toISOString(), items };
  await writeFile(SALIDA, `window.NOVEDADES = ${JSON.stringify(datos, null, 2)};\n`, "utf8");
  console.log(`Total en data/novedades.js: ${items.length}`);
}

async function principal() {
  const { CONFIG } = await leerDatos(join(RAIZ, "data", "config.js"));

  // las dos mitades son independientes: que falle el scraping de novedades no
  // puede dejar un agujero en la serie diaria, ni al revés
  const resultados = await Promise.allSettled([
    actualizarNovedades(),
    actualizarHistorial(CONFIG)
  ]);

  for (const r of resultados) {
    if (r.status === "rejected") console.error(r.reason);
  }
  if (resultados.some((r) => r.status === "rejected")) process.exitCode = 1;
}

principal();
