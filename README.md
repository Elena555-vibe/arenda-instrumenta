# Аренда инструмента

Mobile-first PWA для совместного учёта аренды инструмента. Вход отсутствует по утверждённому решению: не публикуйте сервис в интернете без сетевого ограничения доступа.

## Запуск

1. Установите Docker Desktop и создайте `.env` из `.env.example` с сильным паролем PostgreSQL.
2. Укажите `DATABASE_URL=postgres://tool_rental:<пароль>@db:5432/tool_rental`.
3. Выполните `docker compose up --build` и откройте `http://localhost:8080`.

Для production используйте обратный прокси с HTTPS и ограничьте сетевой доступ (VPN, private network или IP allow-list). Не храните `.env` в репозитории. Резервная копия: `docker compose exec db pg_dump -U tool_rental tool_rental > backup.sql`.

## Архитектура

- `apps/web` — React PWA, IndexedDB-очередь и кэш последнего ответа.
- `apps/api` — Fastify API и транзакционные бизнес-операции.
- `apps/api/migrations` — схема PostgreSQL.

Материалы в `sources/` не используются и не изменяются. Доступ без входа — осознанное исключение из исходных требований: любой, кто имеет сетевой доступ к адресу PWA, может читать и менять данные.
