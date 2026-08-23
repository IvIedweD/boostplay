# BOOSTPLAY

Интерактивный игровой hub с игрой «Роверы», профилями, общей таблицей
результатов, очками активности, бустерами и админ-панелью.

## Production-архитектура

- React 19 + Vite 8;
- Supabase Auth и PostgreSQL;
- Supabase Edge Function `admin-console`;
- GitHub Pages для frontend;
- текущий Supabase project ref: `cdoplnpqrvlhtramplwl`.

## Локальный запуск

```powershell
Copy-Item .env.example .env.local
# Вставьте актуальный VITE_SUPABASE_PUBLISHABLE_KEY в .env.local
npm ci
npm run dev
```

## Проверка

```powershell
npm run check
```

Команда запускает lint, tests и production build.

## Публикация

Смотрите [README_DEPLOY.md](./README_DEPLOY.md). Полная пошаговая инструкция
GitHub Pages и действия для существующего Supabase описаны рядом с исходным комплектом `BOOSTPLAY-ready`.

## Секреты

Никогда не коммитьте `.env.local`, service-role key, пароль базы, SMTP-пароль
или секретный пароль админ-панели. Значения с префиксом `VITE_` доступны в
браузере и не должны содержать серверные секреты.
