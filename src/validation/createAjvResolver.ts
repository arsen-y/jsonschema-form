import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import ru from 'ajv-i18n/localize/ru';
import type { JSONSchema7 } from 'json-schema';
import type { Resolver, FieldErrors } from 'react-hook-form';
import type { FormShape } from '../components/FormRenderer/FieldRenderer';

interface NestedErrors {
  [key: string]: RHFFieldError | NestedErrors;
}

interface RHFFieldError {
  type: string;
  message: string;
}

/** Утилита для установки вложенной ошибки по пути "a.b.0.c" */
function setPath(
  target: NestedErrors,
  path: string,
  value: RHFFieldError,
): void {
  const parts = path.split('.').filter(Boolean);
  let cur: NestedErrors = target;
  while (parts.length > 1) {
    const key = parts.shift() as string;
    if (
      typeof cur[key] !== 'object' ||
      cur[key] === undefined ||
      cur[key] === null
    ) {
      cur[key] = {};
    }
    cur = cur[key] as NestedErrors;
  }
  const last = parts[0] ?? '';
  cur[last] = value;
}

function instancePathToDot(path: string, missing?: string): string {
  // '/parents/0/name' -> 'parents.0.name'
  const parts = path.split('/').filter(Boolean);
  if (missing) parts.push(missing);
  return parts.join('.');
}

/** Создание AJV с форматами и поддержкой сообщений об ошибках */
function createAjv(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    $data: false,
    useDefaults: false,
    coerceTypes: false, // не скрываем ошибки приведения типов
    messages: true,
    unicodeRegExp: true,
  });
  addFormats(ajv);
  ajvErrors(ajv);
  return ajv;
}

type OnErrors = (errors: ReadonlyArray<ErrorObject> | null) => void;

/** Кастомный resolver поверх AJV */
export function createAjvResolver(
  schema: JSONSchema7,
  opts?: { onErrors?: OnErrors },
): Resolver<FormShape> {
  const ajv = createAjv();
  const validate = ajv.compile(schema);

  return async (values) => {
    const valid = validate(values);
    const rawErrors = (validate.errors ?? []) as ReadonlyArray<ErrorObject>;

    if (!valid && rawErrors.length > 0) {
      ru(rawErrors as ErrorObject[]);
    }

    opts?.onErrors?.(rawErrors.length ? rawErrors : null);

    if (valid) {
      return { values, errors: {} as FieldErrors<FormShape> };
    }

    const formErrors: NestedErrors = {};

    for (const e of rawErrors) {
      const { keyword, instancePath, params, message } = e;

      if (keyword === 'required') {
        const missing = (params as { missingProperty: string }).missingProperty;
        const path = instancePathToDot(instancePath, missing);
        setPath(formErrors, path, {
          type: 'required',
          message: 'Поле обязательно',
        });
        continue;
      }

      if (keyword === 'minLength') {
        const min = (params as { limit: number }).limit;
        const path = instancePathToDot(instancePath);
        setPath(formErrors, path, {
          type: 'minLength',
          message: min === 1 ? 'Введите значение' : `Минимальная длина: ${min}`,
        });
        continue;
      }

      const path = instancePathToDot(instancePath);
      setPath(formErrors, path, {
        type: keyword,
        message: message ?? 'Неверное значение',
      });
    }

    return {
      values: {} as FormShape,
      errors: formErrors as unknown as FieldErrors<FormShape>,
    };
  };
}
