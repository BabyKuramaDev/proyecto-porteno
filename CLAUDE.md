# CLAUDE.md

Juego de mundo abierto tipo GTA ambientado en Buenos Aires (Centro, San Telmo y Puerto Madero), sobre un fork de mrdoob/slop-newyork. El plan completo está en `ROADMAP.md`: leelo antes de cualquier tarea y trabajá fase por fase.

## Reglas

- **No bajar la calidad gráfica.** El render WebGPU, los materiales TSL, la iluminación, el SSR, el post-processing y el ciclo día/noche se mantienen. Todo lo nuevo va a la misma altura. El objetivo es 60 fps en Chrome (WebGPU) en una MacBook Pro con Apple Silicon.
- **Sin build step.** Vanilla ES modules y sitio estático; nada de bundler, framework ni TypeScript. three.js va con versión fija en el importmap.
- **Legal:**
  - conservar `LICENSE` (MIT, Mr.doob) y la atribución de OpenStreetMap;
  - nada de nombres, assets, música ni textos de GTA o Rockstar;
  - música 100% original;
  - sin marcas comerciales reales y sin personas reales;
  - libreas de policía, colectivos y taxis ficticias.
- **Lugares por ID semántico** (`plaza-de-mayo`, `esquina:florida/lavalle`), nunca por coordenadas sueltas, así el mapa se puede reemplazar sin romper el gameplay.
- **La lógica de juego pura** (estrellas, misiones, economía) va en `js/game/`, sin imports de three.js y con tests en node.
- **Idioma:** UI y textos en español rioplatense; código e identificadores en inglés.

## Comandos

- Servir: `python3 -m http.server 8080` y abrir http://localhost:8080 (en Chrome, para tener WebGPU).
- Tests: `node --test tests/*.test.cjs tests/*.test.mjs`
- Flags: `?debug=1` (modo libre y overlay de fps) y `?city=nyc|ba`. Se agregan en las Fases 1 y 3.

## Cómo trabajar

- Una fase (o subfase) por vez, en plan mode, y esperar el OK antes de implementar.
- Una rama por fase, commits chicos y PR al final.
- Antes de dar algo por terminado, cumplir la Definition of Done del ROADMAP: tests, prueba en Chrome, fps anotados, capturas en `docs/screens/fase-N/` y ROADMAP actualizado.
- Si una decisión cambia lo que el jugador ve o juega y el ROADMAP no la cubre, preguntar. Las decisiones técnicas internas se toman y se anotan en el Registro de decisiones.
