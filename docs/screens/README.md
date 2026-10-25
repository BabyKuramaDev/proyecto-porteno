# Capturas de referencia

Cada fase guarda sus capturas en `docs/screens/fase-N/`, sacadas desde los mismos puntos y horarios, para compararlas con `fase-0/` (el original sin tocar). La validación final la hace Jero a ojo.

## Protocolo

- Navegador: Chrome con WebGPU real (en la Fase 0: Chrome 156 controlado por Playwright, adapter `apple` / `metal-3`). Confirmar que no cayó a WebGL2.
- Viewport: **1600×900, DPR 1**. Fijarlo explícitamente; si no, Playwright usa otro tamaño.
- Arranque limpio: `localStorage.clear()` y recargar (así el jugador aparece en el spawn por defecto). Esperar 25 s después de `load` para que terminen de compilar los shaders.
- HUD oculto: botón `#btn-toggle-hud` (tecla H).
- Horarios: `#time-midday`, `#time-golden`, `#time-midnight`. Después de cambiar de horario, esperar 3 s.
- Cámaras: `#cam-chase`, `#cam-fifthAve`, `#cam-timesSquare`, `#cam-observatory`, `#cam-waterfront`. Esperar 3,5 s antes de cada captura.
- Formato: JPEG calidad 90, nombre `<cámara>-<horario>.jpg`.
- Las nubes, el tráfico y los peatones se mueven, así que dos tandas nunca salen idénticas píxel a píxel. Se compara la calidad (materiales, luz, sombras, reflejos, post-processing), no los píxeles.

En las fases con Buenos Aires (`?city=ba`), las cámaras escénicas de NYC se reemplazan por sus equivalentes porteñas. Cuando eso pase, anotar acá la lista nueva y seguir sacando también la tanda NYC (`?city=nyc`) como regresión del motor.

## FPS

El criterio de aceptación de cada fase es no empeorar respecto de la base de la Fase 0, con margen: la peor mediana de las 3 corridas de la fase no puede quedar más de 3 fps por debajo de la peor mediana de las 3 corridas de la base. Por ejemplo, si las medianas de la base son 58, 60 y 55, el piso es 52. Tanto la base como las mediciones de cada fase se toman **en el Chrome de Jero**. Las mediciones con Playwright son solo informativas.

1. Abrir http://localhost:8080 en Chrome, con la ventana maximizada y siempre del mismo tamaño. Cerrar las otras pestañas pesadas.
2. En la consola de DevTools: `localStorage.clear(); location.reload();`
3. No tocar nada: cámara `chase`, Golden Hour (el horario de arranque), HUD visible, spawn por defecto.
4. Esperar 25 s desde que termina la carga y pegar en la consola:

   ```js
   (async () => { const s = []; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 1000)); s.push(+document.getElementById('hud-fps').textContent); } const o = [...s].sort((a, b) => a - b); const c = document.querySelector('canvas'); const a = await navigator.gpu?.requestAdapter(); const b = await navigator.getBattery?.(); console.log(JSON.stringify({ mediana: o[15], min: o[0], max: o[29], muestras: s.join(' '), ventana: innerWidth + 'x' + innerHeight, canvas: c.width + 'x' + c.height, dpr: devicePixelRatio, webgpu: a ? a.info.vendor + '/' + a.info.architecture : 'NO (WebGL2)', enchufada: b ? b.charging : '?' })); })();
   ```

5. A los 30 s imprime en una sola línea mediana, mínimo y máximo, junto con las condiciones de la corrida: tamaño de la ventana y del canvas, si hay WebGPU y si la Mac estaba enchufada. Repetirlo 3 veces y anotar las tres líneas en el Registro del ROADMAP.

La cifra varía bastante entre corridas con el mismo código: en la Fase 0, con Playwright, dio medianas de 50, 52 y 60. Por eso se toman tres corridas y se compara peor contra peor, con 3 fps de margen.

## Script (Playwright, `browser_run_code`)

```js
async (page) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('http://localhost:8080/');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(25000);
  await page.evaluate(() => document.getElementById('btn-toggle-hud').click());
  const cams = ['chase', 'fifthAve', 'timesSquare', 'observatory', 'waterfront'];
  for (const t of ['midday', 'golden', 'midnight']) {
    await page.evaluate((t) => document.getElementById('time-' + t).click(), t);
    await page.waitForTimeout(3000);
    for (const c of cams) {
      await page.evaluate((c) => document.getElementById('cam-' + c).click(), c);
      await page.waitForTimeout(3500);
      await page.screenshot({ path: `docs/screens/fase-N/${c}-${t}.jpg`, type: 'jpeg', quality: 90 });
    }
  }
}
```

Si la herramienta corta a los 120 s, partir el bucle en una llamada por horario.
