import type { JSONSchema7Ext } from '../types/jsonSchema';

type Obj = JSONSchema7Ext & {
  type: 'object';
  properties?: Record<string, JSONSchema7Ext>;
};
type Arr = JSONSchema7Ext & {
  type: 'array';
  items?: JSONSchema7Ext | JSONSchema7Ext[];
};

const PATTERN_STRICT = '^(?=.*\\p{L}).+$'; // обязаны быть буквы
const PATTERN_ALLOW_EMPTY = '^(?:$|(?=.*\\p{L}).+)$'; // пустая строка или буквы
const FORMAT_WHITELIST = new Set(['email', 'uri', 'date', 'time', 'date-time']);

function cloneSchema<T extends JSONSchema7Ext>(s: T): T {
  return JSON.parse(JSON.stringify(s)) as T;
}

function enrichString(node: JSONSchema7Ext): void {
  if (node.type !== 'string') return;

  if (node.pattern) return;
  if (node.enum) return;
  if (node.format && FORMAT_WHITELIST.has(String(node.format))) return;

  const hasMin = typeof node.minLength === 'number' && node.minLength > 0;
  node.pattern = hasMin ? PATTERN_STRICT : PATTERN_ALLOW_EMPTY;

  const em = node.errorMessage;
  if (em == null) {
    node.errorMessage = { pattern: 'Поле должно содержать буквы' };
  } else if (typeof em === 'object' && !('pattern' in em)) {
    (em as Record<string, unknown>).pattern = 'Поле должно содержать буквы';
  }
}

function walk(node: JSONSchema7Ext): void {
  if (!node) return;

  if (node.type === 'string') {
    enrichString(node);
    return;
  }

  if (node.type === 'object') {
    const props = (node as Obj).properties ?? {};
    for (const key of Object.keys(props)) walk(props[key] as JSONSchema7Ext);
    return;
  }

  if (node.type === 'array') {
    const arr = node as Arr;
    if (Array.isArray(arr.items)) {
      arr.items.forEach((it) => walk(it as JSONSchema7Ext));
    } else if (arr.items) {
      walk(arr.items as JSONSchema7Ext);
    }
  }
}

/** Возвращает подготовленную к компиляции схему */
export function prepareSchema<T extends JSONSchema7Ext>(schema: T): T {
  const copy = cloneSchema(schema);
  walk(copy);
  return copy;
}
