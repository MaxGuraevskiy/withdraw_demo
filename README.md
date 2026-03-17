## Запуск проекта

1. Установить зависимости:
   `npm install`
2. Запустить dev-сервер:
   `npm run dev`
3. Собрать production-версию:
   `npm run build`

## Тесты

1. Unit/интеграционные (Vitest):
   `npx vitest run`
2. E2E (Playwright):
   `npx playwright test`

Важно: E2E тесты лежат в `tests/e2e` и не запускаются через `vitest`.

## Ключевые решения

1. На действия пользователя отправляются именно HTTP-запросы из задания:
   `POST /v1/withdrawals` и `GET /v1/withdrawals/{id}`.
2. В `mock` режиме ответы перехватываются встроенным fetch-моком, поэтому flow работает одинаково в dev, тестах и production-сборке без реального backend.
3. Zustand store с явными состояниями UI: `idle/loading/success/error`.
4. Защита от двойного submit: повторный submit в `loading` игнорируется.
5. Idempotency: передается `idempotency_key` в body и `Idempotency-Key` в header.
6. Retry после сетевой ошибки без потери введенных данных.
7. Понятная обработка `409` с сообщением для пользователя.
8. Восстановление последней успешной заявки после reload до 5 минут.
9. Безопасность:
   нет `dangerouslySetInnerHTML`;
   access token не хранится в `localStorage`.

## Production-подход к auth

Для production access token должен храниться в `httpOnly + secure + sameSite` cookie с обновлением через backend-поток, а не в клиентском хранилище.

## Ссылка на деплой

https://withdraw-demo.vercel.app/
