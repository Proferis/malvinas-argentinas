/**
 * Prueba del contador, sin Cloudflare ni red.
 *
 * Reemplaza KV por un Map y ejercita las reglas que importan: un voto por IP,
 * una visita por IP y día, y que la IP nunca se guarde en claro. No prueba el
 * despliegue —para eso está `wrangler dev`—, prueba la regla de negocio.
 *
 *   node worker/prueba.mjs
 */
import worker from "./contador-worker.js";

function entorno() {
  const kv = new Map();
  return {
    SAL: "sal-de-prueba",
    CONTADOR: {
      get: async (k) => (kv.has(k) ? kv.get(k) : null),
      put: async (k, v) => { kv.set(k, v); }
    },
    _kv: kv
  };
}

const pedir = (env, ruta, ip, cuerpo) => worker.fetch(new Request("https://x" + ruta, {
  method: cuerpo ? "POST" : "GET",
  headers: { "CF-Connecting-IP": ip, "Content-Type": "application/json" },
  body: cuerpo ? JSON.stringify(cuerpo) : undefined
}), env);

const leerJson = async (r) => r.json();
let fallos = 0;
function afirmar(descripcion, condicion, detalle) {
  console.log(`${condicion ? "ok  " : "FALLA"}  ${descripcion}${condicion ? "" : "  → " + JSON.stringify(detalle)}`);
  if (!condicion) fallos++;
}

const env = entorno();

// 1. primer voto de una IP
let r = await leerJson(await pedir(env, "/sumar", "1.1.1.1", { clave: "voto_si" }));
afirmar("el primer voto de una IP entra", r.aceptado === true && r.voto_si === 1 && r.tuVoto === "si", r);

// 2. la misma IP no puede votar de nuevo, ni con la otra opción
r = await leerJson(await pedir(env, "/sumar", "1.1.1.1", { clave: "voto_no" }));
afirmar("la misma IP no vota dos veces", r.aceptado === false && r.tuVoto === "si", r);
afirmar("el rechazo no altera los totales", r.voto_si === 1 && r.voto_no === 0, r);

// 3. otra IP sí
r = await leerJson(await pedir(env, "/sumar", "2.2.2.2", { clave: "voto_no" }));
afirmar("otra IP sí puede votar", r.aceptado === true && r.voto_no === 1 && r.tuVoto === "no", r);

// 4. /leer informa el voto de quien pregunta
r = await leerJson(await pedir(env, "/leer?claves=voto_si,voto_no", "1.1.1.1"));
afirmar("/leer dice qué votó esta IP", r.tuVoto === "si" && r.voto_si === 1 && r.voto_no === 1, r);
r = await leerJson(await pedir(env, "/leer?claves=voto_si,voto_no", "9.9.9.9"));
afirmar("/leer devuelve null para una IP que no votó", r.tuVoto === null, r);

// 5. la IP nunca se guarda en claro
const claves = [...env._kv.keys()].join(" ");
afirmar("no se guarda ninguna IP en claro", !claves.includes("1.1.1.1") && !claves.includes("2.2.2.2"), claves);

// 6. las visitas siguen siendo una por IP y día
r = await leerJson(await pedir(env, "/sumar", "3.3.3.3", { clave: "visitas" }));
const r2 = await leerJson(await pedir(env, "/sumar", "3.3.3.3", { clave: "visitas" }));
afirmar("una visita por IP y día", r.visitas === 1 && r2.visitas === 1, [r, r2]);

// 7. claves inventadas
const mala = await pedir(env, "/sumar", "4.4.4.4", { clave: "voto_tal_vez" });
afirmar("rechaza una clave inventada", mala.status === 400, mala.status);

// 8. una sal distinta produce otra huella (no se pueden cruzar despliegues)
const otro = entorno();
otro.SAL = "otra-sal";
r = await leerJson(await pedir(otro, "/sumar", "1.1.1.1", { clave: "voto_si" }));
afirmar("la sal separa los despliegues", r.aceptado === true, r);

console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : "\ntodas las comprobaciones pasan");
process.exit(fallos ? 1 : 0);
