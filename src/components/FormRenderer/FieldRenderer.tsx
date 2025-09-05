import { Typography, Box, Button, Stack } from '@mui/material';
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';
import type { JSONSchema7 } from '../../types/jsonSchema';
import {
  isArraySchema,
  isEnumSchema,
  isObjectSchema,
  requiredSet,
} from './helpers/schemaUtils';
import StringField from './fields/StringField';
import NumberField from './fields/NumberField';
import IntegerField from './fields/IntegerField';
import BooleanField from './fields/BooleanField';
import EnumField from './fields/EnumField';
import { buildDefaultValues } from './helpers/buildDefaultValues';

export type FormShape = Record<string, unknown>;

interface BaseProps {
  name: string;
  schema: JSONSchema7;
  label?: string;
}
interface Props extends BaseProps {
  control?: Control<FormShape>;
}

export default function FieldRenderer({
  name,
  schema,
  label,
  control: controlProp,
}: Props) {
  const ctx = useFormContext<FormShape>();
  const control = controlProp ?? ctx?.control;

  if (!control) {
    return (
      <Typography color="error">
        FieldRenderer должен быть дочерним элементом FormProvider или получать
        проп <code>control</code>.
      </Typography>
    );
  }

  if (isObjectSchema(schema)) {
    return (
      <ObjectField
        name={name}
        schema={schema}
        label={label}
        control={control}
      />
    );
  }

  if (isArraySchema(schema)) {
    return (
      <ArrayField name={name} schema={schema} label={label} control={control} />
    );
  }

  if (isEnumSchema(schema)) {
    return (
      <EnumField
        name={name}
        label={label ?? name}
        options={(schema.enum as ReadonlyArray<string | number>) ?? []}
      />
    );
  }

  switch (schema.type) {
    case 'string': {
      const inputType =
        schema.format === 'email'
          ? 'email'
          : schema.format === 'uri'
            ? 'url'
            : 'text';
      return (
        <StringField name={name} label={label ?? name} inputType={inputType} />
      );
    }
    case 'number':
      return <NumberField name={name} label={label ?? name} />;
    case 'integer':
      return <IntegerField name={name} label={label ?? name} />;
    case 'boolean':
      return <BooleanField name={name} label={label ?? name} />;
    default:
      return (
        <Typography color="error">
          Неподдерживаемый тип: {String(schema.type)}
        </Typography>
      );
  }
}

function ObjectField({
  name,
  schema,
  label,
  control,
}: Required<Pick<Props, 'control'>> & BaseProps) {
  const { setValue } = useFormContext<FormShape>();

  const parentValue = useWatch({
    control,
    name: (name || undefined) as never,
  }) as Record<string, unknown> | undefined;

  const req = requiredSet(schema);
  const entries = Object.entries(schema.properties ?? {});

  return (
    <Box borderLeft={1} borderColor="#eee" pl={2} ml={0.5} mt={2}>
      {label && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}{' '}
          {schema.description && (
            <Typography variant="caption">— {schema.description}</Typography>
          )}
        </Typography>
      )}

      <Stack spacing={2}>
        {entries.map(([key, sub]) => {
          const subSchema = sub as JSONSchema7;
          const path = name ? `${name}.${key}` : key;
          const isReq = req.has(key);

          if (isObjectSchema(subSchema) && !isReq) {
            const current = parentValue?.[key];
            if (current == null) {
              return (
                <Box key={key}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const def = buildDefaultValues(subSchema);
                      setValue(path as never, def as never, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    data-testid={`add-${path.replace(/\W+/g, '-')}`}
                    type="button"
                  >
                    Добавить {key}
                  </Button>
                </Box>
              );
            }
          }

          return (
            <Box key={key}>
              <FieldRenderer
                name={path}
                schema={subSchema}
                label={`${key}${isReq ? ' *' : ''}`}
                control={control}
              />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function ArrayField({
  name,
  schema,
  label,
  control,
}: Required<Pick<Props, 'control'>> & BaseProps) {
  const fieldArrayName = name && name.length > 0 ? name : 'items';

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldArrayName as never,
  });

  const itemsSchema = (schema.items || {}) as JSONSchema7;

  const max = schema.maxItems != null ? Number(schema.maxItems) : undefined;
  const min = schema.minItems != null ? Number(schema.minItems) : undefined;

  const watchedRaw = useWatch({
    control,
    name: fieldArrayName as never,
  }) as unknown;
  const length = Array.isArray(watchedRaw) ? watchedRaw.length : fields.length;

  const canAdd = !(max != null && length >= max);
  const canRemove = (idx: number) =>
    min == null ? true : length - 1 >= min || idx === length - 1;

  // Нейтральное значение для примитивных items, чтобы AJV не ругался
  const createDefaultItem = () => {
    if (itemsSchema.type === 'string' && !('default' in itemsSchema)) return '';
    return buildDefaultValues(itemsSchema) as unknown;
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      {fields.map((f, idx) => (
        <Box
          key={f.id}
          display="flex"
          gap={1}
          alignItems="flex-start"
          sx={{ mb: 1 }}
        >
          <Box flex={1}>
            <FieldRenderer
              name={`${fieldArrayName}.${idx}`}
              schema={itemsSchema}
              label={`${fieldArrayName}[${idx + 1}]`}
              control={control}
            />
          </Box>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              remove(idx);
            }}
            disabled={!canRemove(idx)}
          >
            Удалить
          </Button>
        </Box>
      ))}

      <Button
        variant="outlined"
        onClick={() => {
          if (!canAdd) return;
          const def = createDefaultItem();
          append(def as never, { shouldFocus: false });
        }}
        disabled={!canAdd}
        aria-label={`add-${fieldArrayName}`}
        data-testid={`add-${fieldArrayName.replace(/\W+/g, '-')}`}
        type="button"
      >
        Добавить
      </Button>
      <Typography variant="caption" sx={{ ml: 1 }}>
        {schema.minItems != null && `minItems: ${schema.minItems}`}{' '}
        {schema.maxItems != null && `maxItems: ${schema.maxItems}`}
      </Typography>
    </Box>
  );
}
