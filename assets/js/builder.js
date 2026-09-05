(function () {
  const form = document.getElementById("form-widget");
  const vista = document.getElementById("vista");
  const salidaUrl = document.getElementById("salida-url");
  const salidaIframe = document.getElementById("salida-iframe");
  const valorAcento = document.getElementById("valor-acento");
  const grupoUnidades = document.getElementById("grupo-unidades");

  const base = location.href.replace(/[^/]*$/, "") + window.CONFIG.baseWidget;

  function valores() {
    const datos = new FormData(form);
    return {
      modo: datos.get("modo"),
      tema: datos.get("tema"),
      idioma: datos.get("idioma"),
      fuente: datos.get("fuente"),
      tamano: datos.get("tamano"),
      acento: datos.get("acento"),
      ancho: Number(datos.get("ancho")) || 380,
      alto: Number(datos.get("alto")) || 150,
      unidades: datos.getAll("unidades")
    };
  }

  function construirUrl(v) {
    const params = new URLSearchParams();
    params.set("modo", v.modo);
    if (v.tema !== "auto") params.set("tema", v.tema);
    params.set("idioma", v.idioma);
    if (v.modo === "cronometro" && v.unidades.length) params.set("unidades", v.unidades.join(","));
    if (v.fuente !== "mono") params.set("fuente", v.fuente);
    if (v.tamano !== "m") params.set("tamano", v.tamano);
    if (v.acento.toLowerCase() !== "#1c6ba0") params.set("acento", v.acento);
    return base + "?" + params.toString();
  }

  function actualizar() {
    const v = valores();
    const url = construirUrl(v);

    grupoUnidades.disabled = v.modo === "mercado";
    valorAcento.textContent = v.acento.toUpperCase();

    if (vista.src !== url) vista.src = url;
    vista.style.width = v.ancho + "px";
    vista.style.height = v.alto + "px";

    salidaUrl.textContent = url;
    salidaIframe.textContent =
      '<iframe src="' + url + '" width="' + v.ancho + '" height="' + v.alto +
      '" style="border:0" title="' + window.CONFIG.marca + '" loading="lazy"></iframe>';
  }

  function conectarCopiado() {
    document.querySelectorAll("[data-copiar]").forEach(function (boton) {
      boton.addEventListener("click", async function () {
        const texto = document.querySelector(boton.dataset.copiar).textContent;
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

  function marcarControles() {
    const idioma = window.I18n.idioma();
    const tema = window.Tema.activo();
    document.querySelectorAll("[data-idioma]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.idioma === idioma));
    });
    document.querySelectorAll("[data-tema]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.tema === tema));
    });
  }

  function conectarControles() {
    document.querySelectorAll("[data-idioma]").forEach(function (boton) {
      boton.addEventListener("click", function () { window.I18n.aplicar(boton.dataset.idioma); });
    });
    document.querySelectorAll("[data-tema]").forEach(function (boton) {
      boton.addEventListener("click", function () { window.Tema.aplicar(boton.dataset.tema); });
    });
  }

  document.addEventListener("idioma:cambio", function () {
    window.I18n.pintar(document);
    marcarControles();
    actualizar();
  });
  document.addEventListener("tema:cambio", marcarControles);

  window.I18n.init();
  window.I18n.pintar(document);
  marcarControles();

  const idiomaInicial = form.querySelector('input[name="idioma"][value="' + window.I18n.idioma() + '"]');
  if (idiomaInicial) idiomaInicial.checked = true;

  form.addEventListener("input", actualizar);
  form.addEventListener("change", actualizar);
  conectarControles();
  conectarCopiado();
  actualizar();
})();
