import { min, max, map, sample, random } from 'lodash';
import SchemaDrawing from './schema-drawing';
import { BLENDING_MODES, GRADIENT_KINDS } from './shared';

const shapesInDrawing = SchemaDrawing.properties.shapes.minItems;

function randomAngleList({ damping, count, roundness }) {
  let d = 0;

  return map(new Array(count), () => {
    d += (random(true) - 0.5) / roundness;
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
  const maxValue = 256 * 256 - 1;
  return fill(3, () => Math.min(
    maxValue,
    parseInt(
      random(0, maxValue) * brightness, 10
    )
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
  const paletteSize = random(1, 7);
  const colors = [...Array(paletteSize)].map(() => randomColor({ brightness }));

  return colors.sort((a, b) => {
    const valA = a[0] * 255 * 255 + a[1] * 255 + a[2];
    const valB = b[0] * 255 * 255 + b[1] * 255 + b[2];

    return valA > valB;
  });
}

function createRandomLineSettings({ palette, settings, zoomVariance }) {
  const solid = settings.shapesOnly || !settings.linesOnly && random(true) > 0.3333;

  const dotted = settings.dotted && !!random();

  const lineWidth = solid ? 0 :
    random(SchemaDrawing.properties.shapes.items.properties.lineWidth.maximum, true);

  const maxAngles = SchemaDrawing.properties.shapes.items.properties.angles.minItems;
  const angles = randomAngleList({
    damping: random(true) * 1.25,
    count: maxAngles,
    roundness: random(1, 5)
  });

  const normalizedAngles = angles.map(angle => parseInt((angle + 16) / (16 + 15) * 511, 10));

  // const activeAngles = random(maxAngles - 5) + 3;

  const color = sample(palette);

  return {
    angles: normalizedAngles,
    // activeAngles,
    scale: random(zoomVariance), // random(255),
    opacity: random(255),
    isTransparent: !!random(),
    position: fill(2, randomByte),
    blendingMode: random(BLENDING_MODES.length - 1),
    colorCycleSteps: threshold(0.9, random(31), 0),
    colorCycleStartPos: 0,
    startAngle: random(255),
    color,
    solid,
    dotted,
    lineWidth: settings.lineWidth || lineWidth,
    gradient: createGradient({ palette }),
    enabled: !!random()
  };
}

export default function imagineDrawing(settings) {
  const palette = createRandomPalette(settings);
  const zoomVariance = random(255);
  return {
    shapes: [...Array(shapesInDrawing)].map(
      () => createRandomLineSettings({ palette, settings, zoomVariance })
    )
  };
}
