/**
 * Interruptor de tipografía.
 *
 * "original" es el sistema tipográfico del sitio (Archivo + Chivo Mono) y es
 * el que rige por defecto. "bandera" pasa toda la página a la letra pintada del
 * trapo: es una decisión estética explícita de quien mira, nunca automática.
 */
window.Tipografia = (function () {
  const CLAVE = "bm:tipografia";
  const VALIDAS = ["original", "bandera"];

  function activa() {
    const puesta = document.documentElement.dataset.tipografia;
    return VALIDAS.indexOf(puesta) >= 0 ? puesta : "original";
  }

  function aplicar(cual) {
    if (VALIDAS.indexOf(cual) < 0) return;
    document.documentElement.dataset.tipografia = cual;
    try { localStorage.setItem(CLAVE, cual); } catch (e) { /* modo privado */ }
    document.dispatchEvent(new CustomEvent("tipografia:cambio", { detail: { tipografia: cual } }));
  }

  function init() {
    let previa = null;
    try { previa = localStorage.getItem(CLAVE); } catch (e) { /* modo privado */ }
    document.documentElement.dataset.tipografia = VALIDAS.indexOf(previa) >= 0 ? previa : "original";
  }

  return { init: init, aplicar: aplicar, activa: activa };
})();

window.Tipografia.init();
