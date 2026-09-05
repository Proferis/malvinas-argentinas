window.I18n = (function () {
  const CLAVE = "bm:idioma";

  const textos = {
    es: {
      "marca": "Prometeo",
      "marca.nombre": "Prometeo",
      "marca.bajada": "Bitácora de promesas",
      "nav.etiqueta": "Secciones del sitio",
      "nav.cronometro": "Cronómetro",
      "nav.probabilidad": "Probabilidad",
      "nav.mercado": "Participar",
      "nav.novedades": "Novedades",
      "nav.widget": "Widget",
      "saltar": "Ir al contenido",

      "banner.linea1": "Las Malvinas",
      "banner.linea2": "son argentinas",
      "banner.pie": "Recreación de la bandera que los jugadores de la Selección desplegaron tras vencer a Inglaterra en el Mundial 2026.",

      "cinta.etiqueta": "Últimas novedades oficiales",
      "cinta.vacia": "Sin novedades registradas todavía",

      "hero.eyebrow": "Registro en curso",
      "hero.kicker": "Tiempo sin recuperar las Islas Malvinas",
      "hero.desde": "desde el anuncio presidencial por cadena nacional",
      "hero.ancla": "3 de septiembre de 2026, 21:00 (hora de Argentina)",
      "hero.fuente": "Ver el anuncio oficial",
      "hero.resumen": "{dias} {udias} en total · {semanas} {usemanas} · {horas} {uhoras}",
      "hero.relojEtiqueta": "Horas, minutos y segundos transcurridos",

      "unidad.anios": "años",
      "unidad.anios.1": "año",
      "unidad.meses": "meses",
      "unidad.meses.1": "mes",
      "unidad.semanas": "semanas",
      "unidad.semanas.1": "semana",
      "unidad.dias": "días",
      "unidad.dias.1": "día",
      "unidad.horas": "horas",
      "unidad.horas.1": "hora",
      "unidad.minutos": "minutos",
      "unidad.minutos.1": "minuto",
      "unidad.segundos": "segundos",
      "unidad.segundos.1": "segundo",

      "prob.eyebrow": "Modelo abierto",
      "prob.titulo": "Probabilidad de que la promesa se cumpla",
      "prob.bajada": "Una curva diaria desde el anuncio, armada con dos insumos públicos: cómo vota la gente acá y qué hace el Estado. No es un pronóstico ni una medición: es una fórmula abierta, y abajo está entera.",
      "prob.hoy": "Hoy",
      "prob.nota": "Sube cuando el Estado actúa y cuando crece el voto por el «Sí»; baja sola con el paso de los días si no pasa nada.",
      "prob.hito": "día con acto oficial",
      "prob.rango": "{n} días registrados · desde el {desde}",
      "prob.rango.1": "Primer día registrado · {desde}",
      "prob.delta": "{signo}{n} puntos en {dias} días",
      "prob.deltaSinDatos": "Todavía no hay días suficientes para comparar.",
      "prob.verDatos": "Ver la fórmula y los datos",
      "prob.formulaIntro": "El número no se mide: se calcula. Estos son todos sus ingredientes, y los parámetros se editan en data/config.js.",
      "prob.formulaPie": "Cada novedad oficial empuja según su tipo —una ley pesa más que un comunicado— y se apaga a la mitad cada {semivida} días. El voto recién manda sobre el resultado cuando hay al menos {votos} votos; con menos, pesa a prorrata contra el {neutral}% neutral.",
      "prob.tablaTitulo": "Serie diaria de probabilidad",
      "prob.colFecha": "Fecha",
      "prob.colProb": "Probabilidad",
      "prob.colBase": "Voto",
      "prob.colImpulso": "Novedades",
      "prob.colVotos": "Votos",
      "prob.globoProb": "Probabilidad",
      "prob.globoDesglose": "voto {base}% + novedades {impulso} pts",
      "prob.globoVotos": "{n} votos ese día",
      "prob.globoSinVotos": "sin votos ese día",
      "prob.globoHito": "Hubo acto oficial",
      "prob.sinDatos": "Todavía no hay serie: la primera medición es del día del anuncio.",
      "prob.resumen": "Curva de probabilidad diaria desde el {desde} hasta el {hasta}. Valor actual: {valor} por ciento. Mínimo {min} por ciento, máximo {max} por ciento.",

      "mercado.eyebrow": "Participación ciudadana",
      "mercado.titulo": "Mercado de opinión",
      "mercado.bajada": "Una pregunta, dos respuestas, un voto por dispositivo. Tu voto entra en la curva de arriba: eso es lo que mantiene viva esta página.",
      "mercado.pregunta": "¿Creés que este gobierno recupera la soberanía de las Islas Malvinas antes de las elecciones presidenciales de 2027?",
      "mercado.si": "Sí",
      "mercado.no": "No",
      "mercado.votarSi": "Votar Sí",
      "mercado.votarNo": "Votar No",
      "mercado.votos": "{n} votos emitidos",
      "mercado.sinVotos": "Todavía no hay votos. El primero es tuyo.",
      "mercado.yaVotaste": "Ya votaste {opcion}.",
      "mercado.yaVotasteSinOpcion": "Desde esta conexión ya se votó.",
      "mercado.rechazado": "Desde esta conexión ya se había votado {opcion}: tu voto no se sumó. Es un voto por IP.",
      "mercado.cierre": "Cierre estimado: elecciones presidenciales de octubre de 2027 · faltan {dias} días",
      "mercado.cierreNota": "Fecha estimada, sujeta a convocatoria oficial.",
      "mercado.aviso": "Esto es una encuesta de opinión, no un mercado financiero: sin dinero, sin apuestas y sin premios.",
      "mercado.local": "modo local",
      "mercado.localAyuda": "No hay contador compartido configurado: los votos se guardan sólo en este navegador.",
      "mercado.grafico": "Resultado: {si}% Sí, {no}% No",

      "novedades.titulo": "Novedades oficiales",
      "novedades.bajada": "Leyes, normas y acciones del Estado vinculadas a la causa. Se actualiza cada 24 horas desde fuentes oficiales; enlazamos siempre al documento original.",
      "novedades.actualizado": "Actualizado",
      "novedades.fuente": "Ver fuente original",
      "novedades.vacio": "Todavía no hay novedades registradas.",
      "novedades.repasar": "Deslizá para repasar",
      "novedades.tira": "Novedades oficiales, lista horizontal",
      "novedades.anterior": "Novedad anterior",
      "novedades.siguiente": "Novedad siguiente",

      "widget.eyebrow": "Para embeber",
      "widget.titulo": "Widget para streamers y sitios",
      "widget.bajada": "El mismo motor sirve como fuente de navegador en OBS (con fondo transparente) y como iframe embebible en cualquier web. Se configura por parámetros en la URL: modo, tema, idioma, color y tamaño.",
      "widget.cta": "Abrir el editor de widget",
      "widget.obs": "Overlay para streaming",
      "widget.obsDetalle": "Agregalo en OBS como Fuente de navegador con tema transparente.",
      "widget.web": "Embebido en una web",
      "widget.webDetalle": "Pegá este código en cualquier sitio, sin instalar nada.",
      "widget.copiar": "Copiar",
      "widget.copiado": "Copiado",

      "pie.visitas": "visitas",
      "pie.aviso": "Sitio ciudadano independiente. No es un canal oficial del Estado argentino.",
      "pie.codigo": "Código abierto",

      "builder.titulo": "Editor de widget",
      "builder.bajada": "Armá tu versión, mirala en vivo y copiá el código. Nada de esto se guarda en ningún servidor: la configuración viaja en la propia URL.",
      "builder.modo": "Qué muestra",
      "builder.modo.cronometro": "Cronómetro",
      "builder.modo.mercado": "Resultado del mercado",
      "builder.tema": "Tema",
      "builder.tema.auto": "Automático",
      "builder.tema.claro": "Claro",
      "builder.tema.oscuro": "Oscuro",
      "builder.tema.transparente": "Transparente (OBS)",
      "builder.idioma": "Idioma del widget",
      "builder.unidades": "Unidades visibles",
      "builder.acento": "Color de acento",
      "builder.fuente": "Tipografía de las cifras",
      "builder.fuente.mono": "Monoespaciada",
      "builder.fuente.sans": "Sans",
      "builder.fuente.display": "Display",
      "builder.tamano": "Tamaño",
      "builder.tamano.s": "Chico",
      "builder.tamano.m": "Medio",
      "builder.tamano.l": "Grande",
      "builder.medidas": "Medidas del iframe",
      "builder.ancho": "Ancho",
      "builder.alto": "Alto",
      "builder.vista": "Vista previa",
      "builder.urlObs": "URL para OBS (Fuente de navegador)",
      "builder.snippet": "Código para tu web",
      "builder.volver": "Volver al sitio",

      "control.idioma": "Cambiar idioma",
      "control.tema": "Cambiar entre modo día y noche",
      "control.dia": "Día",
      "control.noche": "Noche",
      "control.tipografia": "Cambiar la tipografía de la página",
      "control.tipoOriginal": "Aa",
      "control.tipoBandera": "Trapo"
    },

    en: {
      "marca": "Prometeo",
      "marca.nombre": "Prometeo",
      "marca.bajada": "A ledger of promises",
      "nav.etiqueta": "Site sections",
      "nav.cronometro": "Counter",
      "nav.probabilidad": "Probability",
      "nav.mercado": "Take part",
      "nav.novedades": "Updates",
      "nav.widget": "Widget",
      "saltar": "Skip to content",

      "banner.linea1": "Las Malvinas",
      "banner.linea2": "son argentinas",
      "banner.pie": "A recreation of the banner Argentina's players unfurled after beating England at the 2026 World Cup.",

      "cinta.etiqueta": "Latest official updates",
      "cinta.vacia": "No updates recorded yet",

      "hero.eyebrow": "Running record",
      "hero.kicker": "Time without recovering the Malvinas Islands",
      "hero.desde": "since the presidential address on national television",
      "hero.ancla": "3 September 2026, 21:00 (Argentina time)",
      "hero.fuente": "See the official announcement",
      "hero.resumen": "{dias} {udias} in total · {semanas} {usemanas} · {horas} {uhoras}",
      "hero.relojEtiqueta": "Hours, minutes and seconds elapsed",

      "unidad.anios": "years",
      "unidad.anios.1": "year",
      "unidad.meses": "months",
      "unidad.meses.1": "month",
      "unidad.semanas": "weeks",
      "unidad.semanas.1": "week",
      "unidad.dias": "days",
      "unidad.dias.1": "day",
      "unidad.horas": "hours",
      "unidad.horas.1": "hour",
      "unidad.minutos": "minutes",
      "unidad.minutos.1": "minute",
      "unidad.segundos": "seconds",
      "unidad.segundos.1": "second",

      "prob.eyebrow": "Open model",
      "prob.titulo": "Probability the promise is kept",
      "prob.bajada": "A daily curve since the announcement, built from two public inputs: how people vote here and what the state does. It is neither a forecast nor a measurement — it is an open formula, and the whole of it is below.",
      "prob.hoy": "Today",
      "prob.nota": "It rises when the state acts and when the «Yes» vote grows; it falls on its own as the days pass and nothing happens.",
      "prob.hito": "day with an official act",
      "prob.rango": "{n} days recorded · since {desde}",
      "prob.rango.1": "First day recorded · {desde}",
      "prob.delta": "{signo}{n} points in {dias} days",
      "prob.deltaSinDatos": "Not enough days yet to compare.",
      "prob.verDatos": "See the formula and the data",
      "prob.formulaIntro": "The number is not measured: it is computed. These are all of its ingredients, and the parameters live in data/config.js.",
      "prob.formulaPie": "Each official update pushes according to its type — a law weighs more than a press release — and halves every {semivida} days. The vote only drives the result once there are at least {votos} votes; below that it counts pro rata against the neutral {neutral}%.",
      "prob.tablaTitulo": "Daily probability series",
      "prob.colFecha": "Date",
      "prob.colProb": "Probability",
      "prob.colBase": "Vote",
      "prob.colImpulso": "Updates",
      "prob.colVotos": "Votes",
      "prob.globoProb": "Probability",
      "prob.globoDesglose": "vote {base}% + updates {impulso} pts",
      "prob.globoVotos": "{n} votes that day",
      "prob.globoSinVotos": "no votes that day",
      "prob.globoHito": "There was an official act",
      "prob.sinDatos": "No series yet: the first reading is from the day of the announcement.",
      "prob.resumen": "Daily probability curve from {desde} to {hasta}. Current value: {valor} per cent. Minimum {min} per cent, maximum {max} per cent.",

      "mercado.eyebrow": "Citizen participation",
      "mercado.titulo": "Opinion market",
      "mercado.bajada": "One question, two answers, one vote per device. Your vote feeds the curve above — that is what keeps this page alive.",
      "mercado.pregunta": "Do you think this government will recover sovereignty over the Malvinas Islands before the 2027 presidential election?",
      "mercado.si": "Yes",
      "mercado.no": "No",
      "mercado.votarSi": "Vote Yes",
      "mercado.votarNo": "Vote No",
      "mercado.votos": "{n} votes cast",
      "mercado.sinVotos": "No votes yet. Yours would be the first.",
      "mercado.yaVotaste": "You already voted {opcion}.",
      "mercado.yaVotasteSinOpcion": "A vote has already been cast from this connection.",
      "mercado.rechazado": "This connection had already voted {opcion}, so your vote was not counted. One vote per IP.",
      "mercado.cierre": "Estimated close: presidential election of October 2027 · {dias} days to go",
      "mercado.cierreNota": "Estimated date, subject to official scheduling.",
      "mercado.aviso": "This is an opinion poll, not a financial market: no money, no betting, no prizes.",
      "mercado.local": "local mode",
      "mercado.localAyuda": "No shared counter configured: votes are stored in this browser only.",
      "mercado.grafico": "Result: {si}% Yes, {no}% No",

      "novedades.titulo": "Official updates",
      "novedades.bajada": "Laws, regulations and state actions tied to the claim. Updated every 24 hours from official sources; we always link to the original document.",
      "novedades.actualizado": "Updated",
      "novedades.fuente": "See original source",
      "novedades.vacio": "No updates recorded yet.",
      "novedades.repasar": "Swipe to browse",
      "novedades.tira": "Official updates, horizontal list",
      "novedades.anterior": "Previous update",
      "novedades.siguiente": "Next update",

      "widget.eyebrow": "Embeddable",
      "widget.titulo": "Widget for streamers and websites",
      "widget.bajada": "One engine works as an OBS browser source (with a transparent background) and as an embeddable iframe on any site. It is configured through URL parameters: mode, theme, language, colour and size.",
      "widget.cta": "Open the widget editor",
      "widget.obs": "Streaming overlay",
      "widget.obsDetalle": "Add it in OBS as a Browser Source with the transparent theme.",
      "widget.web": "Embedded on a website",
      "widget.webDetalle": "Paste this code on any site — nothing to install.",
      "widget.copiar": "Copy",
      "widget.copiado": "Copied",

      "pie.visitas": "visits",
      "pie.aviso": "Independent citizen site. Not an official channel of the Argentine state.",
      "pie.codigo": "Open source",

      "builder.titulo": "Widget editor",
      "builder.bajada": "Build your version, watch it live and copy the code. None of this is stored on a server: the configuration travels in the URL itself.",
      "builder.modo": "What it shows",
      "builder.modo.cronometro": "Counter",
      "builder.modo.mercado": "Market result",
      "builder.tema": "Theme",
      "builder.tema.auto": "Automatic",
      "builder.tema.claro": "Light",
      "builder.tema.oscuro": "Dark",
      "builder.tema.transparente": "Transparent (OBS)",
      "builder.idioma": "Widget language",
      "builder.unidades": "Visible units",
      "builder.acento": "Accent colour",
      "builder.fuente": "Number typeface",
      "builder.fuente.mono": "Monospaced",
      "builder.fuente.sans": "Sans",
      "builder.fuente.display": "Display",
      "builder.tamano": "Size",
      "builder.tamano.s": "Small",
      "builder.tamano.m": "Medium",
      "builder.tamano.l": "Large",
      "builder.medidas": "Iframe size",
      "builder.ancho": "Width",
      "builder.alto": "Height",
      "builder.vista": "Preview",
      "builder.urlObs": "URL for OBS (Browser Source)",
      "builder.snippet": "Code for your site",
      "builder.volver": "Back to the site",

      "control.idioma": "Change language",
      "control.tema": "Switch between day and night mode",
      "control.dia": "Day",
      "control.noche": "Night",
      "control.tipografia": "Change the page typeface",
      "control.tipoOriginal": "Aa",
      "control.tipoBandera": "Banner"
    }
  };

  let actual = "es";

  function detectar() {
    let previo = null;
    try { previo = localStorage.getItem(CLAVE); } catch (e) { /* modo privado */ }
    if (previo && textos[previo]) return previo;
    const nav = (navigator.language || "es").toLowerCase();
    return nav.startsWith("en") ? "en" : "es";
  }

  function t(clave, params) {
    let texto = textos[actual][clave];
    if (texto === undefined) texto = textos.es[clave];
    if (texto === undefined) return clave;
    if (params) {
      Object.keys(params).forEach(function (k) {
        texto = texto.replace(new RegExp("\\{" + k + "\\}", "g"), params[k]);
      });
    }
    return texto;
  }

  function unidad(nombre, cantidad) {
    return cantidad === 1 ? t("unidad." + nombre + ".1") : t("unidad." + nombre);
  }

  function pintar(raiz) {
    (raiz || document).querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    (raiz || document).querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.dataset.i18nAttr.split(";").forEach(function (par) {
        const partes = par.split(":");
        if (partes.length === 2) el.setAttribute(partes[0].trim(), t(partes[1].trim()));
      });
    });
  }

  function aplicar(idioma) {
    if (!textos[idioma]) return;
    actual = idioma;
    document.documentElement.lang = idioma;
    try { localStorage.setItem(CLAVE, idioma); } catch (e) { /* modo privado */ }
    pintar(document);
    document.dispatchEvent(new CustomEvent("idioma:cambio", { detail: { idioma: idioma } }));
  }

  function init(forzado) {
    actual = forzado && textos[forzado] ? forzado : detectar();
    document.documentElement.lang = actual;
    return actual;
  }

  return {
    init: init,
    aplicar: aplicar,
    pintar: pintar,
    t: t,
    unidad: unidad,
    idioma: function () { return actual; },
    alternar: function () { aplicar(actual === "es" ? "en" : "es"); }
  };
})();
