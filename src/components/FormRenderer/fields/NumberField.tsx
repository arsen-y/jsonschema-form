import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';
import type { FormShape } from '../FieldRenderer';

export default function NumberField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  const { trigger } = useFormContext<FormShape>();

  return (
    <Controller<FormShape>
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          id={name}
          label={label}
          type="number"
          value={field.value ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            const parsed = v === '' ? undefined : Number(v);
            field.onChange(parsed);
          }}
          onBlur={() => {
            field.onBlur();
            void trigger(name);
          }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? ' '}
          slotProps={{
            input: {
              inputRef: field.ref,
              inputProps: {
                step: 'any',
                'aria-invalid': fieldState.error ? 'true' : 'false',
              },
            },
          }}
          fullWidth
        />
      )}
    />
  );
}
