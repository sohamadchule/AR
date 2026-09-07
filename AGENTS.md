# AR 3D Product Viewer — contributor notes

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first. It is the source of
truth for scope, technology choices, and design decisions.

## Hard boundaries

- **Do NOT implement 3D model generation** of any kind (image/video → 3D,
  photogrammetry, NeRF, AI generation). A GLB is always assumed to already
  exist. Generation is an independent upstream process; this repo starts at
  "we have a GLB".
- **Never put a storage/model URL in a QR code.** QR codes encode only
  `https://<domain>/view/<id>`. The GLB is served through the stable app route
  `/api/products/<id>/model` so models can be replaced without reissuing QR
  codes.
- **Keep the admin/public boundary.** Public routes are read-only over *active*
  products. All mutations (create/update/delete, upload) are admin-gated.

## Conventions

- TypeScript strict; derive types from Zod schemas (`z.infer`) rather than
  duplicating them.
- Talk to storage only through `src/lib/storage` (`getStorage()`), never a
  concrete backend. Keep it swappable (local FS → S3-compatible).
- Read env only through `src/lib/env.ts`. No hardcoded secrets.
- GLB units are meters (canonical AR unit).
- Before adding a major dependency, justify why it is required.
- Verify before claiming done: `npm run typecheck`, `npm run build`, and run the
  relevant flow.

## Commands

```sh
npm run dev         # dev server
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run db:push     # apply prisma/schema.prisma to the database
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
