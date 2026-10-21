const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../js/traffic.js'), 'utf8');
function productionFunction(name, context) {
  const match = source.match(new RegExp(`  function ${name}\\([^]*?\\n  \\}`));
  assert.ok(match, `${name} is present`);
  return vm.runInNewContext(`(${match[0].trim()})`, context);
}

for (const [hasView, inView, draw] of [[true, false, false], [true, true, true], [false, false, true]]) {
  test(`pedestrian gait always advances; pose generation follows drawing (${hasView}, ${inView})`, () => {
    let args, drawn = 0;
    const ped = { x: 10, z: 20, ux: 0, uz: 1, dir: 1, rig: { update(...values) { args = values; } } };
    const renderPed = productionFunction('renderPed', {
      hasView, visible: () => inView, pedGround: () => 0, focusX: 0, focusZ: 0,
      pedCrowd: { add(rig) { assert.equal(rig, ped.rig); drawn++; } }
    });
    renderPed(ped, 1 / 60);
    assert.equal(args[0], 1 / 60);
    assert.equal(args[1], ped.x);
    assert.equal(args[2], ped.z);
    assert.equal(args[5], ped);
    assert.equal(args[7], draw);
    assert.equal(drawn, draw ? 1 : 0);
  });
}
