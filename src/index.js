import $ from 'jquery';
import { forOwn, clone, random } from 'lodash';

import initPolyfills from './polyfills';
import createDrawer from './drawer';
import { initViewport } from './shared';
import { randomGenotype } from './creature';
import createFlies from './flies';

let state = null;
let canvas = null;
let drawer = null;
let interrupt = false;
// function countNodes(root) {
//   let count = 0;
//
//   function processNode(node) {
//     count++;
//     switch (typeof node) {
//       case 'object':
//         forOwn(node, (property, key) => {
//           processNode(node[key]);
//         });
//         break;
//
//       default:
//         break;
//     }
//   }
//
//   processNode(root);
//   return count;
// }

// const nodeCount = countNodes(initialCreature.fenotype);

function addFenoData(creature) {
  return {
    ...creature,
    shapes: creature.shapes.map(shape => ({
      ...shape,
      angles: shape.angles.map(angle => ({
        ...angle,
        bend: 0,
        bendDelta: 0
      }))
    })),
    boids: creature.boids.map(boid => ({
      ...boid,
      angles: boid.angles.map(angle => ({
        ...angle,
        bend: 0,
        bendDelta: 0
      }))
    }))
  };
}

function initState() {
  const initialGenotype = randomGenotype();
  state = {
    dimensions: null,
    translate: [0, 0],
    creature: {
      genotype: initialGenotype,
      fenotype: clone(addFenoData(initialGenotype))
    },
    flies: createFlies({ count: random(5, 30), canvas, moreBoidData: [] })
  };
  state.dimensions = [canvas.width, canvas.height];
  drawer = createDrawer({ canvas });
}

function drawCreature({ creature, translate, dimensions }) {
  drawer.draw({
    fenotype: creature,
    dimensions,
    translate
  });
}
//
// function drawSingleCreatureLarge(creature) {
//   const dimensions = [canvas.width, canvas.height];
//   const translate = [0, 0]
//
//   drawCreature({
//     creature,
//     drawer,
//     dimensions,
//     translate
//   });
// }

const easing = 50;

function transitionTo(target, current) {
  function processNode(targetNode, currentNode) {
    switch (typeof targetNode) {
      case 'number':
        return currentNode + (targetNode - currentNode) / easing;

      case 'object':
        const result = (targetNode.constructor === Array) ? [] : {};

        forOwn(currentNode, (property, key) => {
          result[key] = processNode(targetNode[key], currentNode[key]);
        });
        return result;

      default:
        return targetNode;
    }
  }

  return processNode(target, current);
}

function vary(value, minimum, maximum) {
  const range = Math.abs(maximum - minimum) * 0.00001;

  return Math.max(minimum + 1, Math.min(
    value + Math.random() * range - Math.random() * range,
    maximum
  ));
}

// function disturb(genotype, fenotype, schema) {
//   function disturbChildren(genoNode, fenoNode, key, schemaNode) {
//     forOwn(fenoNode[key], (property, childKey) => {
//       const childSchemaNode = schemaNode.type === 'array' ?
//         schemaNode.items :
//         schemaNode.properties[childKey];
//
//       switch (typeof fenoNode[key][childKey]) {
//         case 'number':
//           if (Math.random() > 0.99) {
//             fenoNode[key][childKey] = vary(
//               fenoNode[key][childKey],
//               childSchemaNode.minimum,
//               childSchemaNode.maximum
//             );
//           }
//
//           break;
//
//         case 'object':
//           disturbChildren(genoNode[key], fenoNode[key], childKey, childSchemaNode);
//           break;
//
//         default:
//       }
//     });
//   }
//
//   disturbChildren({ genotype }, { genotype: fenotype }, 'genotype', schema);
// }


function addAngleDelta(shape) {
  const { angles } = shape;
  const angleCount = angles.length;

  for (let i = 0; i < 2; i++) {
    const randomAngleIndex = Math.floor(Math.random() * angleCount);
    angles[randomAngleIndex].bendDelta += (Math.random() - 0.5) / 250;
  }

  for (let i = 0; i < angleCount; i++) {
    angles[i].bend += angles[i].bendDelta;
    angles[i].bendDelta *= 0.99;
    angles[i].bend *= 0.99;
  }

  // for (let i = 0; i < 1000; i++) {
  // const randomAngleIndex = Math.floor(Math.random() * angleCount);
  // let neighbourIndex = randomAngleIndex + Math.random() > 0.5 ? -1 : 1;
  // if (neighbourIndex < 0) {
  //   neighbourIndex = angleCount - 1;
  // } else if (neighbourIndex > angleCount) {
  //   neighbourIndex = 0;
  // }
  // const angle = angles[randomAngleIndex];
  // const neighbourAngle = angles[neighbourIndex];
  // angles[randomAngleIndex].bendDelta = neighbourAngle.bendDelta;
  // angles[neighbourIndex].bendDelta = angle.bendDelta;
  // }
}

function renderStaticShapes() {
  state.creature.fenotype.shapes.forEach((shape) => {
    const cyclePosDelta = shape.colorCycleIncrement - 1;
    shape.colorCycleStartPos += cyclePosDelta;

    if (shape.colorCycleStartPos < 0) {
      shape.colorCycleStartPos = shape.colorCycleSteps;
    } else if (shape.colorCycleStartPos > shape.colorCycleSteps) {
      shape.colorCycleStartPos = 0;
    }

    addAngleDelta(shape);
    drawer.shape(
      shape,
      state.dimensions,
      state.translate
    );
  });
}

function renderBoids() {
  state.flies.update((x, y, data) => {
    const boid = state.creature.fenotype.boids[0];
    drawer.shape(boid, state.dimensions, [x, y]);
  });
}

function render() {
  drawer.clear();
  drawer.reset();

  renderStaticShapes();
  renderBoids();
  requestAnimationFrame(render);
}

function onResize() {
}

function main() {
  initPolyfills();
  const $canvas = $('<canvas></canvas>').addClass('drawing');
  $('body').append($canvas);
  [canvas] = $canvas;

  initViewport({ canvas });
  initState();


  $(window).bind('resize', onResize);


  setInterval(initState, 15000);
  render();
}


main();
