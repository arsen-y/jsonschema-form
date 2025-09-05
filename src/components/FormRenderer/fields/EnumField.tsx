import { Controller, useFormContext } from 'react-hook-form';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
} from '@mui/material';
import type { FormShape } from '../FieldRenderer';

interface Props {
  name: string;
  label: string;
  options: ReadonlyArray<string | number>;
}

export default function EnumField({ name, label, options }: Props) {
  const { trigger } = useFormContext<FormShape>();

  return (
    <Controller<FormShape>
      name={name}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error}>
          <InputLabel>{label}</InputLabel>
          <Select
            label={label}
            value={(field.value as string | number | '') ?? ''}
            onChange={field.onChange}
            onBlur={() => {
              field.onBlur();
              void trigger(name);
            }}
            inputProps={{
              'aria-invalid': fieldState.error ? 'true' : 'false',
            }}
          >
            {options.map((o) => (
              <MenuItem key={String(o)} value={o}>
                {String(o)}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fieldState.error?.message || ' '}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
