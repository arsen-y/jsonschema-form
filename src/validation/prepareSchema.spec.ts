import { describe, it, expect } from 'vitest';
import { prepareSchema } from './prepareSchema';
import type { JSONSchema7Ext } from '../types/jsonSchema';

describe('prepareSchema', () => {
  it('ставит строгий pattern для обязательной строки и мягкий — для необязательной', () => {
    const schema: JSONSchema7Ext = {
      type: 'object',
      properties: {
        req: { type: 'string', minLength: 1 },
        opt: { type: 'string' }, // необязательное поле
      },
    };

    const prepared = prepareSchema(schema);
    const p = prepared.properties as Record<string, JSONSchema7Ext>;

    expect(p.req.pattern).toBe('^(?=.*\\p{L}).+$');
    expect(p.opt.pattern).toBe('^(?:$|(?=.*\\p{L}).+)$');
  });
});
