window.Novedades = (function () {
  function fecha(iso, idioma) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    // los hechos son actos del Estado argentino: se fechan en hora de Argentina,
    // no en la zona horaria de quien mira
    return new Intl.DateTimeFormat(idioma === "en" ? "en-GB" : "es-AR", {
      day: "numeric", month: "long", year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires"
    }).format(d);
  }

  /**
   * Una novedad como tarjeta vertical: la fecha y el tipo arriba, el título y el
   * copete en el medio, y la fuente al pie, empujada abajo del todo para que
   * todas las tarjetas de la tira terminen a la misma altura.
   */
  function item(novedad, idioma) {
    const li = document.createElement("li");
    li.className = "novedad";

    const meta = document.createElement("div");
    meta.className = "novedad-meta";

    const tiempo = document.createElement("time");
    tiempo.dateTime = novedad.fecha;
    tiempo.textContent = fecha(novedad.fecha, idioma);
    meta.appendChild(tiempo);

    if (novedad.tipo) {
      const tipo = document.createElement("span");
      tipo.className = "chip";
      tipo.textContent = novedad.tipo;
      meta.appendChild(tipo);
    }

    const titulo = document.createElement("h3");
    titulo.className = "novedad-titulo";
    titulo.textContent = novedad.titulo;

    li.appendChild(meta);
    li.appendChild(titulo);

    if (novedad.resumen) {
      const p = document.createElement("p");
      p.className = "novedad-resumen";
      p.textContent = novedad.resumen;
      li.appendChild(p);
    }

    const pie = document.createElement("div");
    pie.className = "novedad-pie";

    const fuente = document.createElement("span");
    fuente.className = "novedad-fuente";
    fuente.textContent = novedad.fuente;
    pie.appendChild(fuente);

    if (novedad.url) {
      const enlace = document.createElement("a");
      enlace.href = novedad.url;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.className = "enlace-fuente";
      enlace.textContent = window.I18n.t("novedades.fuente");
      pie.appendChild(enlace);
    }

    li.appendChild(pie);
    return li;
  }

  function pintar(contenedor, selloActualizado) {
    const datos = window.NOVEDADES || { items: [] };
    const idioma = window.I18n.idioma();
    contenedor.textContent = "";

    if (!datos.items.length) {
      const vacio = document.createElement("li");
      vacio.className = "vacio";
      vacio.textContent = window.I18n.t("novedades.vacio");
      contenedor.appendChild(vacio);
      return 0;
    }

    const ordenadas = datos.items.slice().sort(function (a, b) {
      return new Date(b.fecha) - new Date(a.fecha);
    });
    ordenadas.forEach(function (n) { contenedor.appendChild(item(n, idioma)); });

    if (selloActualizado && datos.actualizado) {
      selloActualizado.textContent =
        window.I18n.t("novedades.actualizado") + " " + fecha(datos.actualizado, idioma);
    }

    return ordenadas.length;
  }

  return { pintar: pintar };
})();
