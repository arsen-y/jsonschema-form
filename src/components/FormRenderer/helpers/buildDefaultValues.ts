import type { JSONSchema7 } from '../../../types/jsonSchema';

export function buildDefaultValues(schema: JSONSchema7): unknown {
  if (!schema) return undefined;
  if ('default' in schema) return (schema as { default?: unknown }).default;

  switch (schema.type) {
    case 'object': {
      const obj: Record<string, unknown> = {};
      const props = schema.properties ?? {};
      Object.entries(props).forEach(([key, sub]) => {
        obj[key] = buildDefaultValues(sub as JSONSchema7);
      });
      return obj;
    }
    case 'array': {
      const items = schema.items as JSONSchema7 | JSONSchema7[] | undefined;
      if (!items) return [];
      return [];
    }
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return undefined;
    case 'boolean':
      return false;
    default:
      return undefined;
  }
}
