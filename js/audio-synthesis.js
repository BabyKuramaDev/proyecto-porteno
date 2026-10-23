// Shared procedural audio and continuously running, mono vehicle voices. Spatial placement and overall mixing
// belong to the caller; every source and processing node created by a voice is released by dispose().

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Movement and tone controls only need one value per audio block. Set every parameter on these nodes:
// even an unused a-rate parameter can make the browser recalculate spatial/filter math for every sample.
// Oscillator modulation and gain envelopes keep their default audio rate.
export function setControlRate(...parameters) {
  for (const parameter of parameters) {
    if (parameter?.automationRate !== undefined) parameter.automationRate = 'k-rate';
  }
}

function randomSequence(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalizeLoop(buffer, rms, ceiling = 0.9) {
  const data = buffer.getChannelData(0);
  let mean = 0;
  for (let i = 0; i < data.length; i++) mean += data[i];
  mean /= data.length;
  let energy = 0, peak = 0;
  for (let i = 0; i < data.length; i++) {
    data[i] -= mean;
    energy += data[i] * data[i];
    peak = Math.max(peak, Math.abs(data[i]));
  }
  const scale = Math.min(ceiling / Math.max(peak, 0.0001), rms / Math.max(Math.sqrt(energy / data.length), 0.0001));
  for (let i = 0; i < data.length; i++) data[i] *= scale;
  return buffer;
}

function combustionBuffers(context, cylinders, diesel, seed) {
  const rate = context.sampleRate;
  const referenceRPM = 1200;
  const cycles = 20; // Twenty complete four-stroke cycles, not a single repeating waveform.
  const length = Math.round(cycles * 120 / referenceRPM * rate);
  const exhaust = context.createBuffer(1, length, rate);
  const mechanical = context.createBuffer(1, length, rate);
  const pressure = exhaust.getChannelData(0), clatter = mechanical.getChannelData(0);
  const random = randomSequence(seed);
  const cylinderStrength = Array.from({ length: cylinders }, () => 0.83 + random() * 0.34);
  const cylinderDelay = Array.from({ length: cylinders }, () => (random() - 0.5) * 0.035);
  const interval = length / (cycles * cylinders);
  const duration = Math.round(rate * (diesel ? 0.062 : 0.048));
  for (let firing = 0; firing < cycles * cylinders; firing++) {
    const cylinder = firing % cylinders;
    let index = Math.round((firing + cylinderDelay[cylinder] + (random() - 0.5) * 0.022) * interval);
    index = (index + length) % length;
    const strength = cylinderStrength[cylinder] * (0.79 + random() * 0.42);
    const resonance = (diesel ? 93 : cylinders === 6 ? 118 : 145) * (0.94 + random() * 0.12);
    const decay = (diesel ? 0.019 : 0.012) * (0.85 + random() * 0.3);
    let lowNoise = 0;
    for (let i = 0; i < duration; i++) {
      const t = i / rate;
      const white = random() * 2 - 1;
      lowNoise += (white - lowNoise) * 0.16;
      const attack = 1 - Math.exp(-t / 0.00065);
      const tail = Math.exp(-t / decay);
      // A short pressure release, damped exhaust-body response and turbulent gas; each firing is different.
      const release = Math.exp(-t / 0.0022) - 0.36 * Math.exp(-t / 0.009);
      const body = Math.sin(2 * Math.PI * resonance * t) * tail * 0.30;
      pressure[index] += strength * attack * (release * 0.72 + body + lowNoise * tail * 0.78);
      // Injector/valve impacts contain much more noise than ringing, with a separate delayed tappet click.
      const valveTime = Math.max(0, t - 0.009);
      const valve = t > 0.009 ? Math.exp(-valveTime / 0.0016) * (white * 0.65 + Math.sin(valveTime * 14900) * 0.12) : 0;
      clatter[index] += strength * (white * attack * Math.exp(-t / (diesel ? 0.0036 : 0.0022)) + valve * 0.35);
      if (++index === length) index = 0;
    }
  }
  return {
    exhaust: normalizeLoop(exhaust, 0.30),
    mechanical: normalizeLoop(mechanical, diesel ? 0.22 : 0.18, 0.85),
    referenceRPM
  };
}

function rotorBuffers(context) {
  const rate = context.sampleRate;
  const revolutions = 16, blades = 4, revolutionsPerSecond = 5.2;
  const length = Math.round(rate * revolutions / revolutionsPerSecond);
  const rotor = context.createBuffer(1, length, rate);
  const envelope = context.createBuffer(1, length, rate);
  const data = rotor.getChannelData(0), modulation = envelope.getChannelData(0);
  const random = randomSequence(0x726f746f);
  const strengths = [1, 0.72, 0.93, 0.69];
  const interval = length / (revolutions * blades);
  for (let blade = 0; blade < revolutions * blades; blade++) {
    let index = Math.round((blade + (random() - 0.5) * 0.025) * interval);
    index = (index + length) % length;
    const strength = strengths[blade % blades] * (0.85 + random() * 0.3);
    let turbulence = 0;
    for (let i = 0; i < rate * 0.095; i++) {
      const t = i / rate;
      turbulence += (random() * 2 - 1 - turbulence) * 0.24;
      const attack = 1 - Math.exp(-t / 0.0011);
      const pressure = (1 - t / 0.0055) * Math.exp(-t / 0.0055);
      const slap = Math.sin(t * 2 * Math.PI * 76) * Math.exp(-t / 0.013) * 0.18;
      const wash = attack * Math.exp(-t / 0.027);
      data[index] += strength * (pressure * attack * 0.8 + slap + turbulence * wash * 1.4);
      modulation[index] += strength * wash;
      if (++index === length) index = 0;
    }
  }
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, modulation[i]);
  for (let i = 0; i < length; i++) modulation[i] /= peak;
  return { rotor: normalizeLoop(rotor, 0.29), envelope };
}

function ratchetBuffer(context) {
  const rate = context.sampleRate;
  const length = Math.round(rate * 2);
  const buffer = context.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  const random = randomSequence(0x7061776c);
  const teeth = 120; // Reference: sixty pawl contacts per second.
  for (let tooth = 0; tooth < teeth; tooth++) {
    let index = Math.round((tooth + (random() - 0.5) * 0.06) / teeth * length);
    index = (index + length) % length;
    const strength = (tooth % 3 ? 0.62 : 1) * (0.75 + random() * 0.5);
    for (let i = 0; i < rate * 0.004; i++) {
      const t = i / rate;
      const click = (random() * 2 - 1) * 0.8 + Math.sin(t * 2 * Math.PI * 3100) * 0.2;
      data[index] += click * strength * (1 - Math.exp(-t / 0.00008)) * Math.exp(-t / 0.0008);
      if (++index === length) index = 0;
    }
  }
  return normalizeLoop(buffer, 0.15, 0.85);
}

function sirenSweepWave(context) {
  const real = new Float32Array(25), imaginary = new Float32Array(25);
  // Rounded, asymmetric rise and return: a motor-driven sweep rather than a perfectly sinusoidal vibrato.
  for (let harmonic = 1; harmonic < real.length; harmonic++) {
    for (let i = 0; i < 512; i++) {
      const phase = i / 512;
      const value = phase < 0.62 ? -Math.cos(Math.PI * phase / 0.62) : Math.cos(Math.PI * (phase - 0.62) / 0.38);
      real[harmonic] += value * Math.cos(2 * Math.PI * harmonic * phase) / 256;
      imaginary[harmonic] += value * Math.sin(2 * Math.PI * harmonic * phase) / 256;
    }
  }
  return context.createPeriodicWave(real, imaginary);
}

export function createSynthResources(context) {
  const sampleRate = context.sampleRate;
  const noise = context.createBuffer(1, Math.round(sampleRate * 2), sampleRate);
  const samples = noise.getChannelData(0);
  const random = randomSequence(0x6e796361);
  for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;

  // Warm each filter with one complete cycle before writing. Its state then wraps with the buffer, so the loop
  // boundary is an ordinary noise sample transition rather than a restart of the filter or an amplitude fade.
  const coefficient = Math.exp(-2 * Math.PI * 7000 / sampleRate);
  for (let pass = 0; pass < 2; pass++) {
    let previous = 0;
    for (let i = 0; i < samples.length; i++) previous += (samples[i] - previous) * (1 - coefficient);
    for (let i = 0; i < samples.length; i++) {
      previous += (samples[i] - previous) * (1 - coefficient);
      samples[i] = previous;
    }
  }
  let mean = 0;
  for (let i = 0; i < samples.length; i++) mean += samples[i];
  mean /= samples.length;
  let peak = 0;
  let energy = 0;
  for (let i = 0; i < samples.length; i++) {
    samples[i] -= mean;
    peak = Math.max(peak, Math.abs(samples[i]));
    energy += samples[i] * samples[i];
  }
  const scale = Math.min(0.95 / peak, 0.30 / Math.sqrt(energy / samples.length));
  for (let i = 0; i < samples.length; i++) samples[i] *= scale;

  const impulse = context.createBuffer(2, Math.round(sampleRate * 0.7), sampleRate);
  const reflections = [0.017, 0.034, 0.061, 0.097, 0.153, 0.231];
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    const rand = randomSequence(0x626c6f63 + channel * 7919);
    let filtered = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      filtered += (rand() * 2 - 1 - filtered) * 0.35;
      const fadeIn = clamp((t - 0.012) / 0.035, 0, 1);
      const fadeOut = Math.min(1, (data.length - 1 - i) / (sampleRate * 0.04));
      data[i] = filtered * Math.exp(-t / 0.13) * fadeIn * fadeOut * 0.012;
    }
    for (let tap = 0; tap < reflections.length; tap++) {
      const start = Math.round((reflections[tap] + channel * (tap % 2 ? -0.0011 : 0.0017)) * sampleRate);
      const width = Math.round(sampleRate * (0.0008 + tap * 0.0002));
      const amplitude = 0.30 * Math.exp(-tap * 0.48);
      for (let i = 0; i < width; i++) {
        data[start + i] += (rand() * 2 - 1) * Math.sin(Math.PI * i / width) * amplitude;
      }
    }
  }

  const wave = (harmonics) => context.createPeriodicWave(new Float32Array(harmonics.length), new Float32Array(harmonics));
  const helicopter = rotorBuffers(context);
  return {
    noise,
    impulse,
    combustion: {
      sedan: combustionBuffers(context, 4, false, 0x73656461),
      suv: combustionBuffers(context, 6, false, 0x73757631),
      bus: combustionBuffers(context, 6, true, 0x64696573)
    },
    rotor: helicopter.rotor,
    rotorEnvelope: helicopter.envelope,
    ratchet: ratchetBuffer(context),
    sirenWave: wave([0, 1, 0.055, 0.48, 0.035, 0.23, 0.025, 0.13, 0.015, 0.07]),
    sirenSweep: sirenSweepWave(context),
    voiceSerial: 0
  };
}

// Keep only meaningful target changes. Replacing future events bounds the scheduling horizon; setTargetAtTime
// starts from the value reached by the preceding ramp, including when an update interrupts that ramp.
function smoothParameter(parameter, timeConstant = 0.07, epsilon = 0.0001, snapInitial = false) {
  let target = NaN;
  return (value, now) => {
    if (Math.abs(value - target) < epsilon) return;
    parameter.cancelScheduledValues(now);
    if (snapInitial && Number.isNaN(target)) parameter.setValueAtTime(value, now);
    else parameter.setTargetAtTime(value, now, timeConstant);
    target = value;
  };
}

export function createMotorVoice(context, resources, kind, output) {
  if (!['sedan', 'suv', 'bus', 'helicopter', 'cyclist', 'siren'].includes(kind)) {
    throw new RangeError(`Unknown motor voice: ${kind}`);
  }
  const nodes = [];
  const sources = [];
  const serial = resources.voiceSerial = (resources.voiceSerial || 0) + 1;
  let disposed = false;
  let lastSeed = NaN;
  let variation = 0.5;
  const own = (node) => { nodes.push(node); return node; };
  const gain = (value = 0) => {
    const node = own(context.createGain());
    node.gain.value = value;
    return node;
  };
  const filter = (type, frequency, q = 0.7) => {
    const node = own(context.createBiquadFilter());
    setControlRate(node.frequency, node.detune, node.Q, node.gain);
    node.type = type;
    node.frequency.value = Math.min(frequency, context.sampleRate * 0.45);
    node.Q.value = q;
    return node;
  };
  const oscillator = (type, frequency) => {
    const node = own(context.createOscillator());
    if (typeof type === 'string') node.type = type;
    else node.setPeriodicWave(type);
    node.frequency.value = frequency;
    sources.push(node);
    return node;
  };
  const loop = (buffer = resources.noise) => {
    const node = own(context.createBufferSource());
    node.buffer = buffer;
    node.loop = true;
    sources.push(node);
    return node;
  };
  const mix = gain();
  mix.channelCount = 1;
  mix.channelCountMode = 'explicit';
  mix.connect(output);
  let render;

  if (kind === 'sedan' || kind === 'suv' || kind === 'bus') {
    const bus = kind === 'bus';
    const suv = kind === 'suv';
    const sound = resources.combustion[kind];
    const idle = bus ? 620 : suv ? 710 : 780;
    const shifts = bus ? [4.8, 8.5, 13.5, 20] : [6.8, 12.5, 20, 29];
    const ratios = bus ? [280, 185, 132, 100, 76] : [360, 235, 165, 120, 90];
    let gear = 0, rpm = idle, throttle = 0, previousTime = -1, gearLock = 0, shiftUntil = 0;
    const exhaust = loop(sound.exhaust);
    const exhaustFilter = filter('lowpass', 500, 0.65);
    const exhaustGain = gain();
    exhaust.connect(exhaustFilter).connect(exhaustGain).connect(mix);
    const mechanism = loop(sound.mechanical);
    const mechanismFilter = filter('bandpass', bus ? 1400 : 1700, 0.45);
    const mechanismGain = gain();
    mechanism.connect(mechanismFilter).connect(mechanismGain).connect(mix);
    const road = loop();
    const roadHighpass = filter('highpass', 260, 0.5);
    const roadLowpass = filter('lowpass', 3200, 0.5);
    const roadGain = gain();
    road.connect(roadHighpass).connect(roadLowpass).connect(roadGain).connect(mix);
    const exhaustRate = smoothParameter(exhaust.playbackRate, 0.055, 0.0005, true);
    const mechanicalRate = smoothParameter(mechanism.playbackRate, 0.055, 0.0005, true);
    const exhaustCutoff = smoothParameter(exhaustFilter.frequency, 0.10, 1);
    const exhaustLevel = smoothParameter(exhaustGain.gain, 0.09);
    const mechanicalFrequency = smoothParameter(mechanismFilter.frequency, 0.12, 1);
    const mechanicalLevel = smoothParameter(mechanismGain.gain, 0.09);
    const roadLevel = smoothParameter(roadGain.gain, 0.18);
    const roadFrequency = smoothParameter(roadLowpass.frequency, 0.18, 1);
    const noiseRate = smoothParameter(road.playbackRate, 0.12, 0.001);
    render = (speed, load, doppler, now) => {
      const first = previousTime < 0;
      const dt = first ? 0.1 : clamp(now - previousTime, 0, 0.5);
      previousTime = now;
      throttle = first ? load : throttle + (load - throttle) * (1 - Math.exp(-dt / (load > throttle ? 0.14 : 0.32)));
      if (first) {
        while (gear < shifts.length && speed > shifts[gear] * (1 + throttle * 0.35)) gear++;
      } else if (now >= gearLock) {
        const oldGear = gear;
        if (gear < shifts.length && speed > shifts[gear] * (1 + throttle * 0.35) + 0.6) gear++;
        else if (gear > 0 && speed < shifts[gear - 1] * 0.72) gear--;
        if (gear !== oldGear) {
          gearLock = now + 0.7;
          shiftUntil = now + 0.18;
        }
      }
      // Wheel-coupled RPM, with torque-converter slip at low speed. Coasting retains engine braking rather than
      // dropping straight to idle; hysteresis and a minimum gear dwell prevent hunting around a shift boundary.
      const slip = throttle * (bus ? 380 : 820) * Math.max(0.18, 1 - speed / 13);
      const targetRPM = clamp(Math.max(idle, speed * ratios[gear]) + slip, idle, bus ? 2700 : 5400);
      rpm = first ? targetRPM : rpm + (targetRPM - rpm) * (1 - Math.exp(-dt / (targetRPM > rpm ? 0.19 : 0.12)));
      const pitch = (0.97 + variation * 0.06) * doppler;
      const effort = Math.min(1, throttle + speed * 0.005);
      const torque = now < shiftUntil ? 0.62 : 1;
      const rolling = Math.min(1.35, speed / 28);
      exhaustRate(rpm / sound.referenceRPM * pitch, now);
      mechanicalRate(rpm / sound.referenceRPM * pitch, now);
      exhaustCutoff((bus ? 420 : 520) + effort * 1250 + rpm * 0.055, now);
      exhaustLevel(((bus ? 0.18 : suv ? 0.14 : 0.12) + effort * (bus ? 0.20 : 0.16)) * torque, now);
      mechanicalFrequency((bus ? 1250 : 1600) * doppler, now);
      mechanicalLevel(((bus ? 0.11 : 0.045) + effort * (bus ? 0.18 : 0.11)) * torque, now);
      // Tire contact is broadband and becomes the dominant sound of a car passing at speed off-throttle.
      roadLevel(Math.pow(rolling, 1.25) * (bus ? 0.54 : 0.46), now);
      roadFrequency((2200 + Math.min(1, rolling) * 2400) * doppler, now);
      noiseRate(doppler * (0.96 + variation * 0.08), now);
    };
  } else if (kind === 'helicopter') {
    const rotor = loop(resources.rotor);
    const rotorFilter = filter('lowpass', 1500, 0.5);
    const rotorGain = gain();
    rotor.connect(rotorFilter).connect(rotorGain).connect(mix);
    const air = loop();
    const washFilter = filter('lowpass', 1400, 0.5);
    const washGain = gain();
    air.connect(washFilter).connect(washGain).connect(mix);
    const bladeEnvelope = loop(resources.rotorEnvelope);
    const bladeDepth = gain();
    bladeEnvelope.connect(bladeDepth).connect(washGain.gain);
    const turbineFilter = filter('bandpass', 3100, 0.7);
    const turbineGain = gain();
    air.connect(turbineFilter).connect(turbineGain).connect(mix);
    const rotorRate = smoothParameter(rotor.playbackRate, 0.30, 0.0004, true);
    const envelopeRate = smoothParameter(bladeEnvelope.playbackRate, 0.30, 0.0004, true);
    const rotorLevel = smoothParameter(rotorGain.gain, 0.22);
    const rotorCutoff = smoothParameter(rotorFilter.frequency, 0.22, 1);
    const washLevel = smoothParameter(washGain.gain, 0.22);
    const bladeLevel = smoothParameter(bladeDepth.gain, 0.22);
    const washCutoff = smoothParameter(washFilter.frequency, 0.25, 1);
    const turbineFrequency = smoothParameter(turbineFilter.frequency, 0.25, 1);
    const turbineLevel = smoothParameter(turbineGain.gain, 0.22);
    const noiseRate = smoothParameter(air.playbackRate, 0.15, 0.001);
    render = (speed, load, doppler, now) => {
      const flight = Math.min(1, speed / 40);
      // A governed rotor changes speed very little: collective/forward flight primarily strengthen the blade slap
      // and turbulent wash. The pressure loop and its noise envelope share the same phase and playback rate.
      const rate = (0.99 + variation * 0.02 + load * 0.025 + flight * 0.008) * doppler;
      rotorRate(rate, now);
      envelopeRate(rate, now);
      rotorLevel(0.34 + load * 0.12 + flight * 0.035, now);
      rotorCutoff((1300 + load * 600 + flight * 350) * doppler, now);
      washLevel(0.055 + load * 0.035, now);
      bladeLevel(0.28 + load * 0.18 + flight * 0.08, now);
      washCutoff((1000 + load * 750 + flight * 600) * doppler, now);
      turbineFrequency((2900 + load * 700) * doppler, now);
      turbineLevel(0.055 + load * 0.035, now);
      noiseRate(doppler, now);
    };
  } else if (kind === 'cyclist') {
    const road = loop();
    const tireFilter = filter('bandpass', 1500, 0.45);
    const tireGain = gain();
    road.connect(tireFilter).connect(tireGain).connect(mix);
    const ratchet = loop(resources.ratchet);
    const ratchetFilter = filter('bandpass', 2700, 0.65);
    const ratchetGain = gain();
    ratchet.connect(ratchetFilter).connect(ratchetGain).connect(mix);
    const tireLevel = smoothParameter(tireGain.gain, 0.15);
    const ratchetLevel = smoothParameter(ratchetGain.gain, 0.10);
    const ratchetRate = smoothParameter(ratchet.playbackRate, 0.10, 0.001, true);
    const ratchetFrequency = smoothParameter(ratchetFilter.frequency, 0.15, 1);
    const noiseRate = smoothParameter(road.playbackRate, 0.12, 0.001);
    render = (speed, load, doppler, now) => {
      const movement = Math.min(1.25, speed / 12);
      tireLevel(Math.pow(movement, 1.15) * 0.22, now);
      // A freewheel rattles while coasting; pedaling engages the pawls and leaves only faint chain/tire sound.
      ratchetLevel(Math.min(1, speed / 3) * (0.018 + (1 - load) * 0.23), now);
      ratchetRate(Math.max(0.06, speed / 5.5) * (0.97 + variation * 0.06) * doppler, now);
      ratchetFrequency(2700 * doppler, now);
      noiseRate(doppler, now);
    };
  } else {
    const siren = oscillator(resources.sirenWave, 1000);
    const highpass = filter('highpass', 270, 0.7);
    const hornFilter = filter('lowpass', 3800, 0.55);
    const sirenGain = gain();
    siren.connect(highpass).connect(hornFilter).connect(sirenGain).connect(mix);
    const sweep = oscillator(resources.sirenSweep, 0.28);
    const sweepDepth = gain();
    sweep.connect(sweepDepth).connect(siren.frequency);
    const envelopeDepth = gain();
    sweep.connect(envelopeDepth).connect(sirenGain.gain);
    const sirenFrequency = smoothParameter(siren.frequency, 0.09, 0.1);
    const sweepFrequency = smoothParameter(sweep.frequency, 0.14, 0.002);
    const sweepRange = smoothParameter(sweepDepth.gain, 0.09, 0.1);
    const sirenLevel = smoothParameter(sirenGain.gain, 0.10);
    const envelopeLevel = smoothParameter(envelopeDepth.gain, 0.10);
    const sirenCutoff = smoothParameter(hornFilter.frequency, 0.12, 1);
    render = (speed, load, doppler, now) => {
      const pitch = (0.97 + variation * 0.06) * doppler;
      sirenFrequency(1000 * pitch, now);
      sweepRange(450 * pitch, now);
      // Long wails and fast yelps share a horn spectrum; the sweep also changes radiated amplitude slightly.
      sweepFrequency((variation < 0.65 ? 0.23 + variation * 0.12 : 3.1 + variation * 1.3) * doppler, now);
      sirenLevel(0.125, now);
      envelopeLevel(0.025, now);
      sirenCutoff(3900 * doppler, now);
    };
  }

  function update({ speed = 0, load = 0, doppler = 1, seed = 0 } = {}, now = context.currentTime) {
    if (disposed) return;
    const safeSeed = Number.isFinite(seed) ? seed : 0;
    if (safeSeed !== lastSeed) {
      const hash = Math.sin((safeSeed % 1048576) * 12.9898 + 78.233) * 43758.5453;
      variation = hash - Math.floor(hash);
      lastSeed = safeSeed;
    }
    const time = Math.max(context.currentTime, Number.isFinite(now) ? now : context.currentTime);
    render(
      Number.isFinite(speed) ? Math.min(Math.abs(speed), 100) : 0,
      Number.isFinite(load) ? clamp(load, 0, 1) : 0,
      Number.isFinite(doppler) ? clamp(doppler, 0.5, 2) : 1,
      time
    );
  }

  const startTime = context.currentTime;
  mix.gain.setTargetAtTime(1, startTime, 0.04);
  for (const source of sources) {
    if (source.buffer) source.start(startTime, ((serial * 0.61803398875) % 1) * source.buffer.duration);
    else source.start(startTime);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const source of sources) source.stop();
    for (const node of nodes) node.disconnect();
  }

  return { update, dispose };
}
