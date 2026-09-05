/**
 * Curva de probabilidad, al estilo de un mercado de predicción.
 *
 * Una sola serie, así que no lleva leyenda: el título dice qué se está viendo.
 * El SVG se dibuja con clases y los colores salen de las variables CSS, de modo
 * que cambiar de tema no obliga a redibujar nada.
 */
window.Grafico = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const M = { arriba: 14, derecha: 54, abajo: 26, izquierda: 36 };
  const ALTO = 260;

  function el(nombre, atributos) {
    const nodo = document.createElementNS(NS, nombre);
    for (const k in atributos) nodo.setAttribute(k, atributos[k]);
    return nodo;
  }

  function fechaCorta(dia, idioma) {
    return new Intl.DateTimeFormat(idioma === "en" ? "en-GB" : "es-AR", {
      day: "numeric", month: "short", timeZone: "UTC"
    }).format(new Date(dia + "T12:00:00Z"));
  }

  function fechaLarga(dia, idioma) {
    return new Intl.DateTimeFormat(idioma === "en" ? "en-GB" : "es-AR", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    }).format(new Date(dia + "T12:00:00Z"));
  }

  /** Cuántas etiquetas de fecha entran sin encimarse, según el ancho. */
  function saltoEtiquetas(puntos, ancho) {
    const cabe = Math.max(2, Math.floor((ancho - M.izquierda - M.derecha) / 78));
    return Math.max(1, Math.ceil(puntos.length / cabe));
  }

  function crear(contenedor, opciones) {
    const lienzo = document.createElement("div");
    lienzo.className = "g-lienzo";

    const globo = document.createElement("div");
    globo.className = "g-globo";
    globo.hidden = true;

    contenedor.textContent = "";
    contenedor.appendChild(lienzo);
    contenedor.appendChild(globo);

    let puntos = [];
    let idioma = "es";
    let escalaX = null;
    let ancho = 0;
    let indiceActivo = null;   // punto que está mostrando el globo, si hay alguno
    let soltarCierre = null;   // baja los escuchas globales del dibujo anterior

    /**
     * Escuchas fuera del gráfico que cierran el globo: un toque en cualquier
     * otro lado o un scroll de la página. Se dan de baja en cada redibujado
     * para no acumular uno por cada cambio de tamaño de la ventana.
     */
    function registrarCierre(svg, ocultar, medir) {
      if (soltarCierre) soltarCierre();

      function afuera(e) {
        if (!svg.contains(e.target)) ocultar();
      }
      function alScrollear() { ocultar(); }
      function alRedimensionar() { medir(); }

      document.addEventListener("pointerdown", afuera, true);
      window.addEventListener("scroll", alScrollear, { passive: true });
      window.addEventListener("resize", alRedimensionar);

      soltarCierre = function () {
        document.removeEventListener("pointerdown", afuera, true);
        window.removeEventListener("scroll", alScrollear);
        window.removeEventListener("resize", alRedimensionar);
        soltarCierre = null;
      };
    }

    function dibujar() {
      ancho = Math.max(280, lienzo.clientWidth || contenedor.clientWidth || 640);
      lienzo.textContent = "";
      globo.hidden = true;
      indiceActivo = null;
      if (!puntos.length) return;

      const x0 = M.izquierda;
      const x1 = ancho - M.derecha;
      const y0 = M.arriba;
      const y1 = ALTO - M.abajo;

      // un solo punto no tiene recta: se lo dibuja al borde derecho
      const paso = puntos.length > 1 ? (x1 - x0) / (puntos.length - 1) : 0;
      escalaX = (i) => (puntos.length > 1 ? x0 + i * paso : x1);
      const escalaY = (v) => y1 - (v / 100) * (y1 - y0);

      const svg = el("svg", {
        class: "g-svg",
        viewBox: `0 0 ${ancho} ${ALTO}`,
        width: "100%", height: ALTO,
        role: "img",
        "aria-label": opciones.resumen ? opciones.resumen(puntos) : ""
      });

      /* rejilla y eje vertical */
      [0, 25, 50, 75, 100].forEach(function (v) {
        const y = escalaY(v);
        svg.appendChild(el("line", {
          class: v === 50 ? "g-grid g-grid-medio" : "g-grid",
          x1: x0, y1: y, x2: x1, y2: y
        }));
        const t = el("text", { class: "g-tick g-tick-y", x: x0 - 8, y: y + 4 });
        t.textContent = v + "%";
        svg.appendChild(t);
      });

      /* área y línea */
      const d = puntos.map(function (p, i) {
        return (i ? "L" : "M") + escalaX(i).toFixed(1) + " " + escalaY(p.prob).toFixed(1);
      }).join("");

      if (puntos.length > 1) {
        svg.appendChild(el("path", {
          class: "g-area",
          d: d + `L${x1} ${y1}L${x0} ${y1}Z`
        }));
      }

      /* días con acto oficial: marca vertical discreta, por encima del área
         para que el lavado del relleno no se la coma */
      puntos.forEach(function (p, i) {
        if (!p.hito) return;
        svg.appendChild(el("line", {
          class: "g-hito", x1: escalaX(i), y1: y0, x2: escalaX(i), y2: y1
        }));
      });

      svg.appendChild(el("path", { class: "g-linea", d: d }));

      /* etiquetas de fecha */
      const salto = saltoEtiquetas(puntos, ancho);
      puntos.forEach(function (p, i) {
        if (i % salto !== 0 && i !== puntos.length - 1) return;
        const t = el("text", { class: "g-tick", x: escalaX(i), y: ALTO - 8 });
        t.textContent = fechaCorta(p.fecha, idioma);
        svg.appendChild(t);
      });

      /* punta de la serie: anillo del color de la superficie para que despegue */
      const ultimo = puntos[puntos.length - 1];
      const ux = escalaX(puntos.length - 1);
      const uy = escalaY(ultimo.prob);
      svg.appendChild(el("circle", { class: "g-punta-anillo", cx: ux, cy: uy, r: 6.5 }));
      svg.appendChild(el("circle", { class: "g-punta", cx: ux, cy: uy, r: 4.5 }));

      const etiqueta = el("text", { class: "g-punta-texto", x: ux + 12, y: uy + 4 });
      etiqueta.textContent = Math.round(ultimo.prob) + "%";
      svg.appendChild(etiqueta);

      /* --------------------------------------------------------------
         Capa de exploración: cruceta y globo.

         Con mouse: aparece al pasar por encima y se va al salir.
         Con el dedo: aparece al tocar y se queda —hay que poder leerlo— hasta
         que se toca fuera o se scrollea. Sin eso el globo quedaba pegado en
         pantalla, porque en táctil no hay "salir del elemento".

         El movimiento se procesa una vez por cuadro y con el recuadro del SVG
         cacheado: medirlo en cada evento fuerza un reflujo por movimiento y es
         lo que hacía que el gráfico se trabara al arrastrar el dedo.
         -------------------------------------------------------------- */
      const cruceta = el("line", { class: "g-cursor", x1: 0, y1: y0, x2: 0, y2: y1, opacity: 0 });
      const foco = el("circle", { class: "g-foco", cx: 0, cy: 0, r: 5, opacity: 0 });
      svg.appendChild(cruceta);
      svg.appendChild(foco);

      const zona = el("rect", {
        class: "g-zona", x: x0 - paso / 2, y: y0,
        width: x1 - x0 + paso, height: y1 - y0
      });
      svg.appendChild(zona);

      let recuadro = null;
      let cuadroPedido = 0;
      let visible = false;

      function medir() { recuadro = svg.getBoundingClientRect(); }

      function indiceEn(clienteX) {
        if (!recuadro) medir();
        const px = ((clienteX - recuadro.left) / recuadro.width) * ancho;
        if (puntos.length === 1) return 0;
        return Math.max(0, Math.min(puntos.length - 1, Math.round((px - x0) / paso)));
      }

      function pintarEn(i) {
        const p = puntos[i];
        const px = escalaX(i);
        const py = escalaY(p.prob);

        cruceta.setAttribute("x1", px);
        cruceta.setAttribute("x2", px);
        cruceta.setAttribute("opacity", 1);
        foco.setAttribute("cx", px);
        foco.setAttribute("cy", py);
        foco.setAttribute("opacity", 1);

        globo.hidden = false;
        globo.textContent = "";
        globo.appendChild(opciones.globo(p, idioma));

        const escala = recuadro.width / ancho;
        globo.style.left = Math.max(4, Math.min(recuadro.width - globo.offsetWidth - 4,
          px * escala - globo.offsetWidth / 2)) + "px";

        // por defecto va arriba del punto; si no entra, baja, porque recortarlo
        // contra el borde superior lo dejaría tapando la propia curva
        const arriba = py * escala - globo.offsetHeight - 14;
        globo.style.top = (arriba >= 0 ? arriba : py * escala + 16) + "px";

        visible = true;
        indiceActivo = i;
      }

      function mostrar(clienteX) {
        if (cuadroPedido) return;                 // un repintado por cuadro, no por evento
        cuadroPedido = requestAnimationFrame(function () {
          cuadroPedido = 0;
          pintarEn(indiceEn(clienteX));
        });
      }

      function ocultar() {
        if (cuadroPedido) { cancelAnimationFrame(cuadroPedido); cuadroPedido = 0; }
        if (!visible) return;
        visible = false;
        cruceta.setAttribute("opacity", 0);
        foco.setAttribute("opacity", 0);
        globo.hidden = true;
      }

      zona.addEventListener("pointerenter", function (e) { medir(); mostrar(e.clientX); });
      zona.addEventListener("pointermove", function (e) { mostrar(e.clientX); });
      zona.addEventListener("pointerdown", function (e) { medir(); mostrar(e.clientX); });

      // sólo el mouse se va al salir; el dedo se queda hasta que toquen afuera
      zona.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "mouse") ocultar();
      });

      // el navegador se quedó con el gesto para scrollear la página: el globo
      // no tiene que seguir persiguiendo un dedo que ya no es nuestro
      zona.addEventListener("pointercancel", ocultar);

      /* Teclado: el gráfico es un control más. Se enfoca con Tab y se recorre
         punto por punto con las flechas, así el dato no queda detrás del mouse. */
      svg.setAttribute("tabindex", "0");
      svg.addEventListener("keydown", function (e) {
        const salto = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[e.key];
        if (salto === undefined) {
          if (e.key === "Escape") ocultar();
          return;
        }
        e.preventDefault();
        medir();
        const desde = indiceActivo === null ? puntos.length - 1 : indiceActivo;
        pintarEn(Math.max(0, Math.min(puntos.length - 1,
          salto === Infinity ? puntos.length - 1 : salto === -Infinity ? 0 : desde + salto)));
      });
      svg.addEventListener("blur", ocultar);

      registrarCierre(svg, ocultar, medir);

      lienzo.appendChild(svg);
    }

    function actualizar(nuevos, nuevoIdioma) {
      puntos = nuevos;
      idioma = nuevoIdioma || idioma;
      dibujar();
    }

    if (window.ResizeObserver) {
      let previo = 0;
      new ResizeObserver(function () {
        const actual = lienzo.clientWidth;
        if (Math.abs(actual - previo) < 8) return;   // evita redibujar por 1px
        previo = actual;
        dibujar();
      }).observe(lienzo);
    } else {
      window.addEventListener("resize", dibujar);
    }

    return { actualizar: actualizar, fechaLarga: fechaLarga };
  }

  return { crear: crear, fechaLarga: fechaLarga, fechaCorta: fechaCorta };
})();
