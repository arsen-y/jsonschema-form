import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiagnosticsPanel from './DiagnosticsPanel';
import type { FieldErrors } from 'react-hook-form';
import type { FormShape } from './FormRenderer/FieldRenderer';

describe('DiagnosticsPanel', () => {
  it('показывает вложенные ошибки в виде списка', () => {
    const errors: FieldErrors<FormShape> = {
      city: { type: 'minLength', message: 'Минимальная длина: 1' },
      parents: {
        '0': {
          age: {
            type: 'minimum',
            message: 'Возраст не может быть отрицательным',
          },
        },
      },
    } as FieldErrors<FormShape>;

    render(<DiagnosticsPanel formErrors={errors} />);

    expect(screen.getByText('Диагностика')).toBeInTheDocument();

    expect(screen.getByText(/city: Минимальная длина: 1/)).toBeInTheDocument();
    expect(
      screen.getByText(/parents\.0\.age: Возраст не может быть отрицательным/),
    ).toBeInTheDocument();
  });
});
