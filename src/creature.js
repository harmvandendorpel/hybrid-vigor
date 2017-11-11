import schema from 'is-my-json-valid';
import { cloneDeep, shuffle } from 'lodash';
import { MUTATION_CHANCE, CHROMOSOME_LENGTH, VERY_SIMILAR } from './const';

import {
  objectToBitStream,
  combineChromosomes,
  bitStreamToObject,
  mutate,
  computeSimilarity
} from './binary';

import imagineDrawing from './imagine-drawing';
import SchemaDrawing from './schema-drawing';

const schemaDrawing = schema(SchemaDrawing);

export function createCreatureFromGenotype(genotype) {
  return {
    genotype,
    phenotype: {
      visible: true,
      hover: false,
      selected: false
    }
  };
}

export function randomGenotype() {
  const lineWidth = Math.round((Math.random() * 6) + 1);
  const result = imagineDrawing({
    bw: false,
    linesOnly: false,
    shapesOnly: false,
    lineWidth,
    dotted: true
  });

  schemaDrawing(result);
  if (schemaDrawing.errors !== null) {
    console.error(schemaDrawing.errors);
    return;
  }

  return result;
}

export function parentsVerySimilar({ parents }) {
  if (!parents || parents.length < 2) {
    throw new Error('Need two parents to compare similarity!');
  }
  const parentBitStreams = parents.map(parent => objectToBitStream(
    parent.genotype,
    SchemaDrawing,
    CHROMOSOME_LENGTH
  ));

  const similarity = computeSimilarity(parentBitStreams, CHROMOSOME_LENGTH);
  return similarity > VERY_SIMILAR;
}

export function mutateGenotype({ genotype, frozen }) {
  if (Math.random() > MUTATION_CHANCE && !frozen) {
    const childBitStream = objectToBitStream(
      genotype,
      SchemaDrawing,
      CHROMOSOME_LENGTH
    );
    mutate(childBitStream, 1, CHROMOSOME_LENGTH);
    return bitStreamToObject(childBitStream, SchemaDrawing);
  }
  return genotype;
}

export function generateGenotype(parentBitStreams) {
  const newChromosome = combineChromosomes(parentBitStreams, CHROMOSOME_LENGTH);
  return bitStreamToObject(newChromosome, SchemaDrawing);
}

export function initIndexChildren({ state }) {
  state.children = generateAllRandomCreatures({
    loadedCreatures: state.initialCreatures,
    offspringMatrix: state.offspringMatrix
  });
  state.currentChildren = cloneDeep(state.children);
}

export function generateCreatures({ activeParents, state }) {
  const creatures = [];
  const parentBitStreams = activeParents.map(parent => objectToBitStream(
    parent.genotype,
    SchemaDrawing,
    CHROMOSOME_LENGTH
  ));

  for (let y = 0; y < state.offspringMatrix[1]; y++) {
    for (let x = 0; x < state.offspringMatrix[0]; x++) {
      creatures.push({
        genotype: generateGenotype(
          parentBitStreams
        ),
        phenotype: {
          visible: true,
          hover: false,
          selected: false
        }
      });
    }
  }

  state.children = creatures;
  state.currentChildren = cloneDeep(state.children);
  state.parents = cloneDeep(activeParents);
  state.newParents = [];
}
