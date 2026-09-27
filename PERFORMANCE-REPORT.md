# Public-page performance report

## Scope and test conditions

- Pages: `/` and `/results`
- Build: production build (`next build --webpack`), served with `next start`
- Audit: Lighthouse mobile preset and axe-core 4.13.0 at 360 × 800
- Site origin used during the local audit: `http://127.0.0.1:3200`

The local environment has no `DATABASE_URL`; therefore the public data and the
interactive results input are intentionally unavailable during this run. The
measurements verify the production page shell, but a release check with seeded
announcements and published results is still required to capture field INP and
the JSON-LD rendered from real news.

## Lighthouse results

| Page       | Run    | Performance | Accessibility | Best practices | SEO |   LCP | CLS |    TBT |
| ---------- | ------ | ----------: | ------------: | -------------: | --: | ----: | --: | -----: |
| `/`        | Before |          99 |           100 |             96 | 100 | 1.7 s |   0 | 110 ms |
| `/`        | After  |          98 |           100 |             96 | 100 | 2.0 s |   0 | 120 ms |
| `/results` | Before |          99 |           100 |             96 | 100 | 1.7 s |   0 | 100 ms |
| `/results` | After  |          99 |           100 |             96 |  63 | 1.5 s |   0 | 110 ms |

Lighthouse did not produce an INP value because this audit did not include a
real user interaction and the result form is hidden without a database. LCP
and CLS are within the good Core Web Vitals thresholds in every run. The small
home-page score movement is normal variance in a single local Lighthouse run;
it is not reported as an improvement.

The `/results` SEO score is deliberately lower because the page sends
`noindex, follow`: individual names and seat-number search results must not be
crawled. Canonical metadata is valid after `NEXT_PUBLIC_SITE_URL` is supplied.

## Accessibility

axe-core reported **0 violations** on both pages before and after the change.
The implementation additionally provides a visible-on-focus skip link and a
keyboard focus target for the main content. Existing labels, contrast tokens,
and focus styling remained compliant.

## Changes applied

- The home page uses ISR and cached public data with a 60-second revalidation
  window, avoiding repeated database reads during announcement/result traffic.
- The client-side result filter defers non-urgent rendering and normalizes
  searchable fields only when the result set changes, preserving immediate
  typing responsiveness for larger published result sets.
- Page metadata, Open Graph metadata, canonical origin support, and conditional
  `NewsArticle` JSON-LD were added for public announcements.
- Result search remains `noindex` for personal-data minimization.

## Commands run

```sh
pnpm type-check
pnpm lint
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3200 pnpm build
pnpm exec lighthouse ...
pnpm audit:a11y
```
