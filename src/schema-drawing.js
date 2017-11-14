const ByteSchema = {
  type: 'integer',
  required: true,
  minimum: 0,
  maximum: 255
};

const ColorSchema = {
  type: 'array',
  required: true,
  items: ByteSchema,
  minItems: 3,
  maxItems: 3
};

const FractionSchema = ByteSchema;

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

export const AngleSchema = {
  angle: {
    type: 'integer',
    required: true,
    minimum: 0,
    maximum: 511
  },
  delta: {
    type: 'integer',
    required: true,
    minimum: 0,
    maximum: 511
  }
};

export const SchemaShape = {
  type: 'object',
  additionalProperties: false,
  properties: {
    angles: {
      type: 'array',
      required: true,
      minItems: angleCount,
      maxItems: angleCount,
      items: {
        type: 'object',
        required: true,
        properties: AngleSchema
      }
    },
    scale: ByteSchema,
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
    opacity: ByteSchema,
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
    startAngle: ByteSchema,
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

export const SchemaDrawing = {
  type: 'object',
  required: true,
  additionalProperties: false,
  properties: {
    shapes: {
      type: 'array',
      minItems: 36,
      maxItems: 36,
      required: true,
      items: SchemaShape
    }
  }
};
