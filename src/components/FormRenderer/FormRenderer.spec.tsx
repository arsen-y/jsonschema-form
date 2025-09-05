import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, CssBaseline } from '@mui/material';
import FormRenderer from './FormRenderer';
import theme from '../../styles/theme';
import exampleSchema from '../../schemas/example';
import type { JSONSchema7 } from '../../types/jsonSchema';

function renderWithMUI(node: React.ReactElement): void {
  render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {node}
    </ThemeProvider>,
  );
}

describe('FormRenderer (example.schema.json)', () => {
  it('сабмит неактивен на старте и активируется после валидного заполнения', async () => {
    renderWithMUI(<FormRenderer schema={exampleSchema as JSONSchema7} />);
    const user = userEvent.setup();

    // 0) сабмит дизейблен на старте
    const submit = screen.getByRole('button', { name: 'Отправить' });
    expect(submit).toBeDisabled();

    // 1) обязательные поля присутствуют
    const street = await screen.findByLabelText('streetAddress *');
    const city = await screen.findByLabelText('city *');
    const state = await screen.findByLabelText('state *');

    // 2) street: сперва ошибку паттерна, потом валидное значение
    await user.clear(street);
    await user.type(street, '12345');
    await user.tab(); // триггер onBlur -> валидация
    expect(
      await screen.findByText('Поле должно содержать буквы'),
    ).toBeInTheDocument();

    await user.clear(street);
    await user.type(street, 'ул. Ленина, 10');
    await user.tab();

    // 3) city/state валидные
    await user.type(city, 'Москва');
    await user.tab();

    await user.type(state, 'Московская область');
    await user.tab();

    // 4) phones: minItems=1 → добавим элемент и заполним его
    const addPhonesBtn = screen.getByTestId('add-phones');
    await user.click(addPhonesBtn);

    // ждём, пока появится поле элемента массива
    const phoneItem = await screen.findByLabelText('phones[1]', {
      selector: 'input',
    });
    await user.clear(phoneItem);
    await user.type(phoneItem, '79001234567');
    await user.tab();

    // 5) ждём, что сабмит активируется
    await waitFor(
      () => {
        expect(submit).toBeEnabled();
      },
      { timeout: 12000 },
    );
  }, 15000); // таймаут теста
});
