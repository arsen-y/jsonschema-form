import { FormProvider, useForm } from 'react-hook-form';
import type { JSONSchema7 } from '../../types/jsonSchema';
import { Box, Button, Stack, Typography } from '@mui/material';
import FieldRenderer, { type FormShape } from './FieldRenderer';
import DiagnosticsPanel from '../DiagnosticsPanel';
import JsonView from '../JsonView';
import { buildDefaultValues } from './helpers/buildDefaultValues';
import { jsonSchemaResolver } from '../../validation/jsonSchemaResolver';

interface Props {
  schema: JSONSchema7;
}

export default function FormRenderer({ schema }: Props) {
  const resolver = jsonSchemaResolver(schema);

  const methods = useForm<FormShape>({
    defaultValues: buildDefaultValues(schema) as Partial<FormShape>,
    resolver,
    mode: 'onChange',
    reValidateMode: 'onBlur',
    shouldUnregister: false,
  });

  const { handleSubmit, formState, getValues, control, watch } = methods;

  const onSubmit = (data: FormShape) => {
    console.log('Submit', data);
  };

  return (
    <FormProvider {...methods}>
      <Stack spacing={2}>
        <DiagnosticsPanel formErrors={formState.errors} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldRenderer name="" schema={schema} control={control} />

          <Box mt={2} display="flex" gap={1}>
            <Button
              type="submit"
              variant="contained"
              disabled={!formState.isValid}
            >
              Отправить
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => console.log('Current values', getValues())}
            >
              Логи
            </Button>
            {!formState.isValid && (
              <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                Форма содержит ошибки.
              </Typography>
            )}
          </Box>
        </form>

        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Текущее значение формы (live):
          </Typography>
          <JsonView data={watch()} />
        </Box>
      </Stack>
    </FormProvider>
  );
}
