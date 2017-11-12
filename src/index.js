import $ from 'jquery';
import { forOwn } from 'lodash';

import initPolyfills from './polyfills';
import createDrawer from './drawer';
import { initViewport } from './shared';
import {
  createCreatureFromGenotype,
  randomGenotype
} from './creature';

let canvas = null;
let drawer = null;

const state = {
  creature: createCreatureFromGenotype(randomGenotype())
};

function drawCreature({ creature, offset, dimensions }) {
  drawer.draw({
    drawing: creature,
    dimensions,
    translate: offset
  });
}

function drawSingleCreatureLarge({ creature }) {
  const portrait = canvas.height > canvas.width;
  const dimensions = portrait ?
    [
      canvas.width,
      canvas.width / 0.8
    ] :
    [
      canvas.height * 0.8,
      canvas.height
    ];

  const offset = portrait ?
    [
      0,
      (canvas.height - canvas.width / 0.8) / 2
    ]
    :
    [
      (canvas.width - canvas.height * 0.8) / 2,
      0
    ];

  drawCreature({
    creature,
    drawer,
    dimensions,
    offset
  });
}

function transitionTo(target, current) {
  const easing = 20;
  function processNode(targetNode, currentNode) {
    switch (typeof targetNode) {
      case 'number':
        return currentNode + (targetNode - currentNode) / easing;

      case 'object':
        let result = null;
        if (targetNode.constructor === Array) {
          result = [];
        } else {
          result = {};
        }

        forOwn(currentNode, (property, key) => {
          result[key] = processNode(targetNode[key], currentNode[key]);
        });
        return result;

      case 'boolean':
        return targetNode;

      default:
    }
  }

  return processNode(target, current);
}

function render() {
  drawer.clear();

  drawSingleCreatureLarge({ creature: state.creature });
  //requestAnimationFrame(render);
  setTimeout(render, 100);
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
