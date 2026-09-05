# Prometeo

Bitácora de promesas políticas. Registra qué se prometió, cuánto hace de eso y
qué pasó desde entonces.

Por ahora sigue una sola promesa: **la recuperación de las Islas Malvinas**,
anunciada por cadena nacional el 3 de septiembre de 2026. La estructura ya está
pensada para sostener varias —cada promesa es una fecha ancla, un conjunto de
fuentes oficiales y una pregunta—, pero hoy hay una y el sitio no finge lo
contrario.

Es HTML, CSS y JavaScript vainilla: sin frameworks, sin paso de compilación y
sin base de datos. Lo que ves en el repo es exactamente lo que se publica.

El sitio:

- **cuenta el tiempo** transcurrido desde el anuncio, en años, meses, semanas,
  días, horas, minutos y segundos;
- dibuja una **curva diaria de probabilidad** de que la promesa se cumpla, al
  estilo de un mercado de predicción, con la fórmula entera a la vista;
- abre un **mercado de opinión** sí/no que alimenta esa curva;
- **agrega novedades oficiales**, recolectadas una vez por día desde fuentes del
  Estado, y las pasa en una cinta arriba de todo;
- lleva un **contador de visitas**;
- ofrece un **widget embebible** que sirve como overlay de OBS y como iframe;
- tiene **modo día y noche** y un **conmutador de tipografía**, y es responsive.

No es un canal oficial del Estado argentino.

## Estructura

```
index.html              portada: cronómetro, probabilidad, mercado, novedades, widget
widget.html             widget parametrizable por query string
widget-builder.html     editor visual que arma la URL y el código para copiar
assets/css/             base.css (tokens y átomos) · site.css · widget.css · builder.css
assets/js/              i18n · theme · tipografia · tiempo · contador · mercado ·
                        novedades · modelo · grafico · animaciones · main · widget · builder
assets/img/             islas.svg (silueta del archipiélago) · sol.svg (Sol de Mayo)
data/config.js          fecha ancla, fecha de elección, endpoint del contador, modelo
data/novedades.js       novedades recolectadas (lo reescribe el scraper)
data/historial.js       un punto de votos por día (lo reescribe el scraper)
scripts/scrape.mjs      recolector de fuentes oficiales + registro del punto diario
scripts/graficos.mjs    generador de los SVG de marca
worker/                 contador propio en Cloudflare Workers + KV, con su prueba
.github/workflows/      cron diario que corre el scraper y commitea los cambios
```

## Correrlo local

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Publicar

Cualquier hosting estático sirve. Con GitHub Pages: *Settings → Pages → Deploy
from a branch → main / root*.

## La curva de probabilidad

Es lo único del sitio que no se limita a mostrar un dato: lo calcula. Por eso la
fórmula está publicada en la propia página, sus parámetros viven en
[`data/config.js`](data/config.js) y el código que la aplica es
[`assets/js/modelo.js`](assets/js/modelo.js), un solo archivo que corre igual en
el navegador y en Node.

```
probabilidad = base + impulso, recortada a [2, 98]

base    = 50 + (%sí − 50) × min(1, votos / 200)
impulso = Σ peso(tipo) × 0.5 ^ (días / 45), tope 20 pts
```

Dos decisiones que conviene entender antes de tocar los números:

- **La base no es el porcentaje crudo de votos.** Con cinco votos, un 80% de
  "Sí" es ruido, no una señal. La base arranca en el 50% neutral y se va
  corriendo hacia el resultado real a medida que hay votos, hasta mandar del
  todo a partir de `votosParaConfiar`.
- **El impulso se apaga solo.** Cada novedad oficial empuja según su tipo —una
  ley pesa 10, un comunicado 2— y cae a la mitad cada 45 días. Es lo que hace
  que la curva baje cuando el Estado deja de actuar, en vez de quedar clavada
  arriba para siempre.

No es un pronóstico ni una medición de nada. Es esta fórmula aplicada a dos
insumos públicos, y el sitio lo dice en voz alta donde se lee el número.

`data/historial.js` guarda **sólo el recuento de votos de cada día**, que es lo
único que no se puede reconstruir después. La probabilidad se deriva en cada
carga, así que cambiar un peso en `config.js` recalcula toda la serie en lugar
de dejar puntos viejos calculados con una fórmula vieja.

La serie empieza el 3 de septiembre de 2026. No hay datos anteriores al anuncio:
antes no había promesa que seguir.

## El contador (sin API de terceros)

Sin configurar nada, el sitio funciona en **modo local**: las visitas y los votos
se guardan en el navegador de cada persona y la interfaz lo aclara con la
etiqueta `modo local`, para no mostrar un número privado como si fuera público.

Para tener números compartidos hay que desplegar el Worker propio incluido en
[`worker/`](worker/):

```bash
cd worker
npx wrangler kv namespace create CONTADOR   # pegá el id en wrangler.toml
npx wrangler secret put SAL                 # sal para hashear IPs
npx wrangler deploy
```

Después, en `data/config.js`:

```js
contador: { endpoint: "https://prometeo-contador.TU-CUENTA.workers.dev", ... }
```

### Un voto por IP

El tope lo aplica el servidor, no el navegador, y lo informa en cada respuesta:

```
GET  /leer?claves=voto_si,voto_no  -> { voto_si, voto_no, tuVoto: "si"|"no"|null }
POST /sumar {"clave":"voto_si"}    -> { voto_si, aceptado: true|false, tuVoto }
```

Eso cambia dos cosas respecto de guardar el voto sólo en el navegador:

- **Borrar el almacenamiento no habilita a votar otra vez.** La marca vive en KV,
  con la opción elegida y 400 días de vida, indexada por un hash con sal de la
  IP —la IP nunca se guarda en claro.
- **La interfaz no puede mentir.** Si el Worker rechaza el voto porque esa IP ya
  votó, responde `aceptado: false` y la página lo dice, en vez de simular que el
  voto entró.

El Worker guarda además una visita por IP y día. KV no es transaccional: dos
incrementos simultáneos pueden pisarse. Para un termómetro de opinión alcanza; si
hiciera falta exactitud, el reemplazo natural es un Durable Object con el mismo
contrato de rutas. Y el tope por IP tiene los límites de siempre: una oficina
entera comparte IP y cuenta como un voto, y un teléfono que cambia de red cuenta
como dos.

Las reglas se verifican sin desplegar nada, con KV reemplazado por un Map:

```bash
node worker/prueba.mjs
```

Mientras no haya endpoint configurado, el sitio corre en modo local y el punto
diario del historial se registra con cero votos: la curva se mueve sólo por las
novedades hasta que el Worker esté arriba.

## Las novedades

`scripts/scrape.mjs` recorre fuentes oficiales, filtra por palabras clave
(`malvinas`, `atlántico sur`, `georgias del sur`, `sándwich del sur`) y reescribe
`data/novedades.js`. Guarda sólo metadatos —título, fecha, copete y enlace al
original—, nunca el texto completo.

Fuentes implementadas y verificadas:

| Fuente | Qué trae |
|---|---|
| Cancillería Argentina | Comunicados y protestas diplomáticas |
| Boletín Oficial (Primera Sección) | Normativa publicada ese día |

Para agregar una fuente, sumá una función al arreglo `FUENTES` que devuelva
objetos `{fecha, titulo, resumen, tipo, fuente, url, origen}`. El `tipo` es el
que después pesa en la curva, así que conviene que coincida con alguna clave de
`CONFIG.modelo.pesos`; si no coincide con ninguna, cae en `_otros`.

Si una fuente falla, el resto sigue funcionando, y el registro del punto diario
es independiente del scraping: que se caiga Cancillería no deja un agujero en la
serie.

```bash
node scripts/scrape.mjs   # a mano
```

El workflow [`novedades.yml`](.github/workflows/novedades.yml) lo corre todos los
días a las 06:17 ART y commitea sólo si hubo cambios reales.

En la portada las novedades van en una sola caja y se repasan deslizando en
horizontal. La tira es un contenedor con scroll común, así que funciona con el
dedo, con la rueda y con Tab: los botones de flecha son un atajo, no el único
camino, y desaparecen cuando entran todas las tarjetas sin scrollear. Los títulos
largos se recortan a cuatro líneas para que las tarjetas midan parecido; el texto
completo está a un clic, en la fuente original.

## La marca

- **El logo** es la silueta del archipiélago, con las costas trazadas a partir de
  longitudes y latitudes reales.
- **La bandera** de la portada se arma por capas en CSS: las franjas son un
  degradado, el Sol de Mayo es un SVG centrado y el texto es HTML encima. Se hace
  así, y no con una sola imagen, para que las franjas queden siempre en tercios
  exactos y el sol siempre redondo, sea cual sea la proporción del recuadro.
- **No se usa la fotografía del trapo original.** Es una recreación: recrea el
  lenguaje tipográfico de la bandera que los jugadores desplegaron en el Mundial
  2026, no el objeto ni la foto.

Los SVG se regeneran con:

```bash
node scripts/graficos.mjs
```

## Los dos conmutadores

**Día / Noche** cambia el tema. La paleta parte de la bandera: el celeste manda
y el oro del Sol de Mayo hace de contrapunto, sobre la base de papel del sitio.
Los pasos de `--si` y `--no` están elegidos para pasar contraste y separación
bajo daltonismo contra su superficie; si se tocan, hay que revalidarlos.

**Aa / Trapo** cambia la tipografía de toda la página a la letra pintada del
trapo. Es opt-in y nunca se activa sola: por defecto rige el sistema tipográfico
del sitio (Archivo + Chivo Mono).

El sitio se publica en español. El motor de traducción sigue vivo —las cadenas
en inglés están completas en `assets/js/i18n.js`— porque el widget se configura
con `?idioma=en`, pero la portada ya no trae conmutador de idioma: ese lugar en
la interfaz es ahora el de la tipografía.

## El widget

Un solo archivo, `widget.html`, configurado por query string:

| Parámetro | Valores | Por defecto |
|---|---|---|
| `modo` | `cronometro`, `mercado` | `cronometro` |
| `tema` | `auto`, `claro`, `oscuro`, `transparente` | `auto` |
| `idioma` | `es`, `en` | idioma del navegador |
| `unidades` | lista separada por comas: `anios,meses,semanas,dias,horas,minutos,segundos` | `anios,meses,semanas,dias` |
| `acento` | color hexadecimal | `#1C6BA0` |
| `fuente` | `mono`, `sans`, `display` | `mono` |
| `tamano` | `s`, `m`, `l` | `m` |

**OBS / Twitch:** agregá una *Fuente de navegador* con `?tema=transparente`.

**Cualquier web:**

```html
<iframe src="https://tu-sitio.ar/widget.html?tema=claro" width="380" height="150" style="border:0"></iframe>
```

`widget-builder.html` arma todo esto con clicks y muestra la vista previa en vivo.

## Movimiento

Las animaciones —aparición al scrollear, conteo de las cifras, cinta de
novedades, barra de progreso— viven en `assets/js/animaciones.js` y en las
`@keyframes` de `base.css`.

Las cuatro cifras del cronómetro cuentan desde cero **cuando entran en pantalla**,
no cuando carga la página: en un teléfono los bloques quedan debajo de la bandera,
así que arrancarlas al cargar significaba que la animación pasara entera fuera de
la vista. Después del conteo de entrada, cada cifra vuelve a entrar desde abajo
cada vez que cambia de valor, que es lo que hace visible el paso de un día al
siguiente. Todas se apagan enteras con
`prefers-reduced-motion: reduce`: ahí las cifras aparecen ya en su valor final y
la cinta queda quieta y se puede scrollear a mano. Ninguna función del sitio
depende de que la animación corra.

## Límites conocidos

- **Un voto por IP** con el Worker desplegado; sin él, un voto por navegador y la
  interfaz lo aclara con la etiqueta `modo local`. En los dos casos es un
  termómetro simbólico, no una encuesta con validez estadística.
- El mercado de opinión **no involucra dinero, apuestas ni premios**: encuadrarlo
  como apuesta lo metería bajo la regulación de juegos de azar.
- **La curva no predice nada.** Es una fórmula publicada sobre dos insumos
  públicos. Cambiar los pesos cambia la curva, y eso es a propósito: la
  discusión sobre cuánto pesa cada cosa es parte del asunto, no un detalle de
  implementación escondido.
- **Una sola promesa por ahora.** `assets/js/modelo.js` ya es genérico —recibe
  ancla, novedades y pesos por parámetro—, pero `data/config.js`, el filtro por
  palabras clave del scraper, `data/historial.js` e `index.html` asumen que hay
  una. Sostener varias pide convertir esas cuatro cosas en una lista y agregar
  una portada que las enumere.
