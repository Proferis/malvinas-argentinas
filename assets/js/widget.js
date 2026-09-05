(function () {
  const params = new URLSearchParams(location.search);
  const ancla = new Date(window.CONFIG.ancla);

  const UNIDADES_VALIDAS = ["anios", "meses", "semanas", "dias", "horas", "minutos", "segundos"];
  const ESCALAS = { s: 0.8, m: 1, l: 1.4 };
  const FUENTES = {
    mono: '"Chivo Mono", ui-monospace, monospace',
    sans: '"Archivo", ui-sans-serif, system-ui, sans-serif',
    display: '"Anton", "Arial Narrow", sans-serif'
  };

  function param(nombre, permitidos, porDefecto) {
    const valor = (params.get(nombre) || "").toLowerCase();
    return permitidos.indexOf(valor) !== -1 ? valor : porDefecto;
  }

  function resolverTema() {
    const tema = param("tema", ["claro", "oscuro", "transparente", "auto"], "auto");
    if (tema !== "auto") return tema;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  }

  function aplicarEstilo() {
    document.documentElement.dataset.tema = resolverTema();
    document.documentElement.style.setProperty(
      "--w-escala", ESCALAS[param("tamano", ["s", "m", "l"], "m")]
    );

    document.documentElement.style.setProperty(
      "--w-fuente-cifras", FUENTES[param("fuente", ["mono", "sans", "display"], "mono")]
    );

    const acento = params.get("acento");
    if (acento && /^#?[0-9a-f]{6}$/i.test(acento)) {
      const hex = acento.startsWith("#") ? acento : "#" + acento;
      document.documentElement.style.setProperty("--w-acento", hex);
      document.documentElement.style.setProperty("--w-si", hex);
    }
  }

  function unidadesElegidas() {
    const crudas = (params.get("unidades") || "anios,meses,semanas,dias").split(",");
    const limpias = crudas
      .map(function (u) { return u.trim().toLowerCase(); })
      .filter(function (u) { return UNIDADES_VALIDAS.indexOf(u) !== -1; });
    return limpias.length ? limpias : ["anios", "meses", "semanas", "dias"];
  }

  function montarCronometro(unidades) {
    const contenedor = document.getElementById("w-unidades");
    contenedor.textContent = "";
    unidades.forEach(function (clave) {
      const bloque = document.createElement("div");
      bloque.className = "w-unidad";
      const n = document.createElement("span");
      n.className = "n";
      n.dataset.unidad = clave;
      const u = document.createElement("span");
      u.className = "u";
      u.dataset.etiqueta = clave;
      bloque.appendChild(n);
      bloque.appendChild(u);
      contenedor.appendChild(bloque);
    });
  }

  function pintarCronometro() {
    const t = window.Tiempo.transcurrido(ancla);
    document.querySelectorAll("[data-unidad]").forEach(function (el) {
      el.textContent = t[el.dataset.unidad];
    });
    document.querySelectorAll("[data-etiqueta]").forEach(function (el) {
      el.textContent = window.I18n.unidad(el.dataset.etiqueta, t[el.dataset.etiqueta]);
    });
    document.getElementById("w-reloj").textContent =
      [t.horas, t.minutos, t.segundos].map(window.Tiempo.dosDigitos).join(":");
  }

  async function pintarMercado() {
    let datos;
    try {
      datos = await window.Mercado.estado();
    } catch (e) {
      datos = window.Mercado.porcentajes(0, 0);
    }
    document.getElementById("w-barra-si").style.width = (datos.vacio ? 0 : datos.si) + "%";
    document.getElementById("w-barra-no").style.width = (datos.vacio ? 0 : datos.no) + "%";
    document.getElementById("w-pct-si").textContent = datos.vacio ? "—" : datos.si + "%";
    document.getElementById("w-pct-no").textContent = datos.vacio ? "—" : datos.no + "%";
    document.getElementById("w-grafico").setAttribute("aria-label", datos.vacio
      ? window.I18n.t("mercado.sinVotos")
      : window.I18n.t("mercado.grafico", { si: datos.si, no: datos.no }));
    document.getElementById("w-pie").textContent = datos.vacio
      ? window.I18n.t("mercado.sinVotos")
      : window.I18n.t("mercado.votos", { n: window.Tiempo.miles(datos.total, window.I18n.idioma()) });
  }

  const modo = param("modo", ["cronometro", "mercado"], "cronometro");
  window.I18n.init(param("idioma", ["es", "en"], null));
  aplicarEstilo();

  if (modo === "mercado") {
    document.getElementById("bloque-mercado").hidden = false;
    document.getElementById("w-kicker").textContent = window.I18n.t("mercado.titulo");
    document.getElementById("w-pregunta").textContent = window.I18n.t("mercado.pregunta");
    document.getElementById("w-et-si").textContent = window.I18n.t("mercado.si");
    document.getElementById("w-et-no").textContent = window.I18n.t("mercado.no");
    pintarMercado();
    setInterval(pintarMercado, 60000);
  } else {
    document.getElementById("bloque-cronometro").hidden = false;
    document.getElementById("w-kicker").textContent = window.I18n.t("hero.kicker");
    montarCronometro(unidadesElegidas());
    pintarCronometro();
    setInterval(pintarCronometro, 1000);
  }
})();
