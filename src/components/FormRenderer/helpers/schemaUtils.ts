import type { JSONSchema7 } from 'json-schema';

export const isObjectSchema = (s?: JSONSchema7) =>
  s?.type === 'object' && !!s.properties;
export const isArraySchema = (s?: JSONSchema7) =>
  s?.type === 'array' && !!s.items;
export const isEnumSchema = (s?: JSONSchema7) => Array.isArray(s?.enum);

export function requiredSet(schema?: JSONSchema7) {
  return new Set((schema?.required as string[]) || []);
}

export function childSchemaOfObject(
  schema: JSONSchema7,
  key: string,
): JSONSchema7 | undefined {
  if (schema.type !== 'object' || !schema.properties) return undefined;
  return schema.properties[key] as JSONSchema7 | undefined;
}
