const ColorSchema = {
  type: 'array',
  required: true,
  items: {
    type: 'integer',
    required: true,
    minimum: 0,
    maximum: 256 * 256 - 1
  },
  minItems: 3,
  maxItems: 3
};

const FractionSchema = {
  type: 'integer',
  required: true,
  minimum: 0,
  maximum: 255
};

const RequiredBool = {
  type: 'boolean',
  required: true
};

const SchemaGradient = {
  additionalProperties: false,
  type: 'object',
  required: true,
  properties: {
    enabled: RequiredBool,
    kind: {
      required: true,
      type: 'integer',
      minimum: 0,
      maximum: 1
      // enum: ['linear', 'radial']
    },
    stops: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          color: ColorSchema,
          position: FractionSchema
        }
      }
    },
    position: {
      type: 'array',
      minItems: 6,
      maxItems: 6,
      items: FractionSchema,
      required: true
    }
  }
};

const angleCount = 256;
const SchemaShape = {
  type: 'object',
  additionalProperties: false,
  properties: {
    angles: {
      type: 'array',
      required: true,
      minItems: angleCount,
      maxItems: angleCount,
      items: {
        type: 'integer',
        minimum: 0,
        maximum: 512 - 1
      }
    },
    // activeAngles: {
    //   type: 'integer',
    //   required: true,
    //   minimum: 0,
    //   maximum: angleCount - 1
    // },
    scale: {
      type: 'integer',
      required: true,
      minimum: 0,
      maximum: 255
    },
    position: {
      type: 'array',
      items: FractionSchema,
      minItems: 2,
      maxItems: 2
    },
    blendingMode: {
      type: 'integer',
      minimum: 0,
      maximum: 7
    },
    isTransparent: RequiredBool,
    opacity: {
      type: 'integer',
      minimum: 0,
      maximum: 255
    },
    colorCycleSteps: {
      type: 'integer',
      required: true,
      minimum: 0,
      maximum: 31
    },
    colorCycleStartPos: {
      type: 'integer',
      required: true,
      minimum: 0,
      maximum: 31
    },
    startAngle: {
      type: 'integer',
      required: true,
      minimum: 0,
      maximum: 255
    },
    color: ColorSchema,
    dotted: RequiredBool,
    solid: RequiredBool,
    lineWidth: {
      type: 'integer',
      required: true,
      minimum: 0,
      maximum: 7
    },
    enabled: RequiredBool,
    gradient: SchemaGradient
  }
};

const SchemaDrawing = {
  type: 'object',
  required: true,
  additionalProperties: false,
  properties: {
    shapes: {
      type: 'array',
      minItems: 24,
      maxItems: 24,
      required: true,
      items: SchemaShape
    }
  }
};

export default SchemaDrawing;
