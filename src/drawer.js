import { minBy, min, max, maxBy, reduce, last, map } from 'lodash';
import { hslToRgb } from './hsl';
import { BLENDING_MODES, GRADIENT_KINDS } from './shared';

export default function createDrawer({ canvas }) {
  const context = canvas.getContext('2d');
  let startPos = null;
  let pos = null;

  function lineTo(coordinate) {
    context.lineTo(coordinate[0], coordinate[1]);
  }

  function moveTo(coordinate) {
    context.moveTo(coordinate[0], coordinate[1]);
  }

  function startWalk() {
    moveTo(startPos[0], startPos[1]);
    context.beginPath();
  }

  function walk(distance, angle) {
    pos[0] += distance * Math.cos(angle);
    pos[1] += distance * Math.sin(angle);
    return [pos[0], pos[1]];
  }

  function connectStartWithEnd(coordinates) {
    const translate = [
      last(coordinates)[0] - coordinates[0][0],
      last(coordinates)[1] - coordinates[0][1]
    ];

    return map(coordinates, (coordinate, index) => {
      const progressed = index / (coordinates.length - 1);

      const delta = [
        translate[0] * progressed,
        translate[1] * progressed
      ];

      return [
        coordinate[0] - delta[0],
        coordinate[1] - delta[1]
      ];
    });
  }

  function getBoundingBox(coordinates) {
    return [
      [
        minBy(coordinates, coordinate => coordinate[0])[0],
        minBy(coordinates, coordinate => coordinate[1])[1]
      ],
      [
        maxBy(coordinates, coordinate => coordinate[0])[0],
        maxBy(coordinates, coordinate => coordinate[1])[1]
      ]
    ];
  }

  const coordsToOrigin = (coordinates, topLeftPosition) =>
    map(coordinates, coordinate =>
      [
        coordinate[0] - topLeftPosition[0],
        coordinate[1] - topLeftPosition[1]
      ]
    );

  function scaleCoords({
    coordinates,
    boundingBox,
    targetSize,
    position,
    scale,
    translate
  }) {
    const scale0To1 = scale / 255;
    const dimensions = [
      boundingBox[1][0] - boundingBox[0][0],
      boundingBox[1][1] - boundingBox[0][1]
    ];

    const scaleToFit = min([
      targetSize[0] / dimensions[0] * scale0To1,
      targetSize[1] / dimensions[1] * scale0To1
    ]);

    const scaledCoords = map(
      coordinates,
      coordinate => [coordinate[0] * scaleToFit, coordinate[1] * scaleToFit]
    );

    const move = [
      (targetSize[0] - dimensions[0] * scaleToFit) * position[0] / 255,
      (targetSize[1] - dimensions[1] * scaleToFit) * position[1] / 255
    ];

    return map(scaledCoords, coordinate => [
      coordinate[0] + move[0] + translate[0],
      coordinate[1] + move[1] + translate[1]
    ]);
  }

  function calculateShape({
    dimensions,
    startAngle,
    angles,
    position,
    scale,
    translate
  }) {
    let angle = startAngle;

    const inflatedAngles = [];

    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      let result = a.angle;
      result /= 511;
      result *= 16 + 15;
      result -= 16;

      inflatedAngles.push(result + a.bend / 3);
    }

    const sum = reduce(inflatedAngles, (a, b) => a + b, 0);
    const angleUnit = 2 * Math.PI / sum;
    let coordinates = [];

    for (let j = 0; j < inflatedAngles.length; j++) {
      const point = inflatedAngles[j];
      coordinates.push(walk(2, angle));
      angle += angleUnit * point;
    }

    coordinates = connectStartWithEnd(coordinates);
    const boundingBox = getBoundingBox(coordinates);
    coordinates = coordsToOrigin(coordinates, boundingBox[0]);
    return scaleCoords({
      coordinates,
      boundingBox,
      targetSize: dimensions,
      position,
      scale,
      translate
    });
  }

  function colorString(color) {
    const normalized = color.slice(0).map(part => part / (255));
    const [h, s, l] = normalized;
    const [r, g, b] = hslToRgb(h, s, l);
    return `rgb(${parseInt(r, 10)},${parseInt(g, 10)},${parseInt(b, 10)})`;
  }

  function createGradientStyle({ gradient, boundingBox }) {
    let result = null;
    let center = null;

    const dimensions = [
      boundingBox[1][0] - boundingBox[0][0],
      boundingBox[1][1] - boundingBox[0][1]
    ];

    switch (GRADIENT_KINDS[Math.round(gradient.kind)]) {
      case 'radial':
        center = [
          boundingBox[0][0] + gradient.position[0] / 255 * dimensions[0],
          boundingBox[0][1] + gradient.position[1] / 255 * dimensions[1]
        ];
        result = context.createRadialGradient(
          center[0],
          center[1],
          gradient.position[2] / 255 * max(dimensions),
          center[0],
          center[1],
          gradient.position[5] / 255 * max(dimensions)
        );
        break;

      case 'linear':
        result = context.createLinearGradient(
          boundingBox[0][0] + gradient.position[0] / 255 * dimensions[0],
          boundingBox[0][1] + gradient.position[1] / 255 * dimensions[1],
          boundingBox[1][0] + gradient.position[3] / 255 * dimensions[0],
          boundingBox[1][1] + gradient.position[4] / 255 * dimensions[1]
        );
        break;

      default:
        throw new Error('Unknown gradient type');
    }

    gradient.stops.forEach((stop) => {
      result.addColorStop(stop.position / 255, colorString(stop.color));
    });

    return result;
  }

  function shape(shapeSettings, dimensions, translate) {
    if (!shapeSettings.enabled) return;

    const {
      lineWidth,
      blendingMode,
      opacity,
      colorCycleSteps,
      colorCycleStartPos,
      startAngle,
      angles,
      position,
      scale,
      color,
      solid,
      dotted,
      gradient,
      isTransparent
    } = shapeSettings;

    const coordinates = calculateShape({
      dimensions,
      translate,
      startAngle,
      angles,
      position,
      scale,
    });

    context.globalCompositeOperation = BLENDING_MODES[blendingMode];
    context.globalAlpha = isTransparent ? 1 : opacity / 255;

    startWalk();
    context.lineWidth = lineWidth / 2;
    let colorCycle = colorCycleStartPos;
    const halfWay = colorCycleSteps / 2;

    for (let i = 0; i < coordinates.length; i++) {
      const coordinate = coordinates[i];
      if (colorCycle > halfWay && dotted) {
        moveTo(coordinate);
      } else {
        lineTo(coordinate);
      }

      if (colorCycle-- < 0) colorCycle = colorCycleSteps;
    }

    let style = colorString(color);

    if (gradient.enabled && solid) {
      style = createGradientStyle({
        gradient,
        boundingBox: getBoundingBox(coordinates)
      });
    }

    if (solid) {
      context.strokeStyle = null;
      context.fillStyle = style;
      context.fill();
    } else {
      context.fillStyle = null;
      context.strokeStyle = style;
      context.stroke();
    }
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function reset() {
    startPos = [0, 0];
    pos = [0, 0];
  }

  function draw({ fenotype, dimensions, translate }) {
    reset();

    for (let i = 0; i < fenotype.shapes.length; i++) {
      shape(fenotype.shapes[i], dimensions, translate);
    }
  }

  return { reset, clear, draw, shape };
}
