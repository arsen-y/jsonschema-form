# JSON‑Schema Form Builder

Генератор форм на React + TypeScript, который **строит UI на лету по JSON Schema draft‑07** и **валидирует те же данные той же схемой** через [Ajv]. Управление состоянием — через [react-hook-form] (RHF) с кастомным `resolver` и русской локализацией ошибок.

> ⚙️ Текущий стек: **React 19**, **TypeScript 5.9**, **Vite 7**, **MUI 7**, **Ajv 8**, **Vitest 3**.

---

## Содержание

- [Возможности](#возможности)
- [Как это работает](#как-это-работает)
  - [Предобработка схемы (`prepareSchema`)](#предобработка-схемы-prepareschema)
  - [Валидация и приоритеты ошибок (`jsonSchemaResolver`)](#валидация-и-приоритеты-ошибок-jsonschemaresolver)
  - [Рендер полей](#рендер-полей)
  - [UX/Доступность](#uxдоступность)
  - [Ограничения](#ограничения)
- [Быстрый старт](#быстрый-старт)
- [Скрипты](#скрипты)
- [Структура проекта](#структура-проекта)
- [Как подключить свою схему](#как-подключить-свою-схему)
- [Поддерживаемые ключевые слова JSON Schema](#поддерживаемые-ключевые-слова-json-schema)
- [Тестирование](#тестирование)
- [Линт и форматирование](#линт-и-форматирование)
- [Диагностика и отладка](#диагностика-и-отладка)
- [FAQ](#faq)

---

## Возможности

- 🧱 Построение форм из **JSON Schema draft‑07** любой вложенности: `object`, `array`, примитивы (`string`, `integer`, `number`, `boolean`) и `enum`.
- ✅ Валидация **той же схемой** на клиенте (Ajv) + локализация сообщений на русский.
- 🧠 Умный приоритет ошибок: `required` перекрывает `minLength`, и т. п. — пользователю показывается **самое релевантное** сообщение.
- 🧩 Поддержка типовых ограничений: `min/maxLength`, `minimum/maximum`, `multipleOf`, `min/maxItems`, `uniqueItems`, `enum`, `format` (`email`, `uri`, `date`, `time`, `date-time`).  
- ✍️ Кастомные сообщения через `errorMessage` (плагин **ajv-errors**) **сохраняются** и не перетираются локализацией.
- 📦 Массивы с кнопками **Добавить/Удалить**, соблюдение `minItems`/`maxItems`, запрет удаления ниже минимума.
- 🧰 Объекты: для **необязательных** (не входящих в `required`) вложенных объектов добавляется кнопка «Добавить ...» — ленивая инициализация формы без «мусора».
- 🖥️ **Живой JSON** текущего состояния формы (виджет снизу страницы).
- 🩺 Панель **Диагностика**: сводка ошибок формы + вывод внутренних ошибок валидатора/схемы.
- ♿ A11y: поля получают `aria-invalid`, ошибки видны в `helperText`.
- 🧪 Тесты (Vitest + Testing Library) покрывают рендер по схеме, массивы/вложенность и основные правила валидации.

---

## Как это работает

### Предобработка схемы (`prepareSchema`)

Перед компиляцией Ajv схема пропускается через шаг обогащения:

- Для всех **строковых** полей без `pattern`/`enum` и без «безопасного» `format` (email/uri/date/time/date-time) добавляется регулярка:

  - **Обязательные строки** (имеют `minLength > 0`): `^(?=.*\p{L}).+$` — значение **должно содержать буквы** (Unicode).
  - **Необязательные строки**: `^(?:$|(?=.*\p{L}).+)$` — пустая строка **или** строка с буквами.

- Если у поля уже есть `pattern`/`enum`/поддерживаемый `format`, оно **не трогается**.
- Для таких добавленных правил выставляется понятное сообщение `Поле должно содержать буквы` (через `errorMessage.pattern`), если своё не задано.

Это обеспечивает базовую содержательность текстовых полей «из коробки».

### Валидация и приоритеты ошибок (`jsonSchemaResolver`)

Используется кастомный `resolver` для RHF поверх Ajv:

- Собираем **все ошибки** (`allErrors: true`) и локализуем их через `ajv-i18n/localize/ru`.
- Сообщения, созданные `ajv-errors`, **не перетираются**.
- Ошибки сводятся в древовидную структуру RHF (`FieldErrors`) с путями вида `parents.0.age`.
- Вводится **система приоритетов** (чем выше — тем важнее):  
  `required (100) > minLength/minItems (90) > type (85) > format (80) > pattern (60) > ...`  
  Вложенные `errorMessage` (из ajv-errors) анализируются, чтобы, например, `required` внутри них не терялся.
- Нормализуем тексты: для `minLength: 1` показываем «Заполните это поле», а не сухое «Минимальная длина: 1».

### Рендер полей

- **object** — рендерятся поля из `properties`. Для необязательных вложенных объектов показывается кнопка «Добавить &lt;имя&gt;» (ленивая инициализация значений через `buildDefaultValues`).  
- **array** — `useFieldArray` из RHF, соблюдение `minItems`/`maxItems`, `uniqueItems` валидируется Ajv. Для примитивных `items` стартовым значением служит пустая строка `""` (чтобы Ajv не ругался на `type`).  
- **enum** — `Select` (`@mui/material`) с вариантами из `enum`.  
- **string/number/integer/boolean** — текстовые поля и чекбоксы MUI.  
  - `string` с `format: email|uri` получает HTML `type="email|url"`.
  - `integer` принудительно парсится через `parseInt`, `number` — через `Number`, пустая строка превращается в `undefined`, чтобы не нарушать типы.

### UX/Доступность

- Валидация в режиме `onChange` (быстрая обратная связь), подтверждается `onBlur`.
- Кнопка **Отправить** неактивна, пока форма **невалидна**.
- Поле ошибки — в `helperText`, `aria-invalid="true"` для ассистивных технологий.
- Панель **Диагностика** показывает свернутый список ошибок вида:
  ```
  • city: Укажите город
  • parents.0.age: Возраст не может быть отрицательным
  ```

### Ограничения

По условиям задания и текущей реализации **не поддерживаются**: `anyOf`, `oneOf`, `allOf`, `if/then/else`, `$ref`‑резолвинг и динамические схемы. Схема должна соответствовать draft‑07.

---

## Быстрый старт

```bash
# требования: Node.js 18+ (рекомендуется 20+), npm 9+
npm i
npm run dev
# откройте http://localhost:5173
```

### Production

```bash
npm run build
npm run preview
```

---

## Скрипты

- `dev` — запуск Vite dev-сервера
- `build` — `tsc -b` + `vite build`
- `preview` — предварительный просмотр сборки
- `test`, `test:watch` — Vitest + Testing Library
- `lint` — ESLint
- `format` — Prettier для `ts/tsx/js/json/md`

---

## Структура проекта

```text
.
├─ src/
│  ├─ app/
│  │  └─ App.tsx
│  ├─ components/
│  │  ├─ DiagnosticsPanel.tsx
│  │  ├─ JsonView.tsx
│  │  └─ FormRenderer/
│  │     ├─ FieldRenderer.tsx
│  │     ├─ helpers/
│  │     │  ├─ buildDefaultValues.ts
│  │     │  └─ schemaUtils.ts
│  │     └─ fields/
│  │        ├─ BooleanField.tsx
│  │        ├─ EnumField.tsx
│  │        ├─ IntegerField.tsx
│  │        ├─ NumberField.tsx
│  │        └─ StringField.tsx
│  ├─ schemas/
│  │  ├─ example.schema.json
│  │  └─ example.ts
│  ├─ styles/
│  │  └─ theme.ts
│  ├─ types/
│  │  └─ jsonSchema.ts
│  └─ validation/
│     ├─ ajvInstance.ts
│     ├─ createAjv.ts
│     ├─ createAjvResolver.ts
│     ├─ jsonSchemaResolver.ts
│     └─ prepareSchema.ts
├─ tests/ (если выносите тесты отдельно)
├─ index.html
├─ tsconfig.json
├─ vite.config.ts
└─ package.json
```

> Примечание: названия путей соответствуют предоставленному коду; при необходимости переименуйте под свой стиль.

---

## Как подключить свою схему

1. Скопируйте свою схему в `src/schemas/your.schema.json` (draft‑07).
2. Импортируйте её в `src/schemas/your.ts`:
   ```ts
   import type { JSONSchema7 } from 'json-schema';
   import raw from './your.schema.json';
   export default raw as unknown as JSONSchema7;
   ```
3. Подключите в `App.tsx` вместо примера:
   ```ts
   import yourSchema from './schemas/your';
   // ...
   <FormRenderer schema={yourSchema} />
   ```

### Советы по схемам

- Для строк, которые **обязательны**, задайте `minLength: 1` — тогда появится строгий `pattern` (требование букв).
- Если нужна другая логика валидности строк — задайте свой `pattern` или `format` (`email`, `uri`, `date`, `time`, `date-time`), предобработка его **не затронет**.
- Используйте `errorMessage` из ajv-errors для уточнения формулировок:
  ```json
  {
    "type": "string",
    "format": "email",
    "errorMessage": { "format": "Введите корректный e‑mail" }
  }
  ```
- Для массивов указывайте `minItems`, `maxItems`, `uniqueItems` — все поддерживается.
- Для чисел: `integer` (целое) и `number` (вещественное), вместе с `minimum/maximum/multipleOf`.

---

## Поддерживаемые ключевые слова JSON Schema

- Типы: `object`, `array`, `string`, `number`, `integer`, `boolean`, `enum`
- Ограничения:
  - `minLength`, `maxLength`, `pattern`
  - `minimum`, `maximum`, `multipleOf`
  - `minItems`, `maxItems`, `uniqueItems`
  - `required`, `additionalProperties`
  - `format` (`email`, `uri`, `date`, `time`, `date-time`)
- Пользовательские сообщения: `errorMessage` (ajv-errors)

> Не поддерживаются: `anyOf`, `oneOf`, `allOf`, `if/then/else`, `$ref` (см. раздел Ограничения).

---

## Тестирование

Запуск тестов:

```bash
npm run test       # разовый прогон
npm run test:watch # режим наблюдения
```

Покрываемое поведение (из коробки):

- обязательные поля блокируют отправку;
- `phones` соблюдает `minItems: 1` и `maxItems: 3`;
- массив `parents` рендерит вложенные объекты и валидирует их;
- числовые/строковые ограничения подсвечивают ошибки;
- локализация ошибок на русский и кастомные `errorMessage` уважаются.

---

## Линт и форматирование

```bash
npm run lint     # ESLint
npm run format   # Prettier для ts/tsx/js/json/md
```

---

## Диагностика и отладка

- **DiagnosticsPanel** покажет:
  - внутренние ошибки Ajv/схемы (например, если schema некорректна);
  - плоский список ошибок формы с путями (`parents.0.age: ...`).  
- **JsonView** внизу страницы отображает live‑значение формы (удобно для интеграции с API).

---

## FAQ

**Почему пустые массивы, даже если `minItems > 0`?**  
Стартуем с `[]`, чтобы не спамить UI пустыми «болванками». Ограничение соблюдается при валидации, а пользователь добавляет элементы осознанно.

**Чем отличаются `number` и `integer` в UI?**  
`integer` парсится как целое (`parseInt`), `number` — как число с плавающей точкой (`Number`). Пустое значение превращается в `undefined` (не нарушает `type`).

**Можно ли использовать свой валидатор/локализацию?**  
Да. Посмотрите `src/validation/jsonSchemaResolver.ts` и `ajvInstance.ts` — вы можете заменить логику приоритета или локализации.

**Какая версия React?**  
Согласно `package.json` — React `^19.1.1`. Если вы хотите React 18, зафиксируйте зависимости и типы на 18‑й ветке.

---

## Лицензия

MIT

---

[Ajv]: https://ajv.js.org/
[react-hook-form]: https://react-hook-form.com/