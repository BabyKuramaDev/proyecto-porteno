# ROADMAP: juego tipo GTA en Buenos Aires sobre slop-newyork

Nombre provisorio: **"Proyecto Porteño"**. El nombre final está pendiente (sección 4) y no puede incluir "GTA" ni "Grand Theft". Base: fork de [mrdoob/slop-newyork](https://github.com/mrdoob/slop-newyork) (MIT). Dueño: Jero. Implementa: Claude Code, fase por fase.

## 0. Para Claude Code: cómo usar este documento

- Antes de tocar código, leé completos este archivo y `CLAUDE.md`.
- Trabajá una fase por vez y en orden. Cada fase tiene objetivo, alcance y criterios de aceptación. Para pasar a la siguiente hacen falta dos cosas: que se cumplan los criterios y el OK de Jero.
- Empezá cada fase en plan mode. Investigá el código relevante, proponé un plan con los archivos a tocar, el enfoque y los riesgos, y esperá la aprobación.
- Abrí una rama por fase (`fase-N-nombre`), hacé commits chicos y cerrá con un PR.
- Al cerrar una fase, tildá los checkboxes y anotá en el Registro de decisiones (sección 9) lo que se haya decidido en el camino.
- Si aparece algo que este documento no cubre y la decisión cambia lo que el jugador ve o juega, preguntale a Jero. Si es un detalle técnico interno, decidí vos y dejalo anotado.
- Las referencias a archivos y módulos son orientativas, armadas con una lectura superficial del repo. Confirmalas en el código antes de basarte en ellas.

## 1. Visión

Un juego de mundo abierto con la jugabilidad de los GTA clásicos (III, Vice City, San Andreas): robar autos, escapar de la policía con estrellas de búsqueda, hacer misiones con marcadores y escuchar la radio mientras manejás. Transcurre en Buenos Aires (Microcentro, San Telmo y Puerto Madero) y se construye sobre el motor de Slop New York, con los gráficos al mismo nivel que tienen hoy.

"Old school" se refiere a la jugabilidad y la estructura, no al look. El look queda como está.

## 2. Premisas (innegociables)

### Gráficos

- No bajar la calidad visual. Nada de bajar la resolución, pixelar, pasar a low-poly ni sacar efectos. Se mantienen sin degradar el render WebGPU, los materiales TSL, la iluminación, el SSR, el post-processing y el ciclo día/noche.
- Todo lo nuevo (landmarks, vehículos, marcadores, HUD, efectos) tiene que estar a la altura del original.
- Rendimiento: el criterio de aceptación es no empeorar respecto de la base de la Fase 0, con un margen por el ruido entre corridas (~10 fps): la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base de la Fase 0 (protocolo de `docs/screens/README.md`, en el Chrome de Jero). En cada fase se hacen 3 corridas y se anotan mediana, mínimo y máximo de cada una en el Registro. Los 60 fps en Chrome con WebGPU en la MacBook Pro de Jero (Apple Silicon) quedan como aspiración, no como criterio.

### Stack

- Vanilla ES modules, sin build step, servido como sitio estático, igual que el original. No se agregan bundler, framework ni TypeScript.
- three.js va con versión fija en el importmap; nada de `@dev`.
- Los tests existentes tienen que seguir pasando (hoy son 113, todos en verde). La lógica nueva de juego lleva sus propios tests.

### Legal y licencias

- Conservar `LICENSE` (MIT, © 2026 Mr.doob). Se puede agregar el copyright propio al lado, pero no reemplazarlo.
- Conservar la atribución "© OpenStreetMap contributors" (ODbL), y la de NYC Open Data mientras quede data de NYC. Va en el README y en los créditos dentro del juego.
- Nada de Rockstar ni GTA: ni el nombre, ni logos, tipografías, música, sonidos, modelos, textos icónicos ("WASTED", "BUSTED") o assets extraídos. Lo que se toma son mecánicas, no assets.
- Música 100% original, sintetizada o compuesta para el proyecto. Nada de canciones existentes ni de melodías reconocibles.
- Marcas reales: no usar logos ni nombres de marcas comerciales reales en carteles, autos o negocios. Van marcas inventadas o parodias propias.
- Lugares reales sí (calles, edificios públicos, landmarks). Personas reales no: ninguna misión, personaje o diálogo sobre personas reales, sean políticos o famosos.
- Policía, colectivos y taxis llevan libreas inspiradas pero ficticias, sin escudos oficiales ni los colores exactos de empresas reales.

### Ciudad

- Zona: Centro, San Telmo y Puerto Madero. Los límites están en la Fase 2.
- Primero va un mapa aproximado armado a mano. Los datos reales de OSM llegan en la Fase 7.
- Las misiones, los spawns y los marcadores referencian lugares por ID semántico (`plaza-de-mayo`, `esquina:florida/lavalle`), que se resuelven contra los datos de la ciudad. Nunca por coordenadas sueltas en el código. Así, cambiar el mapa aproximado por el de OSM no rompe el gameplay.

### Idioma

- La UI, los textos y las misiones van en español rioplatense. El código, los nombres de archivo y los identificadores van en inglés, como en el original.

## 3. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Base | Fork de mrdoob/slop-newyork en el GitHub de Jero |
| Zona inicial | Centro, San Telmo y Puerto Madero |
| Gráficos | Igual que el original, sin bajar la calidad |
| Mapa | Aproximado a mano primero; datos reales de OSM después (Fase 7) |
| Primer gran hito | Robar autos → policía y estrellas → misiones → radio, en ese orden |
| Jugabilidad | Inspirada en los GTA clásicos: a pie por defecto, los vehículos se consiguen en el mundo |

## 4. Decisiones abiertas (Jero decide; Claude Code puede proponer)

- [ ] Nombre del juego. Algunas ideas: "Mano Única", "Microcentro", "Bondi".
- [ ] ¿Armas? Hay que definirlo antes de la Fase 4, porque cambia la IA policial. Por defecto: sin armas; la policía persigue, choca y arresta.
- [ ] Modo libre del original (cambio de vehículo con 1–4, teletransportes, cámaras escénicas): ¿solo como debug (`?debug=1`) o también como modo "paseo" para el jugador?
- [ ] Mobile/touch: el original tiene controles táctiles. ¿Siguen siendo un objetivo o solo desktop?
- [ ] Hosting: GitHub Pages del fork, como el original (recomendado).
- [ ] Sincronización con upstream: ¿traer mejoras futuras de Mr.doob? Recomendado: remote `upstream` y cherry-pick puntual. Después de la Fase 1, mergear completo deja de ser trivial.

## 5. Punto de partida (qué trae el repo)

Este inventario sale de una lectura rápida. En la Fase 1 hay que confirmarlo con detalle.

- Motor: three.js WebGPURenderer y TSL, unos 31k líneas en `js/`. Se carga con un importmap desde jsdelivr (`three.js@dev`; fijado a un commit en la Fase 0).
- Modos: caminar, auto, bici y helicóptero. Tiene 11 cámaras, tráfico, peatones, audio sintetizado y espacial, ciclo día/noche, mapa con teletransporte y ruta GPS, y controles de gamepad y táctiles.
- Datos de ciudad: `js/nyc-geodata.js` (1.1 MB), que se genera con `tools/build-geodata.mjs` a partir de OSM y NYC Open Data. Los datos crudos están en `tools/data/`.
- Tests: `node --test tests/*.test.cjs tests/*.test.mjs`.

| Probablemente se reutiliza tal cual | Se adapta | Se reemplaza para BA |
|---|---|---|
| `tsl-materials.js`, `lighting.js`, `post-processing.js`, `scene-culling.js`, `vehicle-lights.js`, `audio-*.js`, `gamepad-controls.js`, `touch-controls.js` y el sistema de `cameras.js` | `main.js`, `controllers.js` (subir y bajar de vehículos), `traffic.js` (sacar autos, patrulleros), `pedestrians.js` (huir, ser atropellados), `actor-models.js` (vehículos porteños), `buildings.js` (alturas y estilos por zona; las fire escapes son de NYC), `street-details.js`, `trees.js`, `road-network.js`, `road-paint.js`, `nyc-map.js` (mapa y radar), `index.html`, `css/style.css` | `nyc-geodata.js`, `city-config.js` (ROADS, NYC_LANDMARKS, TELEPORT_LOCATIONS, getLocationLabel), `city-grid.js`, `boroughs.js` (resto de NYC y NJ), `landmarks.js`, los presets escénicos de cámaras y el pipeline de `tools/` (en la Fase 7) |

## 6. Arquitectura de la capa de juego

```
js/
  cities/
    new-york/        ← NYC detrás del contrato CityData (Fase 1)
    buenos-aires/    ← datos y constructores de BA (Fase 2)
  game/
    events.js        ← bus de eventos motor → juego
    wanted.js        ← lógica pura de estrellas (testeable en node)
    missions.js      ← máquina de estados de misiones (lógica pura)
    economy.js       ← plata, recompensas, penalidades (lógica pura)
    save.js          ← guardado en localStorage (try/catch; el juego anda sin él)
    carjack.js       ← subir, bajar y robar vehículos
    police.js        ← IA policial, persecución, arresto
    markers.js       ← marcadores de misión en el mundo
    hud.js           ← vida, plata, estrellas, avisos
    radar.js         ← minimapa circular con blips
    radio.js         ← estaciones de radio
    missions/        ← misiones definidas como datos
```

- Separar la lógica pura de la integración. Lo que no depende de three.js (estrellas, misiones, economía) va sin imports del motor y se testea en node.
- El motor emite eventos y el juego los consume. Por ejemplo: `vehicle:entered`, `vehicle:stolen`, `ped:hit`, `vehicle:crash`, `police:sees-player`. Así se minimizan los cambios invasivos en los módulos del motor.
- Flag de debug (`?debug=1`): reactiva el modo libre del original, muestra un overlay de fps y permite saltar entre fases de una misión.
- Selector de ciudad (`?city=nyc|ba`): sirve para conservar NYC como test de regresión del motor.

## 7. Fases

Tamaño estimado: S = una sesión · M = varias sesiones · L = una fase larga, conviene partirla en subfases.

### Definition of Done (aplica a todas las fases)

- [ ] Pasan los tests existentes y los nuevos.
- [ ] Probado en Chrome con WebGPU, en local.
- [ ] Fps: la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base de la Fase 0 (protocolo de `docs/screens/README.md`, en el Chrome de Jero). Anotar las 3 corridas en el Registro.
- [ ] Capturas en `docs/screens/fase-N/` desde los mismos puntos de cámara (protocolo en `docs/screens/README.md`).
- [ ] ROADMAP actualizado (checkboxes y registro).
- [ ] PR con la descripción de qué cambió y cómo probarlo.

### Fase 0: Fork y base · S

Objetivo: el fork corre exactamente igual que el original, con las dependencias fijadas.

- [x] Hacer el fork en GitHub, clonarlo y agregar el remote: `git remote add upstream https://github.com/mrdoob/slop-newyork.git`.
- [x] Servir en local (`python3 -m http.server 8080`) y abrir en Chrome.
- [x] Correr los tests: `node --test tests/*.test.cjs tests/*.test.mjs`.
- [x] Fijar three.js en el importmap de `index.html` y en cualquier preload que apunte a la CDN. Probar primero con la última release de npm (`cdn.jsdelivr.net/npm/three@<versión>/...`). Si al proyecto le falta algo que hoy toma de `@dev`, fijar un commit concreto (`gh/mrdoob/three.js@<sha>/...`).
- [x] Copiar `CLAUDE.md` y `ROADMAP.md` a la raíz.
- [x] README: nombre provisorio, créditos a Mr.doob con link al original, licencias y atribuciones.
- [ ] Configurar GitHub Pages.
- [x] Sacar capturas de referencia del original desde varias cámaras y horarios. Van a ser la vara de calidad visual de todo el proyecto.

Criterios de aceptación: corre idéntico al original en local y en Pages; los tests pasan; three.js queda fijado.

### Fase 1: Separar la ciudad del motor · M–L

Objetivo: que el motor no sepa que está en Manhattan. Todo lo específico de la ciudad tiene que pasar por un contrato de datos (CityData) y un módulo de ciudad intercambiable.

- [ ] Inventario de acoplamiento en `docs/city-coupling.md`: todo lo que el motor asume de NYC. Por ejemplo: la geodata, ROADS, landmarks, teletransportes, cámaras escénicas, el punto de spawn, el ángulo de la grilla, la numeración de calles y avenidas, Broadway como caso especial, Central Park, ríos, puentes, boroughs, NJ, fire escapes y las etiquetas de ubicación. También los `modulepreload` de `index.html`, que precargan `nyc-geodata.js` y `city-config.js`; `tests/boot.test.cjs` valida su orden.
- [ ] Definir CityData en `docs/city-data.md`, con como mínimo:
  - calles: polilíneas con nombre, ancho, carriles, sentido (mano única o doble) y tipo (avenida, calle, peatonal, autopista);
  - manzanas y veredas: polígonos;
  - edificios: footprint, altura, estilo de fachada y zona;
  - parques y plazas, agua (ríos, diques) y límites del mundo;
  - grafo vial para tráfico y grafo peatonal para peatones;
  - landmarks: ID, posición y constructor;
  - lugares con nombre (IDs semánticos para spawns, misiones y teletransportes) y resolución de esquinas;
  - cámaras escénicas, punto de spawn, metadata (nombre, proyección, origen) y atribuciones.
- [ ] Hacer que NYC cargue a través de ese contrato (`js/cities/new-york/`), sin cambios visuales.
- [ ] Agregar el selector `?city=` (por defecto `nyc` hasta que BA esté lista).

Criterios de aceptación:

- NYC se ve y se juega igual: hay que comparar capturas desde las mismas cámaras.
- Los tests pasan.
- Ningún módulo del motor importa directamente datos específicos de NYC.

Si el acoplamiento resulta enorme (por ejemplo, si `city-grid.js` asume la grilla rotada de Manhattan en todos lados), frená y proponé una alternativa antes de seguir, como constructores paralelos para BA que reutilicen solo los módulos genéricos. Se decide con Jero.

### Fase 2: Buenos Aires aproximada · L (partir en 2.1–2.6)

Objetivo: recorrer un centro porteño reconocible a pie, en auto, en bici y en helicóptero, con la misma calidad visual que NYC.

#### 2.1 Trazado

- [ ] Límites aproximados:

  | Lado | Límite | Nota |
  |---|---|---|
  | Norte | Av. Córdoba | |
  | Sur | Av. San Juan | |
  | Oeste | Av. Callao / Entre Ríos | Incluye el Congreso |
  | Este | Costanera Sur | La Reserva Ecológica y el río funcionan como borde natural |

  Son unos 3,2 × 2,6 km. Más allá de los límites hace falta un "relleno" de ciudad para que el horizonte no quede vacío; el original hace algo parecido con los otros boroughs.
- [ ] Damero: unos 120–130 m entre ejes (manzana de ~115–120 m más calles de ~9–10 m). Las calles del centro son angostas. La grilla está algo girada respecto de N–S, así que el ángulo tiene que ser configurable. Las medidas exactas se corrigen con OSM en la Fase 7.
- [ ] Calles con sus nombres reales. Las que corren de norte a sur cambian de nombre al cruzar Rivadavia (ver Anexo A).
- [ ] Ejes especiales:
  - Av. 9 de Julio (~140 m de ancho, con calzadas laterales Cerrito/Lima y Carlos Pellegrini/Bernardo de Irigoyen, carriles centrales y espacio para el Metrobus);
  - Av. de Mayo (a mitad de manzana entre Rivadavia e Hipólito Yrigoyen, de Plaza de Mayo a Plaza del Congreso);
  - Diagonal Norte (de Plaza de Mayo hacia el Obelisco y Tribunales);
  - Diagonal Sur (de Plaza de Mayo hacia el sudoeste);
  - Av. Corrientes, Av. Leandro N. Alem / Paseo Colón y Av. Eduardo Madero / Ing. Huergo.
- [ ] Peatonales: Florida y Lavalle, sin autos y con más peatones.
- [ ] Sentidos: las avenidas son doble mano y la mayoría de las calles del centro son mano única. En el aproximado se alternan; los sentidos reales llegan con OSM.
- [ ] Puerto Madero: cuatro diques (del 4 al norte al 1 al sur). Del lado oeste, los docks de ladrillo (Alicia Moreau de Justo); del lado este, las torres (Juana Manso). Puentes peatonales y vehiculares sobre los diques.

#### 2.2 Zonas y edificación (alturas y estilos por zona, con variación)

- [ ] Microcentro: edificios de 8 a 20 pisos, con algunos más altos; mezcla de fachadas de principios del siglo XX y oficinas modernas.
- [ ] Av. de Mayo: edificios de época de 6 a 10 pisos, con cúpulas y fachadas ornamentadas.
- [ ] San Telmo: de 1 a 4 pisos, casas chorizo y fachadas coloniales e italianizantes, con calles de adoquines.
- [ ] Puerto Madero: docks de ladrillo bajos al oeste y torres de vidrio de 100 a 235 m al este.
- [ ] Reutilizar los estilos de fachada del original y ajustar las paletas y proporciones. Para BA se desactivan las fire escapes (son de NYC); se puede evaluar reemplazarlas por balcones.

#### 2.3 Landmarks (en orden de prioridad, al nivel de detalle de los landmarks del original)

1. [ ] Obelisco (9 de Julio y Corrientes)
2. [ ] Casa Rosada y Plaza de Mayo, con la Pirámide de Mayo
3. [ ] Cabildo y Catedral
4. [ ] Congreso y Plaza del Congreso
5. [ ] Puente de la Mujer (Dique 3)
6. [ ] Palacio Barolo (Av. de Mayo)
7. [ ] Teatro Colón
8. [ ] Plaza Dorrego (San Telmo)
9. [ ] Torres de Puerto Madero

#### 2.4 Sacar NYC

- [ ] Boroughs, NJ, Hudson y East River, Central Park y los puentes de NYC. Al este va el Río de la Plata, pasando la Reserva Ecológica.
- [ ] Nombres, etiquetas de ubicación y numeración de NYC en la UI.

#### 2.5 Ambientación porteña

- [ ] Vehículos (en `actor-models.js`, con la misma calidad que los actuales):
  - taxi negro con techo amarillo;
  - colectivo, con líneas y colores inventados;
  - patrullero con librea ficticia;
  - autos particulares genéricos, inspirados en el parque automotor local sin copiar modelos con marca.
- [ ] Mobiliario urbano: puestos de diarios, kioscos, semáforos locales, carteles de calle con el estilo porteño (diseño propio) y bocas de subte decorativas.
- [ ] Árboles: plátanos en las veredas, jacarandás, y ficus y palmeras en las plazas.

#### 2.6 UI

- [ ] Teletransportes y cámaras escénicas porteñas (Obelisco, Plaza de Mayo, Congreso, Puente de la Mujer, San Telmo, etc.).
- [ ] Mapa de BA con nombres de calles.
- [ ] Todos los textos en español; la pantalla de carga con el nombre provisorio.

Criterios de aceptación:

- Con `?city=ba` se recorre toda la zona en los cuatro modos, sin caer al vacío ni atravesar edificios.
- El Obelisco, la Plaza de Mayo y Puerto Madero se reconocen a simple vista.
- El tráfico y los peatones circulan por el trazado nuevo.
- No queda ningún resto visible de NYC.
- Fps: la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base de la Fase 0 (protocolo de `docs/screens/README.md`, en el Chrome de Jero).
- Las capturas comparadas con las de la Fase 0 muestran la misma calidad.
- `?city=ba` pasa a ser el valor por defecto.

### Fase 3: Robar autos y moverse como en GTA · M

Objetivo: el loop básico: caminar, subirte a cualquier auto y manejarlo.

- [ ] A pie por defecto. Los modos 1–4 del original pasan a quedar detrás de `?debug=1`.
- [ ] Subir y bajar con una tecla. Proponé F, después de verificar que no choque con los bindings existentes; mapearlo también en gamepad y en touch.
  - Se elige el vehículo más cercano dentro de unos 3 m, priorizando el que está en la dirección de la cámara.
  - Si el auto está vacío o estacionado, el jugador sube directo.
  - Si tiene conductor, hay una transición corta: el conductor sale y huye como peatón en pánico, y el jugador queda al volante.
- [ ] El vehículo robado sale del sistema de tráfico y pasa a ser el del jugador, con su mismo modelo.
- [ ] Al bajar, el auto queda donde lo dejaste. Se recicla recién cuando está lejos y fuera de cámara.
- [ ] Manejo por tipo de vehículo, parametrizando el controller de auto actual: el taxi es ágil, el colectivo pesado y lento, el patrullero rápido.
- [ ] Bici: se puede tomar si está estacionada o robársela a un ciclista.
- [ ] Helicóptero: sale de un helipuerto en Puerto Madero; ya no se elige con una tecla.
- [ ] Atropellar peatones: caen sin gore, los cercanos reaccionan con pánico y se emite el evento `ped:hit`.
- [ ] Daño básico de vehículos: cada vehículo tiene salud; con daño echa humo y con daño total queda inutilizado. La explosión queda para el backlog si complica.
- [ ] Eventos al bus: `vehicle:entered`, `vehicle:exited`, `vehicle:stolen`, `ped:hit`, `vehicle:crash`.

Criterios de aceptación:

- Podés robar cualquier auto del tráfico, bajarte, volver a subirte y robar otro.
- El conductor robado huye.
- Los autos abandonados persisten mientras estás cerca.
- No hay pérdida de fps con 10 autos abandonados en escena.

### Fase 4: Policía, estrellas y HUD · L

Objetivo: que los delitos tengan consecuencias.

#### Sistema de búsqueda (`wanted.js`, lógica pura y testeada)

| Nivel | Qué pasa |
|---|---|
| ★ | Delito visto por la policía (robar un auto, atropellar, chocar un patrullero). Un patrullero va a investigar. |
| ★★ | Persecución activa: varios patrulleros que intentan encerrarte. |
| ★★★ | Bloqueos de calle en las avenidas y más unidades. |
| ★★★★ | Helicóptero policial (reutiliza el modelo del modo helicóptero), con reflector de noche. |
| ★★★★★ | Todo lo anterior al máximo, con cortes en la 9 de Julio. |

- [ ] Testigos: un delito sin policía cerca puede no sumar estrellas, o sumar con demora si un peatón "llama".
- [ ] Perder estrellas: salir del área de búsqueda (visible en el radar) y no ser visto durante X segundos. El nivel baja de a uno.
- [ ] "Taller de chapa y pintura" en San Telmo: limpia las estrellas por plata. Es el equivalente propio del Pay 'n' Spray.

#### IA policial (`police.js`)

- [ ] Los patrulleros salen del pool de tráfico o del borde del área. En persecución calculan la ruta hacia el jugador por el grafo vial, ignoran semáforos y usan sirenas y luces (con `vehicle-lights.js` y el audio existente).
- [ ] Intentan encerrar al jugador y chocarlo de costado. A pie, el policía corre hacia el jugador.
- [ ] Arresto: si estás a pie, o con el auto detenido, y un policía te alcanza.
- [ ] Hay un límite de unidades activas por nivel, por presupuesto de rendimiento.

#### Consecuencias

- [ ] Al morir (vida en 0) o al ser arrestado, aparecés en un hospital o una comisaría genéricos y perdés plata. Las pantallas usan textos propios.

#### HUD y radar (`hud.js`, `radar.js`)

- [ ] Vida, plata y estrellas. El estilo es propio, inspirado en el HUD clásico pero sin copiarlo.
- [ ] Radar circular en la esquina, que rota con la cámara. Muestra las calles, el jugador, blips de policía, el área de búsqueda y los objetivos. Reutilizar todo lo posible del render de `nyc-map.js`.
- [ ] Avisos breves, como el nombre del barrio o la calle al entrar en una zona nueva.

Criterios de aceptación:

- Los tests unitarios de `wanted.js` cubren subir, bajar, decaer y el taller.
- Una persecución de 3 estrellas por el centro es jugable y se puede escapar.
- El arresto y la muerte funcionan y el juego continúa.
- Con 5 estrellas activas, la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base de la Fase 0 (protocolo de `docs/screens/README.md`, en el Chrome de Jero).

### Fase 5: Misiones · M–L

Objetivo: darle estructura al juego.

- [ ] Misiones como datos (`js/game/missions/*.js`), armadas con pasos tipados:
  - pasos: `goTo`, `enterVehicle`, `deliver`, `checkpoints`, `loseWanted`, `timer` y `survive`;
  - condiciones de falla: vehículo destruido, tiempo agotado, muerte y arresto.
- [ ] Los lugares se referencian por ID semántico, nunca por coordenadas.
- [ ] Marcadores en el mundo (`markers.js`): una columna de luz o un anillo, a la altura del look del juego. Además, un blip en el radar y una ruta GPS; el mapa del original ya traza rutas GPS, así que se reutiliza.
- [ ] Dadores de misión con blip y letra en el radar. Una misión se acepta al entrar al marcador.
- [ ] Minijuegos repetibles:
  - taxista: al subirte a un taxi se activa el modo de llevar pasajeros por plata;
  - delivery en bici por San Telmo, con tiempo;
  - carreras con checkpoints por la 9 de Julio y por Puerto Madero.
- [ ] Cinco misiones de muestra, con tono propio y sin personas reales:
  1. Tutorial: robar un auto en el Microcentro y llevarlo al taller de San Telmo.
  2. Contrarreloj: llevar un paquete del Congreso a Puerto Madero.
  3. Carrera por la 9 de Julio.
  4. Escapar de 3 estrellas y llegar al taller.
  5. Delivery en bici con tiempo por los adoquines.
- [ ] Guardado (`save.js`) de la plata, las misiones completadas y la posición. El juego tiene que funcionar si localStorage falla.

Criterios de aceptación:

- Las 5 misiones se completan de punta a punta.
- Fallar una misión permite reintentarla.
- El progreso sobrevive a recargar la página.
- Hay tests de la máquina de estados de misiones.

### Fase 6: Radio · M

Objetivo: la radio del auto, con música 100% original.

- [ ] Estaciones con nombres inventados, sintetizadas en tiempo real con Web Audio (reutilizar `audio-synthesis.js` donde sirva). Las canciones tienen estructura (intro, estrofa, estribillo) para no sonar a ruido aleatorio. Algunas ideas:
  - cumbia digital;
  - rock nacional ochentoso sintetizado;
  - tango electrónico;
  - house o electrónica;
  - una "AM" de jingles y cortinas.
- [ ] Al subir a un auto suena la última estación, y el nombre de la estación aparece en pantalla unos 2 segundos. Se cambia con teclas (proponer cuáles), con la rueda del mouse o con el gamepad.
- [ ] Mezcla: la radio baja cuando suenan sirenas o choques (ducking) y queda apagada a pie y en la bici.
- [ ] "Mi radio": el jugador puede cargar sus propios archivos de audio locales. No se sube nada, todo queda en el navegador.
- [ ] Rendimiento: la síntesis no puede tener glitches ni afectar los fps. Si hace falta, usar AudioWorklet.

Criterios de aceptación:

- Hay al menos 3 estaciones que suenan como música.
- Se puede cambiar de estación mientras se maneja.
- No aparecen glitches de audio durante una persecución.

### Fase 7: Datos reales de OpenStreetMap · M–L

Objetivo: reemplazar el mapa aproximado por el trazado real sin tocar el gameplay.

- [ ] Script en `tools/ba/` que Jero corre en su compu contra Overpass. Reutiliza `tools/overpass.sh` y el enfoque de `tools/build-geodata.mjs`. Bounding box aproximado, a ajustar: S −34.6250, O −58.3965, N −34.5965, E −58.3560.
- [ ] Datos a extraer:
  - calles con nombre, `width`/`lanes`, `oneway` y peatonales;
  - edificios con footprint y `building:levels`/`height`; si falta la altura, se usa un fallback por zona (Fase 2.2);
  - parques, plazas y agua (diques, río).
- [ ] Proyección a metros locales, con el origen y los ejes que use el motor (documentarlo en `docs/city-data.md`).
- [ ] Los landmarks se ubican en sus coordenadas reales (Anexo B), y los lugares con nombre se recalculan.
- [ ] Decidir si los datos crudos se commitean. La licencia ODbL lo permite con atribución.

Criterios de aceptación:

- El trazado coincide con el real, incluidos los sentidos de circulación.
- Las 5 misiones y los minijuegos siguen funcionando sin cambios en sus definiciones.
- Fps: la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base de la Fase 0 (protocolo de `docs/screens/README.md`, en el Chrome de Jero).
- La atribución de OSM aparece en el juego.

### Fase 8: Backlog (después del primer gran hito; priorizar con Jero)

- Armas, si se decide que sí.
- Explosiones y daño visual avanzado de vehículos.
- Motos.
- Colectivos con recorridos.
- Subte jugable.
- Clima: lluvia y sudestada.
- Más barrios: La Boca y Caminito, Retiro, Recoleta, Palermo.
- Policía a pie y peleas cuerpo a cuerpo.
- Ambiente sonoro porteño: bocinas, colectivos, vendedores.
- Modo foto.
- Pulido de los controles táctiles.
- Historia con personajes propios.

## 8. Riesgos y consideraciones técnicas

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El motor está muy acoplado a Manhattan | Alto (Fases 1–2) | Hacer la Fase 1 antes que nada y conservar NYC como test de regresión. Si el refactor no cierra, frenar y decidir con Jero. |
| three.js `@dev` cambia sin aviso | Alto | Fijar la versión en la Fase 0 y actualizar solo a propósito, en un PR propio. |
| La IA policial y las misiones bajan los fps | Medio | Usar pools y límites de unidades, aprovechar el culling existente y medir en cada fase. |
| Divergencia con upstream | Medio | Mantener el remote `upstream` y hacer cherry-pick puntual. No prometer sincronización completa. |
| Soporte de WebGPU | Medio | El objetivo es Chrome desktop. El original tiene fallback WebGL2; Safari y Firefox quedan como best-effort. |
| Pruebas visuales automatizadas | Medio | En la Mac de Jero, Claude Code puede usar Playwright con Chrome con GPU para sacar capturas. En headless sin GPU puede caer a WebGL2. La validación final es a ojo de Jero. |
| Alcance | Alto | No agregar barrios ni features antes de cerrar el loop jugable (Fases 3–5). El backlog existe para eso. |
| Temas legales (marca, música, libreas, personas reales) | Alto | Ver la sección 2. Ante la duda, inventar en vez de copiar. |

## 9. Registro de decisiones (lo va completando Claude Code)

| Fecha | Fase | Decisión | Por qué |
|---|---|---|---|
| 2026-10-25 | 0 | Fork en `BabyKuramaDev/proyecto-porteno`, clonado en `/Applications/MAMP/htdocs/gta-caba`, remote `upstream` → `mrdoob/slop-newyork`. | Nombre provisorio sin "GTA". |
| 2026-10-25 | 0 | three.js fijado a `gh/mrdoob/three.js@35ba271dea54fcbbcd86b794ce153a54d5b5f17e` (rama dev, 2026-10-25 08:57 UTC), no a npm `three@0.186.1`. | Con 0.186.1 los shaders WGSL fallan (`PMREM.Background`: "structures must have at least one member") al cambiar la hora y la página se cuelga. El sha elegido sirve archivos idénticos byte a byte a lo que entregaba `@dev` (snapshot cacheado de jsDelivr) cuando se sacaron las capturas de referencia. Actualizar solo en un PR propio. |
| 2026-10-25 | 0 | Capturas de referencia: JPEG q90, 1600×900, DPR 1, sin HUD, 5 cámaras × 3 horarios, con Playwright (Chrome 156, WebGPU/Metal). | JPEG para no inflar el repo (≈4,4 MB en total). Protocolo reproducible en `docs/screens/README.md`. |
| 2026-10-25 | 0 | `tests/overpass.test.mjs` falla en esta Mac (7 tests) porque el node de Herd está en una ruta con espacios (`Application Support`) y el test usa `process.execPath` como shebang. Con un node en ruta sin espacios pasan 7/7. No se modifica el test de upstream. | Problema de entorno, no del código. Para correr la suite completa hay que usar un node cuya ruta real no tenga espacios. Un symlink no alcanza (node resuelve la ruta real en `process.execPath`, verificado), y el node 18 de `/usr/local/bin` falla en otros 4 tests. |
| 2026-10-25 | 0 | El criterio de rendimiento pasa a ser no empeorar respecto de la base de la Fase 0 (mediana, mínimo y máximo, protocolo de `docs/screens/README.md`, en el Chrome de Jero). Los 60 fps quedan como aspiración. | Pedido de Jero: el original ya mide entre 50 y 60 fps según la corrida, así que 60 fijos no es un criterio alcanzable ni estable. |
| 2026-10-25 | 0 | Margen del criterio de fps: la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base. | Pedido de Jero: entre corridas con el mismo código hay ~10 fps de ruido, así que "no empeorar" sin margen daría falsos rechazos. Comparar peor contra peor reduce el efecto de una corrida con suerte. |
| 2026-10-25 | 0 | Tests con `node@24` de Homebrew (24.22.1, la misma versión que Herd): `/opt/homebrew/opt/node@24/bin/node --test tests/*.test.cjs tests/*.test.mjs` → 113/113. | Su ruta real (`/opt/homebrew/Cellar/node@24/...`) no tiene espacios. Es keg-only, así que no reemplaza al node de Herd en el PATH. |
| 2026-10-25 | 0 | `<meta name="description">` de `index.html` reescrito con una descripción propia, sin "GTA". | Premisa legal. Es el único cambio al index además del pin de three. |

FPS por fase (protocolo de `docs/screens/README.md`; mediana / mínimo / máximo):

| Fase | Dónde | Mediana | Mín | Máx | Notas |
|---|---|---|---|---|---|
| 0 (original) — **base**, corrida 1 | Chrome de Jero | pendiente | pendiente | pendiente | La base contra la que se comparan todas las fases. La mide Jero. |
| 0 (original) — **base**, corrida 2 | Chrome de Jero | pendiente | pendiente | pendiente | |
| 0 (original) — **base**, corrida 3 | Chrome de Jero | pendiente | pendiente | pendiente | **Piso para las fases siguientes = peor mediana de las 3 corridas − 3 fps:** pendiente. |
| 0 (original) | Playwright + Chrome 156 (WebGPU/Metal), 1600×900, DPR 1 | 50–60 | 48–50 | 52–62 | Referencia informativa, no es la base. Tres corridas con el mismo código de three: 50/48/52, 52/50/54 y 60/50/62. La variación es del entorno. |

## Anexo A: Calles del centro (referencia para el mapa aproximado)

Calles que corren de norte a sur (paralelas al río), de oeste a este. Cambian de nombre al cruzar Av. Rivadavia.

| Al norte de Rivadavia | Al sur de Rivadavia |
|---|---|
| Av. Callao | Av. Entre Ríos |
| Rodríguez Peña | Solís |
| Montevideo | Virrey Cevallos |
| Paraná | Luis Sáenz Peña |
| Uruguay | San José |
| Talcahuano | Santiago del Estero |
| Libertad | Salta |
| Cerrito (lateral de la 9 de Julio) | Lima (lateral) |
| Av. 9 de Julio | Av. 9 de Julio (no cambia) |
| Carlos Pellegrini (lateral) | Bernardo de Irigoyen (lateral) |
| Suipacha | Tacuarí |
| Esmeralda | Piedras |
| Maipú | Chacabuco |
| Florida (peatonal) | Perú |
| San Martín | Bolívar |
| Reconquista | Defensa |
| 25 de Mayo | Balcarce |
| Av. Leandro N. Alem | Av. Paseo Colón |
| Av. Eduardo Madero | Av. Ing. Huergo |

Más al este sigue Puerto Madero: Alicia Moreau de Justo (docks), los diques 4 a 1, Juana Manso (torres), la Costanera Sur y la Reserva Ecológica.

Calles que corren de este a oeste, de norte a sur:

- Av. Córdoba, Viamonte, Tucumán, Lavalle (peatonal en el centro), Av. Corrientes, Sarmiento, Tte. Gral. J. D. Perón y Bartolomé Mitre.
- Av. Rivadavia, y Av. de Mayo a mitad de manzana.
- Hipólito Yrigoyen, Alsina, Moreno, Av. Belgrano, Venezuela, México, Chile, Av. Independencia, Estados Unidos, Carlos Calvo, Humberto Primo y Av. San Juan.

Plaza de Mayo: ocupa dos manzanas, entre Rivadavia e Hipólito Yrigoyen y entre Bolívar/San Martín y Balcarce/25 de Mayo. La Casa Rosada está del lado este (Balcarce) y el Cabildo del lado oeste (Bolívar). La Catedral está en la esquina de Rivadavia y San Martín.

Esta lista sale de conocimiento general, sin verificar calle por calle. En la Fase 7 manda OSM.

## Anexo B: Coordenadas aproximadas de los landmarks (±100 m; verificar con OSM)

| Lugar | Lat | Lon |
|---|---|---|
| Obelisco | −34.6037 | −58.3816 |
| Plaza de Mayo (centro) | −34.6083 | −58.3721 |
| Casa Rosada | −34.6081 | −58.3703 |
| Cabildo | −34.6086 | −58.3735 |
| Congreso | −34.6098 | −58.3926 |
| Palacio Barolo | −34.6095 | −58.3856 |
| Teatro Colón | −34.6011 | −58.3833 |
| Puente de la Mujer | −34.6085 | −58.3647 |
| Plaza Dorrego | −34.6206 | −58.3716 |

## Prompts sugeridos para Claude Code

Fase 0:

> Leé CLAUDE.md y ROADMAP.md completos. Hacé la Fase 0. Arrancá en plan mode y mostrame el plan antes de tocar nada.

Fase 1:

> Leé ROADMAP.md. Vamos con la Fase 1. Primero armá el inventario de acoplamiento con NYC (docs/city-coupling.md) y la propuesta de contrato CityData (docs/city-data.md). No implementes nada todavía: quiero revisar esos dos documentos antes.

Fase 2 (por subfase):

> Seguimos con la Fase 2.1 del ROADMAP.md (trazado). Plan primero. Acordate: la calidad visual no se toca y los lugares van con ID semántico.

Fases 3 a 7:

> Vamos con la Fase N del ROADMAP.md. Investigá los módulos involucrados, proponé el plan con los puntos de integración y los riesgos, y esperá mi OK. Al terminar, cumplí la Definition of Done y actualizá el registro.
