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

Misma sesión, cámara `chase`, horario Golden Hour (el de arranque), HUD visible: leer `#hud-fps` una vez por segundo durante 30 s, empezando 25 s después de `load`. Anotar mediana, mínimo y máximo en el Registro del ROADMAP.

La cifra varía bastante entre corridas con el mismo código (en la Fase 0 dio 50–52 en dos corridas y 60 en otra). Para comparar fases, medir varias veces y, en lo posible, en el Chrome de Jero a pantalla completa.

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
