# Production deployment and rollback

This project deploys from the protected `main` branch to Vercel. Pull requests
must pass `.github/workflows/ci.yml` before merge. A push to `main` starts
`.github/workflows/deploy-production.yml`, which applies reviewed Prisma
migrations and deploys the prebuilt Vercel output.

## One-time production setup

1. Create GitHub Environment **`production`** and require an approver before a
   workflow can access it.
2. Protect `main`: require the **Continuous Integration** check, require pull
   requests, and prohibit force pushes/direct pushes.
3. Configure the runtime variables in Vercel Production. Use `.env.example` as
   the complete key list; do not create `.env` files in the repository.
   Disable Vercel's Git-triggered production deployment for this project; this
   repository uses the GitHub Actions workflow as its single deployment path.
4. Add these encrypted GitHub Environment secrets under `production`:

   | Secret                    | Use                                                |
   | ------------------------- | -------------------------------------------------- |
   | `VERCEL_TOKEN`            | Vercel CLI authentication                          |
   | `VERCEL_ORG_ID`           | Selects the Vercel team/account                    |
   | `VERCEL_PROJECT_ID`       | Selects this Vercel project                        |
   | `PRODUCTION_DATABASE_URL` | Server-only Prisma connection for `migrate deploy` |

   `PRODUCTION_DATABASE_URL` and Vercel's `DATABASE_URL` must be the same
   production database (using the correct pooled/direct connection form for
   each provider). Rotate both references together.

5. Confirm production database backups and point-in-time recovery are enabled
   before the first deployment. Verify a restore in a separate environment.

## Deployment flow

1. Open a pull request. CI uses an ephemeral PostgreSQL service and synthetic
   test data; it runs Prisma validation, lint, strict type-check, the full test
   suite, and a production build. No production secret is available to this job.
2. After review, merge to `main`. The protected production environment pauses
   the deploy job for approval.
3. The deploy job rejects newly merged migrations containing `DROP TABLE`,
   `DROP COLUMN`, `TRUNCATE TABLE`, or `DELETE FROM`.
4. It runs `prisma migrate deploy`, verifies `prisma migrate status`, retrieves
   Vercel's production build configuration, builds, and uploads the prebuilt
   output as the production deployment. The workflow then checks the public
   landing page.
5. Smoke-test `/login` and an authorized admin route manually. Check Vercel logs,
   Sentry (when configured), and Inngest job health. Do not log applicant data,
   passwords, tokens, or connection strings while diagnosing issues.

## Rollback application code

Do not force-push or rewrite `main`.

1. Pause result publishing/import work if the fault affects data integrity.
2. Identify the last known-good commit or release in GitHub/Vercel.
3. Revert the faulty merge commit and open a short rollback pull request:

   ```bash
   git revert <bad-merge-commit>
   git push origin HEAD
   ```

4. Merge it after the same CI checks. The production workflow deploys the
   reverted revision automatically.
5. Re-run the smoke tests and record the incident, affected publication IDs,
   and any cache invalidation or notification follow-up needed.

## Database rollback policy

Prisma migrations are **forward-only** in production. Never use `prisma db
push`, `prisma migrate reset`, a restore over the live database, or a manually
edited migration to undo a failed release.

- If the application rollback is compatible with the new schema, revert only
  the application as above.
- If a data/schema correction is required, create a reviewed forward migration
  or a guarded repair script, test it on staging/synthetic data, and deploy it
  through the same approval gate.
- A destructive schema change requires a separately approved maintenance plan:
  backup/PITR confirmation, tested restore, compatibility release first,
  explicit downtime decision, and an owner for data validation.

## Emergency stop

If production is unhealthy, cancel the queued GitHub deployment, use Vercel to
promote the last known-good deployment if it is still compatible with the
current schema, then perform the Git revert so repository history and deployed
state converge. Treat any suspected exposure of a token, database URL, or
applicant data as an incident: revoke/rotate the affected credential and keep
the secret out of tickets and logs.
