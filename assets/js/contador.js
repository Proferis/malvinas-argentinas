/**
 * Contador compartido sin API de terceros.
 *
 * Con `CONFIG.contador.endpoint` apuntando al Worker propio (ver /worker),
 * los números son globales. Sin endpoint, el sitio sigue funcionando en modo
 * local: los valores viven en localStorage y la interfaz lo aclara, para no
 * mostrar un número de navegador como si fuera público.
 */
window.Contador = (function () {
  const LOCAL = "bm:contador-local";
  const endpoint = (window.CONFIG.contador.endpoint || "").replace(/\/$/, "");
  const remoto = Boolean(endpoint);

  function leerLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL) || "{}"); } catch (e) { return {}; }
  }

  function guardarLocal(datos) {
    try { localStorage.setItem(LOCAL, JSON.stringify(datos)); } catch (e) { /* modo privado */ }
  }

  async function pedir(ruta, opciones) {
    const respuesta = await fetch(endpoint + ruta, opciones);
    if (!respuesta.ok) throw new Error("contador: " + respuesta.status);
    return respuesta.json();
  }

  async function leer(claves) {
    if (!remoto) {
      const datos = leerLocal();
      const salida = {};
      claves.forEach(function (c) { salida[c] = datos[c] || 0; });
      return salida;
    }
    return pedir("/leer?claves=" + encodeURIComponent(claves.join(",")));
  }

  async function sumar(clave) {
    if (!remoto) {
      const datos = leerLocal();
      datos[clave] = (datos[clave] || 0) + 1;
      guardarLocal(datos);
      return { [clave]: datos[clave] };
    }
    return pedir("/sumar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave: clave })
    });
  }

  async function contarVisita() {
    const clave = window.CONFIG.contador.claves.visitas;
    let yaContada = false;
    try { yaContada = Boolean(sessionStorage.getItem("bm:visita")); } catch (e) { /* modo privado */ }

    if (yaContada) return leer([clave]);
    try { sessionStorage.setItem("bm:visita", "1"); } catch (e) { /* modo privado */ }
    return sumar(clave);
  }

  return {
    leer: leer,
    sumar: sumar,
    contarVisita: contarVisita,
    esRemoto: function () { return remoto; }
  };
})();
