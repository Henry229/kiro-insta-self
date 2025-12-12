# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple Instagram clone built with Next.js 16+ (App Router), TypeScript, Prisma ORM, and SQLite. The application provides core social media features: user authentication, photo uploads, feed viewing, likes, comments, and user profiles.

**Important**: This project follows a property-based testing approach. Each major feature has corresponding test files (marked with `*` in tasks.md) that validate requirements before implementation.

## Context Recovery (After /clear or Context Loss)

**IMPORTANT**: When starting a new session or after losing context, ALWAYS read the following file first:

```
.kiro/specs/simple-instagram/tasks.md
```

This file contains:
- `[x]` Completed tasks - What has already been done
- `[ ]` Pending tasks - What needs to be done next
- `[ ]*` Test tasks - Property-based tests that must be written before implementation
- Requirements references for each task

**Steps to recover context:**
1. Read `.kiro/specs/simple-instagram/tasks.md` to understand progress
2. Find the first unchecked `[ ]` task - this is the next task to work on
3. Read `.kiro/specs/simple-instagram/requirements.md` for detailed acceptance criteria
4. Continue implementation from where it was left off

## Development Commands

### Running the Application
```bash
npm run dev              # Start development server at http://localhost:3000
npm run build            # Build for production
npm start                # Start production server
```

### Database Management
```bash
npm run db:generate      # Generate Prisma Client after schema changes
npm run db:push          # Push schema changes to SQLite database
npm run db:migrate       # Create and run database migrations
npm run db:studio        # Open Prisma Studio GUI for database inspection
```

### Testing
```bash
npm test                 # Run all Vitest tests in watch mode
npm run test:ui          # Run Vitest with UI
npm test -- path/to/test # Run specific test file
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run Playwright tests with UI
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
```

### Git Hooks
This project uses Husky and lint-staged for automated quality checks:
- **Pre-commit hook**: Automatically runs `eslint --fix` on staged files, then `tsc --noEmit` for type checking
- **Auto-fix**: ESLint automatically fixes fixable issues before commit
- **Type safety**: TypeScript type errors will block commits
- Configuration in `package.json` under `lint-staged` and `.husky/pre-commit`

## Architecture

### Database Layer (Prisma + SQLite)

The database schema is defined in `prisma/schema.prisma` with four main models:

- **User**: Authentication and profile data (email, username, password, name, image)
- **Post**: User-uploaded photos with captions
- **Like**: Many-to-many relationship between users and posts
- **Comment**: User comments on posts with timestamps

**Critical**: Always use the singleton Prisma client from `lib/prisma.ts` to prevent connection pool exhaustion in development. This file implements the recommended Next.js pattern for Prisma Client instantiation.

### Testing Strategy

The project uses a dual testing approach:

1. **Unit/Integration Tests (Vitest)**: Located in `__tests__/` directory
   - Database tests use `environment: 'node'` (configured in vitest.config.ts)
   - Component tests will use `environment: 'jsdom'`
   - Tests follow property-based testing principles

2. **E2E Tests (Playwright)**: For end-to-end user workflows
   - Configuration in `playwright.config.ts`

**Important**: The package.json has `"type": "module"` for ESM support. All test files must use ES module syntax.

### Project Structure

```
app/                 # Next.js App Router pages and layouts
lib/                 # Shared utilities and configurations
  ├── prisma.ts      # Singleton Prisma Client (ALWAYS import from here)
  └── utils.ts       # General utilities
prisma/              # Database schema and migrations
  ├── schema.prisma  # Database models
  └── dev.db         # SQLite database file
__tests__/           # Test files organized by type
  └── database/      # Database layer tests
.kiro/specs/         # Project specifications
  └── simple-instagram/
      ├── requirements.md  # User stories and acceptance criteria
      └── tasks.md         # Implementation plan with checkpoints
```

### Path Aliases

The project uses `@/*` as an alias for the root directory:
```typescript
import { prisma } from '@/lib/prisma'
```

## Development Workflow

### Adding New Features

1. Check `.kiro/specs/simple-instagram/tasks.md` for the implementation plan
2. Review corresponding requirements in `requirements.md`
3. Write property-based tests first (tasks marked with `*`)
4. Implement the feature
5. Ensure all tests pass
6. Update tasks.md to mark items as complete with `[x]`

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma Client
3. Run `npm run db:push` for development or `npm run db:migrate` for production-ready migrations
4. Update corresponding tests if data models changed

### Writing Tests

**Database Tests**: Place in `__tests__/database/` and verify Prisma models and relationships.
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
// Clean up before/after each test
```

**Property Tests**: Follow the naming convention in tasks.md (e.g., "Property 1: Valid user registration creates account") and ensure they validate the specified requirements.

## Development Guidelines

### Priority Rules

1. **ALWAYS use Shadcn MCP to create UI** - When creating shadcn/ui components, must use Shadcn MCP
2. **ALWAYS prioritize server components over client components** - Use server components whenever possible; only use client components when absolutely necessary (e.g., interactivity, hooks)

### Quality Assurance Checklist

After completing any coding work, **MUST** perform the following steps in order:

1. **Run Tests**
   ```bash
   npm test                    # Run all unit/integration tests
   npm run test:e2e           # Run E2E tests (when applicable)
   npm test -- path/to/test   # Run specific test file for the feature
   ```
   - All tests must pass
   - If tests fail, fix issues before proceeding

2. **Code Review**
   - Review code quality and readability
   - Verify best practices are followed
   - Check for potential bugs or edge cases
   - Ensure proper error handling

3. **Lint Check**
   ```bash
   npm run lint
   ```
   - Fix all linting errors and warnings
   - Ensure code style consistency

4. **Type Check**
   ```bash
   npm run type-check
   ```
   - Verify TypeScript type correctness
   - Fix any type errors

5. **Git Commit**
   ```bash
   git add .
   git commit -m "Clear, descriptive commit message"
   git push
   ```
   - Stage all changes
   - Write clear commit messages following conventional commits format
   - Ensure all changes are tracked
   - Push to remote repository

⚠️ **CRITICAL**: Do NOT mark work as complete until ALL checks pass. If any check fails, fix the issues and re-run all checks.

### Automated Quality Enforcement

This project uses **Husky + lint-staged** for pre-commit hooks:

- **Automatic linting**: When you commit, `eslint --fix` automatically fixes code style issues
- **Automatic type checking**: `tsc --noEmit` runs after linting to catch type errors
- **Commit blocking**: If either lint or type-check fails, the commit is blocked
- **Configuration**: See `lint-staged` in `package.json` and `.husky/pre-commit`

This ensures all committed code meets both linting and type safety standards automatically.

## Key Implementation Notes

- **Authentication**: Planned to use NextAuth.js (not yet implemented)
- **File Storage**: Image uploads will be stored locally during development
- **Password Hashing**: Uses bcrypt for password security
- **TypeScript**: Strict mode enabled, all files must be properly typed
- **Next.js**: Uses App Router (not Pages Router)

## Checkpoints

The implementation plan includes two checkpoints:
- **Checkpoint 1** (Task 13): After core features are implemented
- **Checkpoint 2** (Task 17): Before deployment

At each checkpoint, all tests must pass before proceeding. If any test fails, stop and ask the user for clarification.
