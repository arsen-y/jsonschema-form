import { describe, it, expect } from 'vitest';
import { buildDefaultValues } from './buildDefaultValues';
import type { JSONSchema7 } from '../../../types/jsonSchema';

describe('buildDefaultValues', () => {
  it('возвращает ожидаемые дефолты для object/array/primitive', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        s: { type: 'string' },
        n: { type: 'number' },
        i: { type: 'integer' },
        b: { type: 'boolean' },
        a: { type: 'array', items: { type: 'string' } },
        o: {
          type: 'object',
          properties: { x: { type: 'integer' } },
        },
      },
    };

    const def = buildDefaultValues(schema) as Record<string, unknown>;
    expect(def.s).toBe('');
    expect(def.n).toBeUndefined();
    expect(def.i).toBeUndefined();
    expect(def.b).toBe(false);
    expect(def.a).toEqual([]);
    expect(def.o).toEqual({ x: undefined });
  });

  it('уважает поле default, если оно задано', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        s: { type: 'string', default: 'hi' },
        b: { type: 'boolean', default: true },
      },
    };

    const def = buildDefaultValues(schema) as Record<string, unknown>;
    expect(def.s).toBe('hi');
    expect(def.b).toBe(true);
  });
});
