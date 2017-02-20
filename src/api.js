import $ from 'jquery';

import {
  pojoToBase64,
  base64ToPojo
} from './binary';

import SchemaDrawing from './schema-drawing';
import { CHROMOSOME_LENGTH } from './const';

export function storeCreature({ creature }) {
  const chromosome = pojoToBase64(creature.genotype, SchemaDrawing, CHROMOSOME_LENGTH);

  return new Promise((resolve) => {
    $.ajax({
      url: '/api/creature',
      data: { chromosome },
      type: 'POST',
      dataType: 'JSON',
      contentType: 'application/x-www-form-urlencoded',
      success: resolve
    });
  });
}

export function loadRandomCreatures() {
  return new Promise((resolve) => {
    $.getJSON('/api/creatures', (creatures) => {
      resolve(creatures.map(creature =>
        base64ToPojo(creature.chromosome, SchemaDrawing)
      ));
    });
  });
}
