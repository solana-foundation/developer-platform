# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turbo monorepo for open-source Solana developer tools maintained by the Solana Foundation. It contains:

- **apps/api**: NestJS backend with Solana integration and authentication
- **apps/web**: Next.js 15 marketing site with React 19 and Tailwind CSS 4
- **programs/**: Anchor/Solana smart contracts (Rust)

**Project Purpose**: Helper tools for Anchor developers - simplifies wallet authentication, program testing, and devnet deployments without replacing existing workflows. This is NOT a full platform like Vercel, but a collection of utilities to streamline common development tasks.

The API and web apps run independently but are configured to work together (API on port 3000, web on 3001).

## Development Commands

### Monorepo Commands (run from root)

- `npm run dev` - Start both API and web in parallel with Turbo
- `npm run build` - Build all apps
- `npm run lint` - Lint all apps
- `npm run test` - Run tests in all apps
- `npm run format` - Format code with Prettier

### API-Specific Commands (run from root or apps/api)

- `npm run dev --filter=@developer-platform/api` - Start API dev server (port 3000)
- `npm run build --filter=@developer-platform/api` - Build API
- `npm run test --filter=@developer-platform/api` - Run all API tests
- `npm run test:watch --filter=@developer-platform/api` - Run tests in watch mode
- `npm run test:e2e --filter=@developer-platform/api` - Run e2e tests
- `npm run start:prod --filter=@developer-platform/api` - Run production build

### Web-Specific Commands (run from root or apps/web)

- `npm run dev --filter=@developer-platform/web` - Start Next.js dev server (port 3001)
- `npm run build --filter=@developer-platform/web` - Build Next.js app
- `npm run lint --filter=@developer-platform/web` - Lint frontend

#### Adding shadcn/ui Components

The web app uses shadcn/ui for UI components. To add new components:

```bash
cd apps/web && npx shadcn@latest add <component-name>
```

Example:

```bash
cd apps/web && npx shadcn@latest add dialog
```

### Solana/Anchor Commands (run from programs/)

- `anchor build` - Build Anchor programs
- `anchor test` - Run Anchor tests
- `anchor deploy` - Deploy to configured cluster
- `yarn run ts-mocha -p ./tsconfig.json -t 1000000 "tests/**/*.ts"` - Run tests with Mocha

## Architecture

### Authentication Flow

The system implements three authentication strategies:

1. **JWT Authentication** (Default): Standard username/password flow with JWT tokens
   - Register/login via `/auth/register` and `/auth/login`
   - Returns `accessToken` and `refreshToken`
   - Global JWT guard applied via `APP_GUARD` in `app.module.ts`
   - Use `@Public()` decorator to bypass auth on specific routes

2. **API Key Authentication**: Long-lived tokens for programmatic access
   - Generated via `/auth/api-token` (requires JWT auth first)
   - Pass in `Authorization: Bearer <api-token>` header
   - Handled by `ApiKeyStrategy` in `auth/strategies/api-key.strategy.ts`

3. **CLI Device Flow Authentication**: OAuth-like flow for CLI tools
   - CLI requests auth via POST `/cli-auth/request`
   - User visits browser URL with verification code
   - CLI polls GET `/cli-auth/poll/:token` until verified
   - Returns API token for subsequent requests
   - Implementation in `cli-auth/cli-auth.service.ts` (5min token TTL, 1hr poll TTL)

### Storage Architecture

The API uses Redis for all session and token storage via the `StorageService` abstraction:

- Redis configured globally in `app.module.ts` via `CacheModule`
- Wrapped by `StorageService` which provides key-value operations
- Used for: CLI auth sessions, API tokens, user data cache
- Keys follow patterns like `cli_auth:${token}`, `cli_code:${code}`, `api_token:${token}`

### Module Structure

Core modules in apps/api/src/:

- **auth/**: JWT/Local/API key authentication strategies and guards
- **cli-auth/**: Device flow authentication for CLI clients
- **users/**: In-memory user management (no database currently)
- **storage/**: Redis abstraction layer via NestJS cache-manager
- **airdrop/**: Solana airdrop functionality

Global JWT guard is applied at app level - use `@Public()` decorator from `auth/decorators/public.decorator.ts` to make endpoints public.

## Environment Setup

### API Environment Variables (apps/api/.env)

```
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
API_TOKEN_EXPIRES_IN=30d
PORT=3000
CORS_ORIGIN=http://localhost:3001
RPC_URL=https://api.devnet.solana.com
KEYPAIR=
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Starting Redis

Redis is required for the API to function. Start it via:

```bash
cd apps/api && docker-compose up -d
```

## Pre-commit Hooks

The project uses Husky and lint-staged for automated code quality checks:

- **Pre-commit hook** runs automatically on `git commit`
- **API files** (`apps/api/**/*.ts`): ESLint with NestJS rules + Prettier
- **Web files** (`apps/web/**/*.tsx`): Next.js ESLint + Prettier
- **Other files** (JSON, MD, CSS): Prettier only
- Shared Prettier config at root (`.prettierrc`)
- Each workspace has its own ESLint configuration

The hooks will auto-fix issues and re-stage files. Commits fail if unfixable errors remain.

## Git Commit Guidelines

**NEVER include Co-Authored-By or any co-authorship attribution in commit messages.**

Commit messages should be clean and concise without any attribution to AI assistance.

## Documentation Philosophy

**DO NOT create separate documentation files (README.md, COMPONENTS.md, API.md, etc.) unless explicitly requested.**

The codebase is self-documenting through:

- TypeScript interfaces and types define component APIs
- JSDoc comments explain complex logic
- This CLAUDE.md file contains architecture and setup guidance

Developers should read the code, not outdated markdown files. Over-documentation creates maintenance burden and quickly becomes stale.

## UI Components (shadcn/ui)

The web app uses shadcn/ui built on Radix UI primitives with Tailwind CSS v4. Key setup details:

- **Configuration**: `apps/web/components.json` defines component paths and aliases
- **Utilities**: `apps/web/lib/utils.ts` provides the `cn()` helper for className merging
- **Theme**: System-responsive dark/light mode via `next-themes` in `apps/web/app/layout.tsx`
- **Theme Colors**: Defined in `apps/web/app/globals.css` using `@theme` directive
  - Solana brand colors: `--color-primary` (purple #9945FF), `--color-success` (green #14F195)
  - Uses OKLCH color space for Tailwind v4 compatibility
- **Components**: Located in `apps/web/components/ui/`
- **Path Aliases**: `@/` maps to the web app root (configured in `tsconfig.json`)

### Tailwind v4 Migration Notes

This project uses **Tailwind CSS v4** with significant differences from v3:

- **No `tailwind.config.ts`**: Configuration is done via CSS `@theme` directive in `globals.css`
- **Import syntax**: Use `@import "tailwindcss"` instead of `@tailwind` directives
- **Color format**: Use OKLCH instead of HSL (e.g., `oklch(0.68 0.24 286)` for purple)
- **CSS variables**: Prefix with `--color-`, `--radius-`, etc. in `@theme` block
- **Theme management**: Use `next-themes` library instead of custom providers
  - System theme detection enabled by default
  - No manual theme toggle (respects OS preferences)

## Marketing Content Guidelines

The web app (`apps/web`) is a marketing site for Solana Foundation developer tools:

- **Positioning**: Open-source helper tools, NOT a full platform replacement
- **Tone**: Community-focused, non-profit, educational
- **Key messaging**:
  - "Essential tools for Solana developers" (not "complete platform")
  - Emphasize Anchor integration and workflow enhancement
  - Highlight open-source nature and Solana Foundation backing
  - Free for all developers
- **Avoid**: Corporate/enterprise language, SaaS pricing talk, "scale without limits" claims
- **Brand colors**: Use Solana purple (#9945FF) and green (#14F195) from official branding

## Important Notes

- The frontend is configured for CORS at `http://localhost:3001` in `apps/api/src/main.ts`
- Tailwind CSS v4 uses `@tailwindcss/postcss` plugin (not the old `tailwindcss` PostCSS plugin)
- User storage is currently in-memory via `UsersService` - no persistent database yet
- Anchor programs use localnet by default (see programs/Anchor.toml)
- All workspace packages use `@developer-platform/*` namespace
