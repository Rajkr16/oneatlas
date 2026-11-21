# OneAtlas: AI model discovery and intelligence platform

Browse, filter, compare and rank AI models across labs and providers.
Full-stack: Next.js 15 (App Router) · TypeScript · Tailwind v4 · PostgreSQL · Prisma.

## Run it locally (5 minutes)

```bash
npm install
cp .env.example .env        # paste your Postgres URL (Neon free tier works)
npm run db:push             # create tables
npm run db:seed             # pulls live data from OpenRouter, ~1-2 min
npm run dev                 # http://localhost:3000
```

## Deploy (Vercel + Neon)

1. Create a Neon project and copy the **pooled** connection string.
2. Push this repo to GitHub, import it in Vercel, add `DATABASE_URL`.
3. From your machine run `npm run db:push && npm run db:seed` against the same URL.
4. Redeploy. `npm run build` already runs `prisma generate`.

## Architecture

```
prisma/schema.prisma      Lab, Model, Provider, ModelProvider, Benchmark, BenchmarkScore
prisma/seed.ts            ingest + normalise OpenRouter, generate sample benchmarks
src/lib/services/*        all DB access (single source of truth)
src/lib/schemas.ts        zod validation for every query string
src/lib/api.ts            route() wrapper: JSON, cache headers, uniform errors (400/404/500)
src/app/api/*             thin route handlers -> services
src/app/*                 pages; server components call services, client components call /api
src/components/*          ModelRow, CompareProvider, GlobalSearch, ModelsExplorer, ...
```

### API

| Endpoint | Purpose |
|---|---|
| `GET /api/models` | `q, lab, provider, capability, type, free, sort, order, page, pageSize` |
| `GET /api/models/:lab/:name` | detail with providers, scores, ranks, related |
| `GET /api/compare?models=a,b,c` | 1-4 models with scores |
| `GET /api/rankings?benchmark&category&limit` | leaderboard |
| `GET /api/labs`, `/api/labs/:slug` | lab directory |
| `GET /api/providers`, `/api/providers/:slug` | provider directory |
| `GET /api/search?q=` | global search (models, labs, providers) |
| `GET /api/filters` | facet counts for the filter sidebar |

### Key decisions (use these in your Loom)

- **Services layer**: API routes and server components share the same functions, so logic is never duplicated.
- **Server-side everything**: search, filter, sort and pagination run in Postgres, not in the browser.
- **URL is the state**: filters, sort, page and compare selection live in the query string, so views are shareable and the back button works.
- **Pricing normalised to USD per 1M tokens**; per-provider pricing lives on the `ModelProvider` join table.
- **Indexes** on release date, prices, context, lab, type and a GIN index on capabilities.
- **Validation** with zod at the edge; bad input returns a 400 with field errors.
- **Caching**: `s-maxage` + `stale-while-revalidate` on read endpoints.

### Testing

```bash
npm test          # vitest: schema validation, API wrapper errors, formatters
npm run typecheck
```

### Honest limitations

- OpenRouter has no benchmark data. Scores are **synthetic and deterministic**, labelled `source = "synthetic"` and flagged in the UI. Replace them with real data (e.g. import a CSV) to go further.
- Provider data is ingested for the newest ~150 paid models (`ENDPOINT_LIMIT`).
- Search uses `ILIKE`. For a larger dataset, add `pg_trgm` or full-text search.

### Challenges worth mentioning

- Normalising inconsistent upstream data (negative router prices, missing modalities, lab names embedded in model names).
- Model slugs contain `/` and `:`, so detail pages use a catch-all route.
- Keeping filter state in the URL while debouncing search.
