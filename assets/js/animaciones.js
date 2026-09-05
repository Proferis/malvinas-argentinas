/**
 * Movimiento de la página: aparición al scrollear, conteo de las cifras,
 * cinta de novedades y barra de progreso.
 *
 * Todo se apaga entero si el sistema pide menos movimiento —ahí las cifras
 * aparecen ya en su valor final y la cinta queda quieta y legible—, así que
 * ninguna función de la página depende de que la animación corra.
 */
window.Animaciones = (function () {
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reducido() { return quieto.matches; }

  /* ---------- aparición progresiva de las secciones ---------- */

  function revelar(raiz) {
    const objetivos = (raiz || document).querySelectorAll("[data-revelar]:not(.revelado)");

    if (reducido() || !("IntersectionObserver" in window)) {
      objetivos.forEach(function (el) { el.classList.add("revelado"); });
      return;
    }

    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("revelado");
        observador.unobserve(entrada.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    objetivos.forEach(function (el) { observador.observe(el); });
  }

  /* ---------- conteo de las cifras ---------- */

  const suave = (t) => 1 - Math.pow(1 - t, 3);

  /**
   * Lleva un número de `desde` a `hasta` con un formateador propio.
   * Devuelve una función para cancelar: si el valor cambia a mitad de camino
   * —el cronómetro corre cada segundo— la animación vieja no debe pisar a la nueva.
   */
  function contar(nodo, desde, hasta, ms, formato) {
    if (reducido() || desde === hasta) {
      nodo.textContent = formato(hasta);
      return function () {};
    }
    let pedido = 0;
    const arranque = performance.now();

    function paso(ahora) {
      const t = Math.min(1, (ahora - arranque) / ms);
      nodo.textContent = formato(Math.round(desde + (hasta - desde) * suave(t)));
      if (t < 1) pedido = requestAnimationFrame(paso);
    }
    pedido = requestAnimationFrame(paso);
    return function () { cancelAnimationFrame(pedido); };
  }

  /** Corre `accion` una sola vez, cuando `nodo` entra en pantalla. */
  function alVer(nodo, accion, umbral) {
    if (!nodo) return;
    if (reducido() || !("IntersectionObserver" in window)) { accion(); return; }

    const observador = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        obs.unobserve(entrada.target);
        accion();
      });
    }, { threshold: umbral || 0.35 });
    observador.observe(nodo);
  }

  /**
   * Cuenta desde cero la primera vez que la cifra entra en pantalla.
   * `leer` devuelve el valor actual en el momento en que arranca, no antes:
   * así el conteo termina en el número que corresponde y no en uno viejo.
   */
  function contarAlVer(nodo, leer, formato, ms) {
    if (reducido() || !("IntersectionObserver" in window)) {
      nodo.textContent = formato(leer());
      return;
    }
    alVer(nodo, function () { contar(nodo, 0, leer(), ms || 1100, formato); }, 0.4);
  }

  /* ---------- cinta de novedades ---------- */

  /**
   * Marquesina continua. El truco es duplicar el contenido y correr la pista
   * exactamente la mitad de su ancho: al terminar, la copia está donde estaba
   * el original y el salto no se ve. La duración sale del ancho real para que
   * la velocidad no dependa de cuántas novedades haya.
   */
  function cinta(pista, velocidadPxPorSegundo) {
    if (!pista || !pista.children.length) return;
    if (pista.dataset.duplicada) return;

    const original = Array.prototype.slice.call(pista.children);
    original.forEach(function (nodo) {
      const copia = nodo.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      pista.appendChild(copia);
    });
    pista.dataset.duplicada = "1";

    function medir() {
      const mitad = pista.scrollWidth / 2;
      if (!mitad) return;
      pista.style.setProperty("--recorrido", "-" + mitad.toFixed(1) + "px");
      pista.style.setProperty("--duracion", (mitad / (velocidadPxPorSegundo || 55)).toFixed(1) + "s");
    }

    medir();
    if (window.ResizeObserver) new ResizeObserver(medir).observe(pista);
  }

  /* ---------- tira con scroll horizontal ---------- */

  /**
   * Carrusel de una sola caja: la tira scrollea en horizontal —con el dedo, con
   * la rueda, con Tab o con las flechas— y los botones la corren de a una
   * tarjeta. Los botones son un atajo, no el único camino: si el JS no corre, la
   * tira sigue siendo un contenedor scrolleable común.
   */
  function carrusel(tira, anterior, siguiente) {
    if (!tira) return;

    function paso() {
      const tarjeta = tira.querySelector("li");
      // el ancho de una tarjeta más el hueco; si no hay tarjetas, media pantalla
      return tarjeta ? tarjeta.getBoundingClientRect().width + 16 : tira.clientWidth * 0.5;
    }

    function correr(signo) {
      tira.scrollBy({ left: signo * paso(), behavior: reducido() ? "auto" : "smooth" });
    }

    function marcar() {
      const desplazable = tira.scrollWidth - tira.clientWidth;
      const hayQueCorrer = desplazable > 4;
      // 4px de tolerancia: el scroll fraccionario no siempre llega al final exacto
      if (anterior) {
        anterior.disabled = !hayQueCorrer || tira.scrollLeft <= 4;
        anterior.hidden = !hayQueCorrer;
      }
      if (siguiente) {
        siguiente.disabled = !hayQueCorrer || tira.scrollLeft >= desplazable - 4;
        siguiente.hidden = !hayQueCorrer;
      }
      tira.classList.toggle("tira-corrible", hayQueCorrer);
      // sólo entra en el orden de tabulación si hay algo que scrollear
      if (hayQueCorrer) tira.setAttribute("tabindex", "0");
      else tira.removeAttribute("tabindex");
    }

    if (anterior) anterior.addEventListener("click", function () { correr(-1); });
    if (siguiente) siguiente.addEventListener("click", function () { correr(1); });

    tira.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      correr(e.key === "ArrowRight" ? 1 : -1);
    });

    let pendiente = false;
    tira.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; marcar(); });
    }, { passive: true });

    if (window.ResizeObserver) new ResizeObserver(marcar).observe(tira);
    marcar();
    return { marcar: marcar };
  }

  /* ---------- barra de progreso y encabezado ---------- */

  function progreso(barra, encabezado) {
    let pendiente = false;

    function pintar() {
      pendiente = false;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      if (barra) barra.style.transform = "scaleX(" + (alto > 0 ? Math.min(1, y / alto) : 0) + ")";
      if (encabezado) encabezado.classList.toggle("encogido", y > 24);
    }

    window.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    }, { passive: true });

    pintar();
  }

  return {
    revelar: revelar,
    contar: contar,
    contarAlVer: contarAlVer,
    alVer: alVer,
    cinta: cinta,
    carrusel: carrusel,
    progreso: progreso,
    reducido: reducido
  };
})();
