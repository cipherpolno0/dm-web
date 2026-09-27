# ระบบบริหารการสอบนักธรรม–ธรรมศึกษา

Next.js App Router foundation for the examination-management system described in
`PRD.md`, `ARCHITECTURE.md`, and `ERD.md`.

## Prerequisites

- Node.js 22 LTS (or the active project-supported LTS release)
- pnpm 11+
- PostgreSQL only when starting Prisma migrations or database-backed features

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The public home page is
intentionally empty at this foundation stage. The admin route is
`/admin`.

## Quality commands

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm format
```

## Automated tests

Run the complete QA suite with:

```bash
pnpm test:all
```

`test:all` runs the unit suite with Node's coverage report, then runs the
Playwright critical-flow test. Playwright always uses a separate, synthetic
PostgreSQL database. It refuses to start unless `E2E_DATABASE_URL` is set and
its database name contains `test`.

```bash
cp .env.e2e.example .env.e2e
# Export E2E_DATABASE_URL from .env.e2e in your shell, then:
pnpm test:e2e:install # one-time Chromium install
pnpm test:all
```

The E2E runner applies committed Prisma migrations, resets and seeds the test
database, then exercises: school application → field-officer approval/seat
issue → admin publication → public result search. It uses only synthetic data
and never falls back to `DATABASE_URL` or a production database.

## Result notifications and reports

Set `RESEND_API_KEY`, `RESULT_NOTIFICATION_FROM`, `INNGEST_EVENT_KEY`, and
`INNGEST_SIGNING_KEY` in the deployed environment. Configure Inngest to serve
`/api/inngest`; publishing results writes idempotent notification jobs in the
same database transaction and queues delivery after the response. Failed email
jobs retry on the 10-minute scheduled function with bounded exponential
backoff (five attempts). A school must have `notificationEmail` configured in
Master Data to receive a message.

The protected dashboard is `/dashboard`. The passed-candidate report endpoint
is `/api/reports/passed?format=xlsx` or `format=pdf`; server-side role scope
is applied regardless of query parameters.

`pnpm build` runs the production build; it does not need a database connection
until code imports Prisma or uses `DATABASE_URL` at build time.

## Git hooks

After `pnpm install`, Husky activates `.husky/pre-commit`. Before every commit
it runs `lint-staged` (ESLint and Prettier on staged files) followed by the full
strict TypeScript check. Do not bypass the hook with `--no-verify`.

## Folder structure

```text
app/
├─ (public)/             # public pages; route groups do not alter URLs
├─ (admin)/admin/        # protected back-office pages (authorization to add)
├─ globals.css
└─ layout.tsx
components/
└─ ui/                   # reusable design-system primitives
lib/
├─ authorization/        # server authorization boundary
├─ db/                   # Prisma/database access boundary
└─ validation/           # server validation schemas
prisma/
└─ schema.prisma         # schema and future reviewed migrations
.husky/
└─ pre-commit            # lint-staged + strict type-check
```

## Conventions

- TypeScript strict mode is mandatory; do not suppress errors with broad casts
  or disable compiler checks.
- Keep domain/business logic in `lib`, not React components.
- Keep protected database access on the server. A future authorization helper
  must validate actor, action, resource, and scope before a transaction.
- Add Prisma schema changes through reviewed migrations; do not modify the
  production schema manually.
- Never commit `.env.local`, access tokens, passwords, or real applicant data.
