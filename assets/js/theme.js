window.Tema = (function () {
  const CLAVE = "bm:tema";

  function guardado() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }

  function activo() {
    const elegido = document.documentElement.dataset.theme;
    if (elegido) return elegido;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  }

  function aplicar(tema) {
    document.documentElement.dataset.theme = tema;
    try { localStorage.setItem(CLAVE, tema); } catch (e) { /* modo privado */ }
    document.dispatchEvent(new CustomEvent("tema:cambio", { detail: { tema: tema } }));
  }

  function alternar() {
    aplicar(activo() === "oscuro" ? "claro" : "oscuro");
  }

  function init() {
    const previo = guardado();
    if (previo) document.documentElement.dataset.theme = previo;
  }

  return { init: init, aplicar: aplicar, alternar: alternar, activo: activo };
})();

window.Tema.init();
