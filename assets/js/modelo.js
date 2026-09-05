/**
 * Modelo de la curva de probabilidad.
 *
 * Corre igual en el navegador (lo carga index.html y pinta el gráfico en vivo)
 * y en Node (lo carga scripts/scrape.mjs y escribe el punto del día). Por eso
 * se cuelga de globalThis y no toca ni el DOM ni window.CONFIG: recibe la
 * configuración por parámetro.
 *
 * La probabilidad NO es una medición ni un pronóstico: es la fórmula de
 * CONFIG.modelo aplicada a dos insumos públicos —los votos y las novedades
 * oficiales— y nada más. Los parámetros están en data/config.js a la vista.
 */
(function (raiz) {
  const DIA = 86400000;

  /**
   * Día calendario en hora argentina: los hechos son actos del Estado y se
   * fechan acá, no en la zona de quien mira. Un "2026-09-03" pelado ya es un
   * día calendario y se devuelve tal cual —pasarlo por Date lo leería como
   * medianoche UTC, que en Argentina todavía es el día anterior.
   */
  function diaAR(fecha) {
    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires"
    }).format(new Date(fecha));
  }

  /** Mediodía UTC del día dado: evita que el corte caiga sobre un cambio de día. */
  function comoFecha(dia) {
    return new Date(dia + "T12:00:00Z");
  }

  function peso(tipo, pesos) {
    if (tipo && Object.prototype.hasOwnProperty.call(pesos, tipo)) return pesos[tipo];
    return pesos._otros;
  }

  /**
   * Empuje acumulado de las novedades publicadas hasta `hasta`.
   * Cada una entra con el peso de su tipo y se apaga a la mitad cada
   * `semividaDias`, así que la curva baja sola cuando el Estado deja de actuar.
   */
  function impulso(novedades, hasta, modelo) {
    const corte = comoFecha(diaAR(hasta)).getTime();
    let suma = 0;

    for (const n of novedades) {
      const cuando = comoFecha(diaAR(n.fecha)).getTime();
      if (cuando > corte) continue;                       // todavía no pasó
      const dias = (corte - cuando) / DIA;
      suma += peso(n.tipo, modelo.pesos) * Math.pow(0.5, dias / modelo.semividaDias);
    }
    return Math.min(suma, modelo.topeImpulso);
  }

  /**
   * Base del voto. Con pocos votos el porcentaje crudo es ruido, así que se lo
   * mezcla con el neutral en proporción a cuántos votos hay: recién con
   * `votosParaConfiar` la base es el resultado real de la votación.
   */
  function base(votosSi, votosNo, modelo) {
    const total = votosSi + votosNo;
    if (total <= 0) return modelo.neutral;
    const crudo = (votosSi / total) * 100;
    const confianza = Math.min(1, total / modelo.votosParaConfiar);
    return modelo.neutral + (crudo - modelo.neutral) * confianza;
  }

  /** Probabilidad de un día, con el desglose para poder mostrarlo. */
  function probabilidad(opciones) {
    const modelo = opciones.modelo;
    const b = base(opciones.votosSi || 0, opciones.votosNo || 0, modelo);
    const i = impulso(opciones.novedades || [], opciones.fecha, modelo);
    const valor = Math.max(modelo.piso, Math.min(modelo.techo, b + i));
    return {
      valor: Number(valor.toFixed(1)),
      base: Number(b.toFixed(1)),
      impulso: Number(i.toFixed(1))
    };
  }

  /**
   * Serie diaria desde el ancla hasta hoy. Los días sin punto guardado se
   * calculan con las novedades que ya existían ese día; los días con punto
   * guardado usan los votos reales que había en ese momento.
   */
  function serie(opciones) {
    const guardados = new Map((opciones.puntos || []).map((p) => [p.fecha, p]));
    const desde = comoFecha(diaAR(opciones.ancla));
    const hasta = comoFecha(diaAR(opciones.hasta || new Date()));
    const salida = [];

    for (let t = desde.getTime(); t <= hasta.getTime(); t += DIA) {
      const dia = new Date(t).toISOString().slice(0, 10);
      const guardado = guardados.get(dia);
      const calculo = probabilidad({
        fecha: dia,
        votosSi: guardado ? guardado.votosSi : 0,
        votosNo: guardado ? guardado.votosNo : 0,
        novedades: opciones.novedades,
        modelo: opciones.modelo
      });
      salida.push({
        fecha: dia,
        prob: calculo.valor,
        base: calculo.base,
        impulso: calculo.impulso,
        votos: guardado ? guardado.votosSi + guardado.votosNo : 0,
        // el día en que efectivamente hubo un acto oficial se marca en el gráfico
        hito: (opciones.novedades || []).some((n) => diaAR(n.fecha) === dia)
      });
    }
    return salida;
  }

  raiz.Modelo = { probabilidad: probabilidad, serie: serie, diaAR: diaAR, base: base, impulso: impulso };
})(typeof globalThis !== "undefined" ? globalThis : this);
