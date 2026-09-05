window.Tiempo = (function () {
  function transcurrido(ancla, ahora) {
    ahora = ahora || new Date();

    let anios = ahora.getFullYear() - ancla.getFullYear();
    let meses = ahora.getMonth() - ancla.getMonth();
    let dias = ahora.getDate() - ancla.getDate();
    let horas = ahora.getHours() - ancla.getHours();
    let minutos = ahora.getMinutes() - ancla.getMinutes();
    let segundos = ahora.getSeconds() - ancla.getSeconds();

    if (segundos < 0) { segundos += 60; minutos--; }
    if (minutos < 0) { minutos += 60; horas--; }
    if (horas < 0) { horas += 24; dias--; }
    if (dias < 0) {
      const mesPrevio = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
      dias += mesPrevio.getDate();
      meses--;
    }
    if (meses < 0) { meses += 12; anios--; }

    const totalMs = ahora - ancla;
    const totalDias = Math.floor(totalMs / 86400000);

    return {
      anios: anios,
      meses: meses,
      // días sueltos una vez descontados años y meses; las semanas se calculan
      // sobre ese resto para que las cuatro unidades sumen el período exacto
      semanas: Math.floor(dias / 7),
      dias: dias % 7,
      diasDelMes: dias,
      horas: horas,
      minutos: minutos,
      segundos: segundos,
      totalDias: totalDias,
      totalSemanas: Math.floor(totalDias / 7),
      totalHoras: Math.floor(totalMs / 3600000),
      totalSegundos: Math.floor(totalMs / 1000)
    };
  }

  function dosDigitos(n) {
    return String(n).padStart(2, "0");
  }

  function miles(n, idioma) {
    return new Intl.NumberFormat(idioma === "en" ? "en-US" : "es-AR").format(n);
  }

  function diasHasta(fecha, ahora) {
    const ms = fecha - (ahora || new Date());
    return Math.max(0, Math.ceil(ms / 86400000));
  }

  return {
    transcurrido: transcurrido,
    dosDigitos: dosDigitos,
    miles: miles,
    diasHasta: diasHasta
  };
})();
