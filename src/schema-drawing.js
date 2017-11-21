const angleCount = 256;
const maxInteger = maximum => ({
  type: 'integer',
  minimum: 0,
  maximum
});

const ByteSchema = {
  type: 'integer',
  required: true,
  minimum: 0,
  maximum: 255
};

const fixedLengthArray = (count, items) => ({
  type: 'array',
  minItems: count,
  maxItems: count,
  required: true,
  items
});

const ColorSchema = fixedLengthArray(3, ByteSchema);

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
    kind: maxInteger(1),
    stops: fixedLengthArray(2, {
      type: 'object',
      additionalProperties: false,
      properties: {
        color: ColorSchema,
        position: FractionSchema
      }
    }),
    position: fixedLengthArray(6, FractionSchema)
  }
};

export const AngleSchema = {
  angle: maxInteger(511),
  bend: maxInteger(511),
  bendDelta: maxInteger(511)
};

export const SchemaShape = {
  type: 'object',
  additionalProperties: false,
  properties: {
    angles: fixedLengthArray(angleCount, {
      type: 'object',
      required: true,
      properties: AngleSchema
    }),
    scale: ByteSchema,
    position: fixedLengthArray(2, FractionSchema),
    blendingMode: maxInteger(7),
    isTransparent: RequiredBool,
    opacity: ByteSchema,
    colorCycleSteps: maxInteger(31),
    colorCycleStartPos: maxInteger(31),
    colorCycleIncrement: maxInteger(31),
    startAngle: ByteSchema,
    color: ColorSchema,
    dotted: RequiredBool,
    solid: RequiredBool,
    lineWidth: maxInteger(7),
    enabled: RequiredBool,
    gradient: SchemaGradient
  }
};

export const SchemaDrawing = {
  type: 'object',
  required: true,
  additionalProperties: false,
  properties: {
    shapes: fixedLengthArray(24, SchemaShape),
    boids: fixedLengthArray(1, SchemaShape)
  }
};
