window.CONFIG = {
  marca: "Prometeo",
  bajadaMarca: "Bitácora de promesas",

  ancla: "2026-09-03T21:00:00-03:00",
  anclaFuente: {
    titulo: "Cadena Nacional del Presidente Javier Milei sobre la Causa Malvinas",
    url: "https://www.argentina.gob.ar/noticias/cadena-nacional-del-presidente-javier-milei-sobre-la-causa-malvinas"
  },

  eleccion: {
    fecha: "2027-10-24T08:00:00-03:00",
    estimada: true
  },

  contador: {
    endpoint: "",
    claves: { visitas: "visitas", si: "voto_si", no: "voto_no" }
  },

  /**
   * Modelo de la curva de probabilidad. Está acá, a la vista y editable, porque
   * el número que muestra el gráfico no es una medición: es el resultado de esta
   * fórmula y de nada más.
   *
   *   probabilidad = base + impulso, recortada a [piso, techo]
   *
   *   base    = % de votos "Sí" del día. Sin votos, `neutral`.
   *   impulso = suma de las novedades oficiales, cada una con el peso de su tipo,
   *             decayendo a la mitad cada `semividaDias`. Una novedad empuja
   *             fuerte el día que sale y se va apagando si no pasa nada más.
   */
  modelo: {
    neutral: 50,
    piso: 2,
    techo: 98,
    semividaDias: 45,
    topeImpulso: 20,
    // el voto pesa lo que pesa: cuántos votos hacen falta para que la base
    // deje de ser el 50% neutral y pase a mandar el resultado real
    votosParaConfiar: 200,
    pesos: {
      "Anuncio presidencial": 9,
      "Ley": 10,
      "Decreto": 6,
      "Normativa": 4,
      "Resolución": 3,
      "Acuerdo": 5,
      "Comunicado": 2,
      "Protesta": 1.5,
      "_otros": 1.5
    }
  },

  repo: "https://github.com/Proferis/malvinas-argentinas",
  baseWidget: "widget.html"
};
