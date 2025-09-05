import { Controller } from 'react-hook-form';
import { Checkbox, FormControlLabel } from '@mui/material';
import type { FormShape } from '../FieldRenderer';

export default function BooleanField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <Controller<FormShape>
      name={name}
      render={({ field, fieldState }) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!field.value}
              onChange={(_, v) => field.onChange(v)}
              slotProps={{
                input: {
                  'aria-invalid': fieldState?.error ? 'true' : 'false',
                  ref: field.ref,
                },
              }}
            />
          }
          label={label}
        />
      )}
    />
  );
}
