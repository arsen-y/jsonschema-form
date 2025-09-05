import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import NumberField from './NumberField';
import theme from '../../../styles/theme';

type Shape = { n?: number };

function NumberForm({ defaultValues }: { defaultValues?: Partial<Shape> }) {
  const methods = useForm<Shape>({ defaultValues: defaultValues ?? {} });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FormProvider {...methods}>
        <NumberField name="n" label="n" />
      </FormProvider>
    </ThemeProvider>
  );
}

describe('NumberField', () => {
  it('показывает "" при undefined и парсит десятичные', async () => {
    render(<NumberForm />);
    const user = userEvent.setup();

    const input = screen.getByLabelText('n', {
      selector: 'input',
    }) as HTMLInputElement;

    expect(input.value).toBe(''); // undefined -> ''
    await user.type(input, '12.34');
    expect(input.value).toBe('12.34'); // DOM value — строка

    await user.clear(input);
    expect(input.value).toBe('');
  });
});
