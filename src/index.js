import $ from 'jquery';
import { clone, forOwn, each, filter, sample } from 'lodash';

import initPolyfills from './polyfills';
import createDrawer from './drawer';
import { initViewport } from './shared';
import {
  storeCreature,
  loadRandomCreatures
} from './api';

import {
  generateCreatures,
  mutateGenotype,
  initIndexChildren,
  parentsVerySimilar
} from './creature';

const isTouch = 'ontouchstart' in window;
const DisplayModes = {
  INDEX: 'INDEX',
  ARRAY: 'ARRAY',
  SINGLE: 'SINGLE'
};

const startEvent = isTouch ? 'touchstart' : 'mousedown';

let canvas = null;
let context = null;
let drawer = null;

const state = {
  displayMode: DisplayModes.INDEX,
  parents: null,
  children: null,
  currentChildren: null,
  frozen: false,
  offspringMatrix: [null, null],
  hover: null,
  autosurf: false,
  waitTimeoutId: null,
  autosurfCounter: 0,
  initialCreatures: []
};

function highlightDrawing({ offset, dimensions, fat }) {
  const s = 12;
  context.save();
  context.beginPath();
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'normal';
  context.lineWidth = s;
  context.fillStyle = null;
  context.strokeStyle = fat ? 'rgba(255, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.06)';

  context.rect(
    offset[0] + s / 2,
    offset[1] + s / 2,
    dimensions[0] - s,
    dimensions[1] - s
  );
  context.stroke();
  context.restore();
}

function animationStepDuration() {
  return state.autosurf ? 1500 : 500;
}

function drawCreature({ creature, offset, dimensions }) {
  drawer.draw({
    drawing: creature,
    dimensions,
    translate: offset
  });

  if (creature.phenotype.selected) {
    highlightDrawing({ offset, dimensions, fat: false });
  }
}

function drawCreatures({ children }) {
  const dimensions = [
    canvas.width / state.offspringMatrix[0],
    canvas.height / state.offspringMatrix[1]
  ];
  let creatureIndex = 0;

  for (let y = 0; y < state.offspringMatrix[1]; y++) {
    for (let x = 0; x < state.offspringMatrix[0]; x++) {
      const offset = [x * dimensions[0], y * dimensions[1]];
      const drawing = children[creatureIndex];

      drawCreature({
        creature: drawing,
        drawer,
        dimensions,
        offset
      });

      creatureIndex++;
    }
  }
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
  const easing = state.displayMode === DisplayModes.SINGLE ? 20 : 7;
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

function renderArray() {
  for (let i = 0; i < state.children.length; i++) {
    state.children[i].genotype = mutateGenotype({
      genotype: state.children[i].genotype,
      frozen: state.frozen
    });
  }

  state.currentChildren = transitionTo(state.children, state.currentChildren);
  drawCreatures({
    children: state.currentChildren
  });
}

function renderSingle() {
  drawSingleCreatureLarge({ creature: state.currentChildren[0] });
}

function render() {
  drawer.clear();

  switch (state.displayMode) {
    case DisplayModes.INDEX:
    case DisplayModes.ARRAY:
      renderArray();
      break;

    case DisplayModes.SINGLE:
      renderSingle();
      break;

    default:
  }

  requestAnimationFrame(render);
}

function getChildFromMouse(e) {
  const coordinate = (isTouch) ?
    [e.touches[0].clientX, e.touches[0].clientY]
  :
    [e.clientX, e.clientY];

  const position = [
    parseInt(coordinate[0] / $(window).width() * state.offspringMatrix[0] + 1, 10) - 1,
    parseInt(coordinate[1] / $(window).height() * state.offspringMatrix[1] + 1, 10) - 1
  ];

  const index = position[0] + position[1] * state.offspringMatrix[0];
  return state.children[index];
}

function selectedChildren() {
  const result = [];
  for (let i = 0; i < state.children.length; i++) {
    const child = state.children[i];
    if (child.phenotype.selected) result.push(child);
  }
  return result;
}

function hideAllUnselectedCreatures() {
  each(state.children, (child) => {
    if (!child.phenotype.selected) child.phenotype.visible = false;
  });
}

function getRandomChild() {
  const unSelectedChildren = filter(state.children, child => !child.phenotype.selected);
  return sample(unSelectedChildren);
}

function onClickArrayMode(e) {
  const child = state.autosurf ? getRandomChild() : getChildFromMouse(e);

  if (child.phenotype.selected) {
    child.phenotype.selected = false;
    return;
  }

  child.phenotype.selected = true;
  const newParents = selectedChildren();
  if (newParents.length === 1) {
    state.autosurfCounter = 3;
  }

  if (newParents.length === 2) {
    state.autosurfCounter = 8;
    state.frozen = true;

    setTimeout(() => {
      hideAllUnselectedCreatures();

      setTimeout(() => {
        setTimeout(() => {
          if (parentsVerySimilar({ parents: newParents })) {
            state.displayMode = DisplayModes.SINGLE;
            state.children[0] = newParents[0];
            state.currentChildren[0] = clone(state.children[0]);
            const creature = state.currentChildren[0];
            creature.phenotype.selected = false;
            if (!state.autosurf) storeCreature({ creature });
            state.autosurfCounter = 7;
          } else {
            generateCreatures({ activeParents: newParents, state });
          }
          state.frozen = false;
        }, animationStepDuration());
      }, animationStepDuration());
    }, animationStepDuration());
  }
}

function onClickSingleMode() {
  loadRandomCreatures().then((creatures) => {
    state.initialCreatures = creatures;
    state.autosurfCounter = 4;
    state.currentChildren[0].phenotype.visible = false;
    setTimeout(() => {
      state.displayMode = DisplayModes.INDEX;
      initIndexChildren({ state });
    }, animationStepDuration());
  });
}

function stopAutosurf() {
  state.autosurf = false;
  if (state.waitTimeoutId) {
    clearInterval(state.waitTimeoutId);
  }
}

function setupAutosurfWait() {
  state.waitTimeoutId = setTimeout(() => {
    state.autosurf = true;
  }, 60 * 1000);
}

function onClickChild(e) {
  if (e) {
    e.preventDefault();
    stopAutosurf();
    setupAutosurfWait();
  }
  if (state.frozen) return;

  switch (state.displayMode) {
    case DisplayModes.INDEX:
    case DisplayModes.ARRAY:
      onClickArrayMode(e);
      break;

    case DisplayModes.SINGLE:
      onClickSingleMode();
      break;

    default:
  }
}

function defineViewport() {
  const viewport = initViewport({ canvas });
  const verticalCount = viewport[0] > viewport[1] ? 2 : 3;
  const workHeight = viewport[1] / verticalCount;
  const workWidth = workHeight * 0.8;

  state.offspringMatrix[0] = parseInt(viewport[0] / workWidth + 0.5, 10);
  state.offspringMatrix[1] = verticalCount;
}

function onMouseMove() {
  stopAutosurf();
  setupAutosurfWait();
}

function onResize() {
  defineViewport({ state });
  switch (state.displayMode) {
    case DisplayModes.INDEX:
      initIndexChildren({ state });
      break;

    case DisplayModes.ARRAY:
      generateCreatures({ activeParents: state.parents, state });
      break;

    default:
  }
}

function updateAutosurf() {
  if (!state.autosurf) return;
  if (state.autosurfCounter > 0) {
    state.autosurfCounter--;
    return;
  }

  onClickChild();
}

function run(creatures) {
  state.initialCreatures = creatures;
  initIndexChildren({ state });
  setInterval(updateAutosurf, 1000);
  setupAutosurfWait();

  drawer = createDrawer({ canvas });
  render();
}

function main() {
  initPolyfills();
  const $canvas = $('<canvas></canvas>').addClass('drawing');
  $('body').append($canvas);
  canvas = $canvas[0];

  context = canvas.getContext('2d');

  defineViewport({ state });

  $(window).bind('resize', onResize);
  $canvas.bind(startEvent, onClickChild);
  if (!isTouch) $canvas.bind('mousemove', onMouseMove);

  loadRandomCreatures().then(creatures => run(creatures));
}

main();
