import schema from 'is-my-json-valid';
import { MUTATION_CHANCE, CHROMOSOME_LENGTH } from './const';

import {
  objectToBitStream,
  bitStreamToObject,
  mutate,
} from './binary';

import imagineDrawing from './imagine-drawing';
import { SchemaDrawing } from './schema-drawing';

const schemaDrawing = schema(SchemaDrawing);

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

export function mutateGenotype({ genotype }) {
  if (Math.random() > MUTATION_CHANCE) {
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
