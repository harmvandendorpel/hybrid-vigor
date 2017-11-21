import { min, max, map, sample, random } from 'lodash';
import { SchemaDrawing, SchemaShape } from './schema-drawing';
import {BLENDING_MODES, GRADIENT_KINDS} from './shared';

const shapesInDrawing = SchemaDrawing.properties.shapes.minItems;
const boidsInDrawing = 1;

function randomAngleList({ damping, count }) {
  let d = 0;

  return map(new Array(count), () => {
    d += (random(true) - 0.5) * 1.1;
    d *= damping;

    d = min([d, 15]);
    d = max([d, -16]);
    return d;
  });
}

function randomByte() {
  return random(255);
}

function threshold(value, yes, no) {
  return randomByte() / 255 > value ? yes : no;
}

function fill(count, callback) {
  return map(new Array(count), () => callback());
}

function randomColor({ brightness }) {
  const maxValue = 255;
  return fill(3, () => Math.min(
    maxValue,
    parseInt(random(0, maxValue) * brightness, 10)
  ));
}

function createGradient({ palette }) {
  return {
    enabled: true, // threshold(0.5, true, false),
    kind: random(GRADIENT_KINDS.length - 1), // 0.5, 'linear', 'radial'),
    stops: [{
      position: 0,
      color: sample(palette)
    }, {
      position: 255,
      color: sample(palette)
    }],
    position: fill(6, randomByte)
  };
}

function createRandomPalette(settings) {
  if (settings.bw) {
    return [[0, 0, 0]];
  }
  const brightness = random(true) * 2 + 0.5;
  const paletteSize = random(3, 7);
  const colors = [...Array(paletteSize)].map(() => randomColor({ brightness }));

  return colors.sort((a, b) => {
    const valA = a[0] * 255 * 255 + a[1] * 255 + a[2];
    const valB = b[0] * 255 * 255 + b[1] * 255 + b[2];

    return valA > valB;
  });
}

function createRandomLineSettings({ palette, settings }) {
  const solid = settings.shapesOnly || !settings.linesOnly && random(true) > 0.3333;

  const dotted = settings.dotted && random(31) > 22;

  const lineWidth = solid ? 0 :
    random(SchemaDrawing.properties.shapes.items.properties.lineWidth.maximum, true);

  const maxAngles = SchemaDrawing.properties.shapes.items.properties.angles.minItems;
  const damping = 0.1 + random(true) * 0.25;
  const angles = randomAngleList({
    damping,
    count: maxAngles
  });

  const normalizedAngles = angles.map(angle => ({
    angle: parseInt((angle + 16) / (31) * 511, 10)
  }));

  const color = sample(palette);

  const colorCycleSteps = random(1, 31);
  return {
    angles: normalizedAngles,
    scale: settings.scale || random(1, 255),
    opacity: random(255),
    isTransparent: !!random(),
    position: settings.position || fill(2, randomByte),
    blendingMode: settings.blendingMode || random(SchemaShape.properties.blendingMode.maximum),
    colorCycleSteps,
    colorCycleStartPos: 0, // random(colorCycleSteps),
    colorCycleIncrement: random(2),
    startAngle: random(255),
    color,
    solid,
    dotted,
    lineWidth: settings.lineWidth || lineWidth,
    gradient: createGradient({ palette }),
    enabled: true // settings.enabled || !!random()
  };
}

export default function imagineDrawing(settings) {
  const palette = createRandomPalette(settings);
  return {
    shapes: [...Array(shapesInDrawing)].map(() => createRandomLineSettings({
      palette, settings
    })),
    boids: [...Array(boidsInDrawing)].map(() => createRandomLineSettings({
      palette,
      settings: {
        ...settings,
        shapesOnly: true,
        enabled: true,
        blendingMode: 0,
        dotted: false,
        scale: random(2, 10),
        position: [0, 0]
      }
    }))
  };
}
