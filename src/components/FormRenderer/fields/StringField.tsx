import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';
import type { FormShape } from '../FieldRenderer';

interface Props {
  name: string;
  label: string;
  inputType?: React.InputHTMLAttributes<HTMLInputElement>['type'];
}

export default function StringField({
  name,
  label,
  inputType = 'text',
}: Props) {
  const { trigger } = useFormContext<FormShape>();

  return (
    <Controller<FormShape>
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          id={name}
          label={label}
          type={inputType}
          value={(field.value as string) ?? ''}
          onChange={field.onChange}
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
