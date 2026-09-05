(function () {
  const CONFIG = window.CONFIG;
  const ancla = new Date(CONFIG.ancla);
  const eleccion = new Date(CONFIG.eleccion.fecha);

  const $ = function (sel) { return document.querySelector(sel); };

  const unidades = [
    { clave: "anios", valor: "#u-anios", etiqueta: "#l-anios" },
    { clave: "meses", valor: "#u-meses", etiqueta: "#l-meses" },
    { clave: "semanas", valor: "#u-semanas", etiqueta: "#l-semanas" },
    { clave: "dias", valor: "#u-dias", etiqueta: "#l-dias" }
  ];

  let curva = null;              // instancia del gráfico
  let serie = [];                // serie diaria vigente
  let tilesListos = false;       // el conteo inicial todavía manda sobre las cifras
  let probAnimada = false;       // la cifra grande ya hizo su conteo de entrada

  /* ======================================================================
     Cronómetro
     ====================================================================== */

  /**
   * Escribe una cifra del cronómetro y, si cambió, la hace entrar desde abajo.
   * Reiniciar la animación pide sacar la clase, forzar un reflujo y volver a
   * ponerla: si no, el navegador ve el mismo estado y no la vuelve a correr.
   */
  function escribirCifra(nodo, valor) {
    const texto = String(valor);
    if (nodo.textContent === texto) return;
    nodo.textContent = texto;
    if (window.Animaciones.reducido()) return;
    nodo.classList.remove("rodando");
    void nodo.offsetWidth;
    nodo.classList.add("rodando");
  }

  function pintarCronometro() {
    const t = window.Tiempo.transcurrido(ancla);
    const idioma = window.I18n.idioma();

    unidades.forEach(function (u) {
      // mientras corre el conteo de entrada, el repintado de cada segundo no
      // debe pisar la animación: la etiqueta sí se actualiza, la cifra no
      if (tilesListos) escribirCifra($(u.valor), t[u.clave]);
      $(u.etiqueta).textContent = window.I18n.unidad(u.clave, t[u.clave]);
    });

    $("#reloj").textContent = [t.horas, t.minutos, t.segundos]
      .map(window.Tiempo.dosDigitos).join(":");

    $("#resumen-tiempo").textContent = window.I18n.t("hero.resumen", {
      dias: window.Tiempo.miles(t.totalDias, idioma),
      udias: window.I18n.unidad("dias", t.totalDias),
      semanas: window.Tiempo.miles(t.totalSemanas, idioma),
      usemanas: window.I18n.unidad("semanas", t.totalSemanas),
      horas: window.Tiempo.miles(t.totalHoras, idioma),
      uhoras: window.I18n.unidad("horas", t.totalHoras)
    });
  }

  /**
   * Las cuatro cifras crecen desde cero cuando el bloque entra en pantalla.
   * Se dispara al verlas y no al cargar la página porque en un teléfono los
   * bloques quedan bajo la bandera: si arrancara solo, la animación pasaría
   * entera fuera de la pantalla y nadie la vería nunca.
   */
  function animarTiles() {
    window.Animaciones.alVer($(".tiles"), function () {
      const t = window.Tiempo.transcurrido(ancla);
      unidades.forEach(function (u) {
        window.Animaciones.contar($(u.valor), 0, t[u.clave], 1000, function (n) { return n; });
      });
      // el reloj sigue corriendo cada segundo: hasta que termine el conteo no
      // puede pisar las cifras
      setTimeout(function () { tilesListos = true; }, 1100);
    }, 0.25);
  }

  /* ======================================================================
     Curva de probabilidad
     ====================================================================== */

  /**
   * Serie diaria. El punto de hoy usa los votos en vivo en lugar de los que
   * dejó el scraper por la mañana, así votar mueve la curva en el acto.
   */
  function calcularSerie(votos) {
    const hoy = window.Modelo.diaAR(new Date());
    const guardados = (window.HISTORIAL.puntos || []).filter(function (p) { return p.fecha !== hoy; });

    if (votos) {
      guardados.push({ fecha: hoy, votosSi: votos.votosSi || 0, votosNo: votos.votosNo || 0 });
    }

    return window.Modelo.serie({
      ancla: CONFIG.ancla,
      hasta: new Date(),
      novedades: (window.NOVEDADES && window.NOVEDADES.items) || [],
      modelo: CONFIG.modelo,
      puntos: guardados
    });
  }

  function globoDeCurva(p, idioma) {
    const lista = document.createElement("dl");

    const dt = document.createElement("dt");
    dt.textContent = window.Grafico.fechaLarga(p.fecha, idioma);
    lista.appendChild(dt);

    const dd = document.createElement("dd");
    const valor = document.createElement("span");
    valor.className = "valor";
    valor.textContent = p.prob.toFixed(1) + "%";
    dd.appendChild(valor);
    lista.appendChild(dd);

    const desglose = document.createElement("dd");
    desglose.className = "desglose";
    desglose.textContent = window.I18n.t("prob.globoDesglose", {
      base: p.base.toFixed(0),
      impulso: p.impulso.toFixed(1)
    });
    lista.appendChild(desglose);

    const votos = document.createElement("dd");
    votos.className = "desglose";
    votos.textContent = p.votos
      ? window.I18n.t("prob.globoVotos", { n: window.Tiempo.miles(p.votos, idioma) })
      : window.I18n.t("prob.globoSinVotos");
    lista.appendChild(votos);

    if (p.hito) {
      const hito = document.createElement("dd");
      hito.className = "desglose";
      hito.textContent = window.I18n.t("prob.globoHito");
      lista.appendChild(hito);
    }
    return lista;
  }

  function resumenDeCurva(puntos) {
    const idioma = window.I18n.idioma();
    const valores = puntos.map(function (p) { return p.prob; });
    return window.I18n.t("prob.resumen", {
      desde: window.Grafico.fechaLarga(puntos[0].fecha, idioma),
      hasta: window.Grafico.fechaLarga(puntos[puntos.length - 1].fecha, idioma),
      valor: Math.round(valores[valores.length - 1]),
      min: Math.round(Math.min.apply(null, valores)),
      max: Math.round(Math.max.apply(null, valores))
    });
  }

  function pintarCifraProbabilidad(valor) {
    const nodo = $("#prob-actual");
    const formato = function (n) { return n + "%"; };

    if (!probAnimada) {
      probAnimada = true;
      window.Animaciones.contarAlVer(nodo, function () { return Math.round(valor); }, formato, 1200);
      return;
    }
    const previo = parseInt(nodo.textContent, 10);
    window.Animaciones.contar(nodo, isNaN(previo) ? 0 : previo, Math.round(valor), 600, formato);
  }

  /** Cuánto se movió la curva en la última semana, o en todo lo que haya. */
  function pintarDelta(puntos) {
    const nodo = $("#prob-delta");
    if (puntos.length < 2) {
      nodo.textContent = window.I18n.t("prob.deltaSinDatos");
      return;
    }
    const atras = Math.min(7, puntos.length - 1);
    const diferencia = puntos[puntos.length - 1].prob - puntos[puntos.length - 1 - atras].prob;
    const signo = diferencia > 0 ? "+" : diferencia < 0 ? "−" : "±";

    nodo.textContent = "";
    const span = document.createElement("span");
    span.className = diferencia > 0 ? "sube" : diferencia < 0 ? "baja" : "";
    span.textContent = window.I18n.t("prob.delta", {
      signo: signo,
      n: Math.abs(diferencia).toFixed(1),
      dias: atras
    });
    nodo.appendChild(span);
  }

  function pintarTablaProbabilidad(puntos) {
    const cuerpo = $("#tabla-prob-cuerpo");
    const idioma = window.I18n.idioma();
    cuerpo.textContent = "";

    puntos.slice().reverse().forEach(function (p) {
      const fila = document.createElement("tr");

      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = window.Grafico.fechaCorta(p.fecha, idioma) + " " + p.fecha.slice(0, 4);
      fila.appendChild(th);

      [p.prob.toFixed(1) + "%", p.base.toFixed(1) + "%", "+" + p.impulso.toFixed(1),
        window.Tiempo.miles(p.votos, idioma)].forEach(function (texto) {
        const td = document.createElement("td");
        td.textContent = texto;
        fila.appendChild(td);
      });

      cuerpo.appendChild(fila);
    });
  }

  function pintarFormula() {
    const m = CONFIG.modelo;
    $("#prob-formula").textContent =
      "probabilidad = base + impulso, recortada a [" + m.piso + ", " + m.techo + "]\n" +
      "base    = " + m.neutral + " + (%sí − " + m.neutral + ") × min(1, votos / " + m.votosParaConfiar + ")\n" +
      "impulso = Σ peso(tipo) × 0.5 ^ (días / " + m.semividaDias + "), tope " + m.topeImpulso + " pts";

    document.querySelectorAll('[data-i18n="prob.formulaPie"]').forEach(function (el) {
      el.textContent = window.I18n.t("prob.formulaPie", {
        semivida: m.semividaDias,
        votos: window.Tiempo.miles(m.votosParaConfiar, window.I18n.idioma()),
        neutral: m.neutral
      });
    });
  }

  function pintarCurva(votos) {
    serie = calcularSerie(votos);
    const idioma = window.I18n.idioma();

    if (!serie.length) {
      $("#prob-rango").textContent = window.I18n.t("prob.sinDatos");
      return;
    }

    if (!curva) {
      curva = window.Grafico.crear($("#curva"), { globo: globoDeCurva, resumen: resumenDeCurva });
    }
    curva.actualizar(serie, idioma);

    pintarCifraProbabilidad(serie[serie.length - 1].prob);
    pintarDelta(serie);
    pintarTablaProbabilidad(serie);

    $("#prob-rango").textContent = window.I18n.t(
      serie.length === 1 ? "prob.rango.1" : "prob.rango",
      { n: serie.length, desde: window.Grafico.fechaLarga(serie[0].fecha, idioma) }
    );
  }

  /* ======================================================================
     Mercado
     ====================================================================== */

  function pintarMercado(datos) {
    const idioma = window.I18n.idioma();

    // sin votos no se dibuja un 50/50 que se leería como un resultado real
    $("#barra-si").style.width = (datos.vacio ? 0 : datos.si) + "%";
    $("#barra-no").style.width = (datos.vacio ? 0 : datos.no) + "%";
    $("#pct-si").textContent = datos.vacio ? "—" : datos.si + "%";
    $("#pct-no").textContent = datos.vacio ? "—" : datos.no + "%";
    $("#grafico-mercado").setAttribute("aria-label", datos.vacio
      ? window.I18n.t("mercado.sinVotos")
      : window.I18n.t("mercado.grafico", { si: datos.si, no: datos.no }));

    $("#votos-total").textContent = datos.vacio
      ? window.I18n.t("mercado.sinVotos")
      : window.I18n.t("mercado.votos", { n: window.Tiempo.miles(datos.total, idioma) });

    $("#mercado-cierre").textContent = window.I18n.t("mercado.cierre", {
      dias: window.Tiempo.miles(window.Tiempo.diasHasta(eleccion), idioma)
    });

    const elegido = window.Mercado.voto();
    ["si", "no"].forEach(function (opcion) {
      const boton = $("#btn-" + opcion);
      boton.disabled = Boolean(elegido);
      boton.classList.toggle("elegido", elegido === opcion);
      boton.setAttribute("aria-pressed", String(elegido === opcion));
    });

    $("#mercado-estado").textContent = mensajeDeVoto(datos, elegido);

    pintarCurva(datos);
  }

  /**
   * Qué decirle a quien votó. Con Worker desplegado el tope es por IP, así que
   * el voto puede haber sido rechazado aunque este navegador nunca haya votado:
   * en ese caso hay que decirlo, no simular que entró.
   */
  function mensajeDeVoto(datos, elegido) {
    if (datos && datos.aceptado === false) {
      return elegido
        ? window.I18n.t("mercado.rechazado", { opcion: window.I18n.t("mercado." + elegido) })
        : window.I18n.t("mercado.yaVotasteSinOpcion");
    }
    if (!elegido) return "";
    // el servidor puede saber que esta IP votó sin saber qué votó
    return elegido === "si" || elegido === "no"
      ? window.I18n.t("mercado.yaVotaste", { opcion: window.I18n.t("mercado." + elegido) })
      : window.I18n.t("mercado.yaVotasteSinOpcion");
  }

  async function cargarMercado() {
    try {
      pintarMercado(await window.Mercado.estado());
    } catch (e) {
      pintarMercado(Object.assign({ votosSi: 0, votosNo: 0 }, window.Mercado.porcentajes(0, 0)));
    }
  }

  async function votar(opcion) {
    try {
      pintarMercado(await window.Mercado.votar(opcion));
    } catch (e) {
      $("#mercado-estado").textContent = window.I18n.t("mercado.localAyuda");
    }
  }

  /* ======================================================================
     Cinta de novedades
     ====================================================================== */

  function pintarCinta() {
    const items = ((window.NOVEDADES && window.NOVEDADES.items) || [])
      .slice()
      .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); })
      .slice(0, 12);

    const cinta = $("#cinta");
    const pista = $("#cinta-pista");
    if (!items.length) { cinta.hidden = true; return; }

    cinta.hidden = false;
    cinta.setAttribute("aria-label", window.I18n.t("cinta.etiqueta"));
    pista.textContent = "";
    delete pista.dataset.duplicada;

    const idioma = window.I18n.idioma();
    items.forEach(function (n) {
      const a = document.createElement("a");
      a.className = "cinta-item";
      a.href = n.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const punto = document.createElement("i");
      punto.className = "cinta-punto";
      punto.setAttribute("aria-hidden", "true");
      a.appendChild(punto);

      const fecha = document.createElement("span");
      fecha.className = "cinta-fecha";
      fecha.textContent = window.Grafico.fechaCorta(window.Modelo.diaAR(n.fecha), idioma);
      a.appendChild(fecha);

      const titulo = document.createElement("span");
      titulo.textContent = n.titulo.length > 96 ? n.titulo.slice(0, 95).trim() + "…" : n.titulo;
      a.appendChild(titulo);

      pista.appendChild(a);
    });

    window.Animaciones.cinta(pista, 52);
  }

  /* ======================================================================
     Contador, widget y controles
     ====================================================================== */

  async function pintarVisitas() {
    const clave = CONFIG.contador.claves.visitas;
    const nodo = $("#contador-visitas");
    const idioma = window.I18n.idioma();
    try {
      const datos = await window.Contador.contarVisita();
      window.Animaciones.contar(nodo, 0, datos[clave] || 0, 1200, function (n) {
        return window.Tiempo.miles(n, idioma);
      });
    } catch (e) {
      nodo.textContent = "—";
    }
  }

  function pintarSnippets() {
    const base = location.href.replace(/[^/]*$/, "") + CONFIG.baseWidget;
    const idioma = window.I18n.idioma();
    $("#snippet-obs").textContent = base + "?modo=cronometro&tema=transparente&idioma=" + idioma;
    $("#snippet-web").textContent =
      '<iframe src="' + base + '?modo=cronometro&tema=claro&idioma=' + idioma +
      '" width="380" height="150" style="border:0" title="' + CONFIG.marca + '"></iframe>';
  }

  function conectarCopiado() {
    document.querySelectorAll("[data-copiar]").forEach(function (boton) {
      boton.addEventListener("click", async function () {
        const texto = $(boton.dataset.copiar).textContent;
        try {
          await navigator.clipboard.writeText(texto);
        } catch (e) {
          const area = document.createElement("textarea");
          area.value = texto;
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          area.remove();
        }
        boton.textContent = window.I18n.t("widget.copiado");
        setTimeout(function () { boton.textContent = window.I18n.t("widget.copiar"); }, 2000);
      });
    });
  }

  function conectarControles() {
    document.querySelectorAll("[data-tipografia]").forEach(function (boton) {
      boton.addEventListener("click", function () {
        window.Tipografia.aplicar(boton.dataset.tipografia);
      });
    });
    document.querySelectorAll("[data-tema]").forEach(function (boton) {
      boton.addEventListener("click", function () { window.Tema.aplicar(boton.dataset.tema); });
    });
    $("#btn-si").addEventListener("click", function () { votar("si"); });
    $("#btn-no").addEventListener("click", function () { votar("no"); });
  }

  function marcarControles() {
    const tema = window.Tema.activo();
    const tipografia = window.Tipografia.activa();
    document.querySelectorAll("[data-tema]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.tema === tema));
    });
    document.querySelectorAll("[data-tipografia]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.tipografia === tipografia));
    });
  }

  function marcarModoLocal() {
    if (window.Contador.esRemoto()) return;
    document.querySelectorAll("[data-local]").forEach(function (el) { el.hidden = false; });
  }

  /** Resalta en la navegación la sección que se está mirando. */
  function seguirSecciones() {
    const enlaces = Array.prototype.slice.call(document.querySelectorAll(".topbar nav a"));
    const secciones = enlaces
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    if (!secciones.length || !("IntersectionObserver" in window)) return;

    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        enlaces.forEach(function (a) {
          a.classList.toggle("activo", a.getAttribute("href") === "#" + entrada.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    secciones.forEach(function (s) { observador.observe(s); });
  }

  /* ======================================================================
     Arranque
     ====================================================================== */

  let tira = null;   // control del carrusel de novedades

  function pintarNovedades() {
    window.Novedades.pintar($("#lista-novedades"), $("#sello-actualizado"));
    if (tira) tira.marcar();
  }

  function repintarTexto() {
    window.I18n.pintar(document);
    pintarFormula();
    marcarControles();
    pintarCronometro();
    pintarNovedades();
    pintarCinta();
    pintarSnippets();
    cargarMercado();
  }

  document.addEventListener("idioma:cambio", repintarTexto);
  document.addEventListener("tema:cambio", marcarControles);
  document.addEventListener("tipografia:cambio", marcarControles);

  // El sitio es en español: el conmutador de idioma dejó su lugar al de
  // tipografía. Las cadenas en inglés siguen vivas para el widget, que se
  // configura con ?idioma=en.
  window.I18n.init("es");
  window.I18n.pintar(document);

  pintarFormula();
  marcarControles();
  marcarModoLocal();
  pintarCronometro();
  pintarNovedades();
  pintarCinta();
  pintarSnippets();
  conectarControles();
  conectarCopiado();
  cargarMercado();
  pintarVisitas();

  tira = window.Animaciones.carrusel($("#lista-novedades"), $("#nov-anterior"), $("#nov-siguiente"));

  window.Animaciones.revelar(document);
  window.Animaciones.progreso($("#progreso"), $("#topbar"));
  seguirSecciones();
  animarTiles();

  setInterval(pintarCronometro, 1000);
})();
