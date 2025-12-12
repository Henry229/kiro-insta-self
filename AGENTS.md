# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router entry points, layouts, and providers; route-specific logic lives alongside pages (e.g., `app/auth`, `app/api`).
- `components/` contains reusable UI primitives; `lib/` stores helpers and integrations; `types/` centralizes shared TypeScript types.
- `prisma/` includes `schema.prisma`, migrations, and the SQLite/PostgreSQL database file; run Prisma commands from the repo root.
- Tests live in `__tests__/` for unit/integration and `tests/` for Playwright e2e specs; `public/` stores static assets.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server at `localhost:3000`.
- `npm run build` / `npm run start` — production build and serve.
- `npm run lint` — run ESLint with the Next.js config; fix style issues early.
- `npm run type-check` — strict TypeScript checks without emitting output.
- `npm run test` / `npm run test:ui` — Vitest in CLI or UI mode for unit/integration/property tests.
- `npm run test:e2e` / `npm run test:e2e:ui` — Playwright headless or UI runner from `tests/`.
- Prisma workflow: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`.

## Coding Style & Naming Conventions
- TypeScript-first with functional React components; prefer server components unless client features are required.
- Use 2-space indentation and retain existing import ordering; favor named exports for shared utilities.
- Component files in `components/` use PascalCase (`UserAvatar.tsx`); hooks/utilities use camelCase (`useSessionUser.ts`, `authClient.ts`).
- Tailwind classes live in `globals.css` or inline; keep variant logic in helper utilities (e.g., `class-variance-authority`).
- Run `npm run lint && npm run type-check` before opening a PR; staged files auto-format via lint-staged.

## Testing Guidelines
- Vitest is configured for React and jsdom; place specs in `__tests__` with `*.test.ts` or `*.test.tsx`. Use fast-check for property-based cases where valuable.
- Playwright e2e specs live in `tests/` (e.g., `example.spec.ts`); prefer data-testids over brittle selectors.
- Keep tests isolated: mock network/DB where possible; for integration touching Prisma, run against a disposable local DB.
- Aim for meaningful coverage on auth flows and API routes; add regression tests for bugs before fixing.

## Database, Auth, and Environment
- NextAuth is configured under `app/api`; ensure required secrets (`NEXTAUTH_SECRET`, provider keys) and database URLs are present in `.env.local` before running auth-dependent tests.
- After updating `schema.prisma`, run `npm run db:generate` and a migration command, and commit both schema and migration files.

## Commit & Pull Request Guidelines
- Follow the existing conventional commit style (`feat:`, `fix:`, `refactor:`, `docs:`). Use present tense and keep the summary under ~72 characters.
- PRs should include: clear description of changes, linked issues/tickets, notes on DB migrations, and screenshots or GIFs for UI-affecting work.
- Verify `npm run lint`, `npm run type-check`, and relevant test suites before requesting review; include command outputs or coverage notes in the PR description.
