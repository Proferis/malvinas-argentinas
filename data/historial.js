/**
 * Un punto por día desde el anuncio. Sólo guarda lo que no se puede recalcular
 * —el recuento de votos que había ese día—; la probabilidad la deriva
 * assets/js/modelo.js a partir de esto y de data/novedades.js.
 *
 * Lo reescribe scripts/scrape.mjs una vez por día. No hay datos anteriores al
 * 3 de septiembre de 2026: antes del anuncio no había nada que medir.
 */
window.HISTORIAL = {
  "desde": "2026-09-03",
  "actualizado": "2026-09-16T14:11:45.172Z",
  "puntos": [
    {
      "fecha": "2026-09-05",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-06",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-07",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-08",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-09",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-10",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-11",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-12",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-13",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-14",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-15",
      "votosSi": 0,
      "votosNo": 0
    },
    {
      "fecha": "2026-09-16",
      "votosSi": 0,
      "votosNo": 0
    }
  ]
};
