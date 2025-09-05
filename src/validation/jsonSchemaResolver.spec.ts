import { describe, it, expect } from 'vitest';
import { jsonSchemaResolver } from './jsonSchemaResolver';
import type { JSONSchema7, JSONSchema7Ext } from '../types/jsonSchema';
import type { ResolverOptions } from 'react-hook-form';

type FormShape = Record<string, unknown>;

function makeResolverOptions<T extends Record<string, unknown>>(
  names: string[] = [],
): ResolverOptions<T> {
  return {
    criteriaMode: 'firstError',
    names: names as unknown as ResolverOptions<T>['names'],
    fields: {} as ResolverOptions<T>['fields'],
    shouldUseNativeValidation: false,
  };
}

describe('jsonSchemaResolver', () => {
  it('required побеждает по приоритету', async () => {
    const schema: JSONSchema7 = {
      type: 'object',
      required: ['city'],
      properties: {
        city: { type: 'string', minLength: 3 },
      },
    };

    const resolver = jsonSchemaResolver(schema);
    // ВАЖНО: city отсутствует → сработает keyword "required", а не "minLength"
    const result = await resolver(
      {} as FormShape,
      undefined,
      makeResolverOptions<FormShape>(['city']),
    );

    const cityErr = (result.errors as Record<string, { message: string }>).city;
    expect(cityErr.message).toBe('Заполните это поле');
  });

  it('локализует minLength на русский', async () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: { name: { type: 'string', minLength: 4 } },
    };

    const resolver = jsonSchemaResolver(schema);
    const result = await resolver(
      { name: 'abc' } as FormShape,
      undefined,
      makeResolverOptions<FormShape>(['name']),
    );

    const nameErr = (result.errors as Record<string, { message: string }>).name;
    expect(nameErr.message).toContain('Минимальная длина: 4');
  });

  it('уважает кастомные errorMessage (ajv-errors)', async () => {
    const schema = {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          errorMessage: { format: 'Введите корректный e-mail' },
        },
      },
    } as const as unknown as JSONSchema7Ext;

    const resolver = jsonSchemaResolver(schema);
    const result = await resolver(
      { email: 'not-email' } as FormShape,
      undefined,
      makeResolverOptions<FormShape>(['email']),
    );

    const emailErr = (result.errors as Record<string, { message: string }>)
      .email;
    expect(emailErr.message).toBe('Введите корректный e-mail');
  });
});
