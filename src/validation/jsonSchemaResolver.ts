import type { Resolver, FieldErrors } from 'react-hook-form';
import type { JSONSchema7 } from '../types/jsonSchema';
import ru from 'ajv-i18n/localize/ru';
import type { ErrorObject } from 'ajv';
import { createAjv } from './ajvInstance';
import { prepareSchema } from './prepareSchema';

export type FormShape = Record<string, unknown>;

interface RHFFieldError {
  type: string;
  message: string;
  ref?: unknown;
}

/** Самоссылочная структура без циклического type-алиаса */
interface ErrorsTree {
  [key: string]: RHFFieldError | ErrorsTree;
}

const ajv = createAjv();

/** Приоритеты сообщений — больше число = выше приоритет */
const PRIORITY: Record<string, number> = {
  required: 100,
  minLength: 90,
  minItems: 90,
  type: 85,
  format: 80,
  errorMessage: 75, // уточним ниже по вложенным keyword'ам
  pattern: 60,
  maxLength: 50,
  maximum: 50,
  minimum: 50,
  multipleOf: 50,
  enum: 40,
  maxItems: 40,
};

type ErrorMessageParams = {
  errors?: Array<Pick<ErrorObject, 'keyword'>>;
};

function keywordPriority(e: ErrorObject): number {
  if (e.keyword !== 'errorMessage') {
    return PRIORITY[e.keyword] ?? 10;
  }
  // ajv-errors кладёт исходные ошибки в params.errors — посмотрим, что там
  const inner = (e.params as ErrorMessageParams).errors ?? [];
  // если среди них есть minLength/required — поднимаем приоритет
  if (inner.some((er) => er.keyword === 'required')) return PRIORITY.required;
  if (inner.some((er) => er.keyword === 'minLength')) return PRIORITY.minLength;
  if (inner.some((er) => er.keyword === 'type')) return PRIORITY.type;
  if (inner.some((er) => er.keyword === 'format')) return PRIORITY.format;
  if (inner.some((er) => er.keyword === 'pattern')) return PRIORITY.pattern;
  // по умолчанию приоритет для errorMessage средний
  return PRIORITY.errorMessage;
}

function setDeep(
  target: ErrorsTree,
  path: string,
  value: RHFFieldError,
  prio: number,
): void {
  const parts = path ? path.split('.') : [];
  let node: ErrorsTree = target;
  while (parts.length > 1) {
    const key = parts.shift() as string;
    if (!node[key] || typeof node[key] !== 'object') node[key] = {};
    node = node[key] as ErrorsTree;
  }
  const last = parts[0] ?? '';
  const existing = node[last] as RHFFieldError | ErrorsTree | undefined;

  // если там уже лежит сообщение, сравним приоритеты
  if (existing && typeof existing === 'object' && 'type' in existing) {
    const existingType = (existing as RHFFieldError).type;
    const existingPrio = PRIORITY[existingType] ?? 10;
    if (existingPrio >= prio) return; // старое важнее — не перезаписываем
  }
  node[last] = value;
}

function normalizeMessage(e: ErrorObject): string {
  // сообщения, созданные ajv-errors, уже «конечные» — возвращаем как есть
  if (e.keyword === 'errorMessage') {
    return e.message ?? 'Некорректное значение';
  }

  const p = (e.params ?? {}) as Record<string, unknown>;
  switch (e.keyword) {
    case 'required':
      return 'Заполните это поле';
    case 'type':
      return `Ожидается тип: ${String(p.type)}`;
    case 'minLength': {
      const limit = Number(p.limit ?? 0);
      return limit <= 1 ? 'Заполните это поле' : `Минимальная длина: ${limit}`;
    }
    case 'maxLength':
      return `Максимальная длина: ${p.limit as number}`;
    case 'minimum':
      return `Значение должно быть ≥ ${p.limit as number}`;
    case 'maximum':
      return `Значение должно быть ≤ ${p.limit as number}`;
    case 'multipleOf':
      return `Значение должно быть кратно ${(p.multipleOf as number) ?? ''}`;
    case 'enum':
      return 'Выберите одно из допустимых значений';
    case 'format':
      return `Неверный формат: ${String(p.format)}`;
    case 'pattern':
      return 'Значение не соответствует требуемому формату';
    case 'minItems':
      return `Минимум элементов: ${p.limit as number}`;
    case 'maxItems':
      return `Максимум элементов: ${p.limit as number}`;
    default:
      return e.message ?? 'Некорректное значение';
  }
}

function errorPath(e: ErrorObject): string {
  const base = e.instancePath.replace(/^\//, '').replace(/\//g, '.');
  if (e.keyword === 'required') {
    const missing = (e.params as { missingProperty: string }).missingProperty;
    return [base, missing].filter(Boolean).join('.');
  }
  return base;
}

/** Resolver для RHF на базе AJV draft-07 с корректным приоритезированием сообщений */
export function jsonSchemaResolver(schema: JSONSchema7): Resolver<FormShape> {
  const prepared = prepareSchema(
    schema as unknown as import('../types/jsonSchema').JSONSchema7Ext,
  );

  const validate = ajv.compile(prepared);

  return async (values) => {
    const ok = validate(values);
    if (ok) {
      return { values, errors: {} as FieldErrors<FormShape> };
    }

    const allErrors = (validate.errors ?? []).slice();

    // локализуем только НЕ-кастомные, чтобы не перетёреть ajv-errors
    const builtin = allErrors.filter((e) => e.keyword !== 'errorMessage');
    if (builtin.length) ru(builtin as ErrorObject[]);

    // сгруппируем и применим приоритет
    const out: ErrorsTree = {};
    for (const e of allErrors) {
      const path = errorPath(e);
      const prio = keywordPriority(e);
      setDeep(
        out,
        path,
        { type: e.keyword, message: normalizeMessage(e) },
        prio,
      );
    }

    return {
      values: {} as FormShape,
      errors: out as unknown as FieldErrors<FormShape>,
    };
  };
}
