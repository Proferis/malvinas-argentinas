/**
 * Mercado de opinión: un voto por persona.
 *
 * Quién manda depende de si hay Worker desplegado:
 *
 * - Con Worker, manda el servidor. Él aplica el tope de un voto por IP y en cada
 *   respuesta dice qué votó esta IP y si el voto entró. Borrar el almacenamiento
 *   del navegador no habilita a votar de nuevo, y la interfaz nunca dice que un
 *   voto entró cuando el servidor lo rechazó.
 * - Sin Worker (modo local), sólo queda el navegador: un voto por dispositivo,
 *   y la interfaz lo aclara con la etiqueta "modo local".
 */
window.Mercado = (function () {
  const VOTO = "bm:voto";
  const claves = window.CONFIG.contador.claves;

  // lo último que dijo el servidor: `conocido` distingue "todavía no preguntamos"
  // de "el servidor dice que esta IP no votó"
  const servidor = { conocido: false, voto: null };

  function votoLocal() {
    try { return localStorage.getItem(VOTO); } catch (e) { return null; }
  }

  function guardarLocal(opcion) {
    try { localStorage.setItem(VOTO, opcion); } catch (e) { /* modo privado */ }
  }

  /** "si", "no", "" (votó pero no sabemos qué) o null (no votó). */
  function voto() {
    if (servidor.conocido) return servidor.voto;
    return votoLocal();
  }

  function anotarServidor(datos) {
    if (!window.Contador.esRemoto()) return;
    if (!datos || datos.tuVoto === undefined) return;
    servidor.conocido = true;
    servidor.voto = datos.tuVoto;
    // se refleja en el navegador para que la interfaz no parpadee en la próxima
    // carga mientras se espera la respuesta del Worker
    if (datos.tuVoto) guardarLocal(datos.tuVoto);
  }

  function porcentajes(si, no) {
    const total = si + no;
    if (total === 0) return { si: 50, no: 50, total: 0, vacio: true };
    const pctSi = Math.round((si / total) * 100);
    return { si: pctSi, no: 100 - pctSi, total: total, vacio: false };
  }

  function armar(datos) {
    const si = Number(datos[claves.si]) || 0;
    const no = Number(datos[claves.no]) || 0;
    return Object.assign({ votosSi: si, votosNo: no }, porcentajes(si, no));
  }

  async function estado() {
    const datos = await window.Contador.leer([claves.si, claves.no]);
    anotarServidor(datos);
    return armar(datos);
  }

  async function votar(opcion) {
    if (voto()) return estado();

    const clave = opcion === "si" ? claves.si : claves.no;
    const respuesta = await window.Contador.sumar(clave);

    if (window.Contador.esRemoto()) {
      // el Worker decide: puede haber rechazado el voto porque esta IP ya votó
      anotarServidor(respuesta);
      const fresco = await estado();
      return Object.assign(fresco, { aceptado: respuesta.aceptado !== false });
    }

    guardarLocal(opcion);
    return Object.assign(await estado(), { aceptado: true });
  }

  return {
    estado: estado,
    votar: votar,
    voto: voto,
    porcentajes: porcentajes
  };
})();
