import $ from 'jquery';
import { forOwn, clone } from 'lodash';

import initPolyfills from './polyfills';
import createDrawer from './drawer';
import { initViewport } from './shared';
import { randomGenotype } from './creature';
import { SchemaDrawing } from './schema-drawing';

let canvas = null;
let drawer = null;

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

const state = {
  creature: randomGenotype()
};

function drawCreature({ creature, offset, dimensions }) {
  drawer.draw({
    fenotype: creature,
    dimensions,
    translate: offset
  });
}

function drawSingleCreatureLarge(creature) {
  const dimensions = [canvas.width, canvas.height];
  const offset = [0, 0]

  drawCreature({
    creature,
    drawer,
    dimensions,
    offset
  });
}

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
//           fenoNode[key][childKey] = vary(
//             fenoNode[key][childKey],
//             childSchemaNode.minimum,
//             childSchemaNode.maximum
//           );
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

function render() {
  drawer.clear();

  // state.transition = transitionTo(state.creature.fenotype, state.transition);
  state.creature.shapes.forEach((shape) => {
    shape.startAngle += 0.0002;
    if (shape.startAngle > 255) {
      shape.startAngle = 0;
    }
  });
  drawSingleCreatureLarge(state.creature);
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

  $(window).bind('resize', onResize);
  drawer = createDrawer({ canvas });
  render();
}

main();
