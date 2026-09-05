/**
 * Contador propio para Prometeo — sin API de terceros.
 *
 * Cloudflare Worker + KV. Expone dos rutas:
 *   GET  /leer?claves=visitas,voto_si,voto_no
 *        -> { visitas: n, voto_si: n, voto_no: n, tuVoto: "si"|"no"|null }
 *   POST /sumar  { "clave": "voto_si" }
 *        -> { voto_si: n, aceptado: true|false, tuVoto: "si"|"no"|null }
 *
 * Antifraude posible sin base de datos: una visita por IP y día, un voto por IP
 * hasta la fecha de cierre. KV no es transaccional, así que dos incrementos
 * simultáneos pueden pisarse; para un termómetro simbólico alcanza. Si algún día
 * hiciera falta exactitud, el reemplazo es un Durable Object con el mismo contrato.
 *
 * El límite por IP lo decide el servidor y lo informa en cada respuesta: el
 * navegador no puede saltearse el tope borrando su almacenamiento, y la interfaz
 * puede decir la verdad sobre si el voto entró o no.
 *
 * Variables de entorno:
 *   ORIGEN  origen permitido para CORS (ej. https://tu-sitio.ar). Por defecto "*".
 *   SAL     cadena secreta para hashear IPs (nunca se guarda la IP en claro).
 * Binding KV:
 *   CONTADOR
 */

const CLAVES = new Set(["visitas", "voto_si", "voto_no"]);
const VOTOS = new Set(["voto_si", "voto_no"]);
const DIA = 60 * 60 * 24;

function cabeceras(env) {
  return {
    "Access-Control-Allow-Origin": env.ORIGEN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(datos, env, estado = 200) {
  return new Response(JSON.stringify(datos), { status: estado, headers: cabeceras(env) });
}

async function huella(request, env, sufijo) {
  const ip = request.headers.get("CF-Connecting-IP") || "sin-ip";
  const datos = new TextEncoder().encode(`${env.SAL || "prometeo"}:${ip}:${sufijo}`);
  const digest = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(digest)].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function leer(env, claves) {
  const salida = {};
  await Promise.all(claves.map(async (clave) => {
    salida[clave] = Number(await env.CONTADOR.get(clave)) || 0;
  }));
  return salida;
}

/** Marca de "esta IP ya votó". Guarda qué votó, para poder decírselo después. */
function marcaDeVoto(hash) {
  return `voto:${hash}`;
}

/** Devuelve "si", "no" o null: qué votó esta IP, según el servidor. */
async function votoDe(request, env) {
  const guardado = await env.CONTADOR.get(marcaDeVoto(await huella(request, env, "voto")));
  if (guardado === "voto_si") return "si";
  if (guardado === "voto_no") return "no";
  // marcas viejas, de antes de que se guardara la opción elegida
  return guardado ? "" : null;
}

async function sumar(env, clave) {
  const total = (Number(await env.CONTADOR.get(clave)) || 0) + 1;
  await env.CONTADOR.put(clave, String(total));
  return total;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cabeceras(env) });
    }

    if (url.pathname === "/leer" && request.method === "GET") {
      const pedidas = (url.searchParams.get("claves") || "")
        .split(",").map((c) => c.trim()).filter((c) => CLAVES.has(c));
      if (!pedidas.length) return json({ error: "claves inválidas" }, env, 400);
      const totales = await leer(env, pedidas);
      return json(Object.assign(totales, { tuVoto: await votoDe(request, env) }), env);
    }

    if (url.pathname === "/sumar" && request.method === "POST") {
      let cuerpo;
      try {
        cuerpo = await request.json();
      } catch (e) {
        return json({ error: "cuerpo inválido" }, env, 400);
      }

      const clave = cuerpo && cuerpo.clave;
      if (!CLAVES.has(clave)) return json({ error: "clave inválida" }, env, 400);

      const esVoto = VOTOS.has(clave);

      if (!esVoto) {
        const marca = `visita:${await huella(request, env, new Date().toISOString().slice(0, 10))}`;
        if (await env.CONTADOR.get(marca)) return json(await leer(env, [clave]), env);
        await env.CONTADOR.put(marca, "1", { expirationTtl: DIA });
        return json({ [clave]: await sumar(env, clave) }, env);
      }

      // un voto por IP: si ya hay marca, se devuelve el estado real sin sumar,
      // para que la interfaz no pueda decir que el voto entró cuando no entró
      const previo = await votoDe(request, env);
      if (previo !== null) {
        const totales = await leer(env, [...VOTOS]);
        return json(Object.assign(totales, { aceptado: false, tuVoto: previo }), env);
      }

      // el voto se retiene hasta pasada la elección
      await env.CONTADOR.put(marcaDeVoto(await huella(request, env, "voto")), clave,
        { expirationTtl: DIA * 400 });
      const total = await sumar(env, clave);
      return json({ [clave]: total, aceptado: true, tuVoto: clave === "voto_si" ? "si" : "no" }, env);
    }

    return json({ error: "ruta no encontrada" }, env, 404);
  }
};
