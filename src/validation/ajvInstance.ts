import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

export const createAjv = (): Ajv => {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    $data: true,
    useDefaults: false, // дефолты строим сами
    coerceTypes: false, // не приводим типы автоматически
    unicodeRegExp: true,
  });

  addFormats(ajv);
  ajvErrors(ajv);

  return ajv;
};
