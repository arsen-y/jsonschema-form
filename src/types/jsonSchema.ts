import type { JSONSchema7 as BaseJSONSchema7 } from 'json-schema';
export type { BaseJSONSchema7 as JSONSchema7 };

export type PrimitiveType = 'string' | 'number' | 'integer' | 'boolean';

export interface JSONSchema7Ext extends BaseJSONSchema7 {
  errorMessage?:
    | string
    | {
        [keyword: string]: string | { [prop: string]: string };
      };
  [k: string]: unknown;
}

export type SupportedSchema = JSONSchema7Ext & {
  type: 'object' | 'array' | PrimitiveType;
};
