# Proyecto Porteño

*(nombre provisorio)*

Un juego de mundo abierto ambientado en el centro de Buenos Aires (Microcentro, San Telmo y Puerto Madero), con la jugabilidad de los clásicos de mundo abierto: a pie por defecto, autos que se consiguen en la calle, policía, misiones y radio. Corre en el navegador con [three.js](https://threejs.org/), WebGPURenderer y TSL.

Estado: en desarrollo. Por ahora el fork corre igual que el original (Nueva York). El plan, fase por fase, está en [ROADMAP.md](ROADMAP.md).

## Basado en Slop New York

Este proyecto es un fork de **[Slop New York](https://github.com/mrdoob/slop-newyork)** de [Mr.doob](https://github.com/mrdoob) ([demo original](https://mrdoob.github.io/slop-newyork/)). El motor, el render, la iluminación, el audio y los sistemas de tráfico y peatones vienen de ahí. Gracias por publicarlo con licencia abierta.

## Cómo correrlo

```sh
python3 -m http.server 8080
```

Abrí http://localhost:8080 en Chrome (para tener WebGPU). No hay build step: son ES modules servidos como sitio estático. three.js se carga desde jsDelivr con una versión fija en el importmap de `index.html`.

Tests:

```sh
node --test tests/*.test.cjs tests/*.test.mjs
```

## Licencias y atribuciones

- Código: [licencia MIT](LICENSE), © 2026 Mr.doob. Se conserva tal cual.
- Datos geográficos: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL) y NYC Open Data.
- three.js: licencia MIT. Los datos y las dependencias de terceros conservan sus licencias respectivas.

Este proyecto no está afiliado a Rockstar Games ni a la serie Grand Theft Auto, ni usa sus nombres, assets o música. Toma inspiración solo en las mecánicas de juego.
