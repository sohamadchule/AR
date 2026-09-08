# AR 3D Product Viewer

Upload an existing 3D model (GLB), publish a product, and share a QR code that
opens a mobile-first web page where customers view the model in 3D and place it
in their space with AR — no app install required.

> This project implements everything **after** a GLB already exists. It does
> **not** generate 3D models (no image/video → 3D, photogrammetry, NeRF, or AI
> generation). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · `<model-viewer>` for 3D/AR
· PostgreSQL + Prisma · pluggable object storage · `qrcode`.

## Requirements

- Node.js 20+ (developed on Node 24)
- A PostgreSQL database (local install, Docker, or a hosted provider like Neon)

## Getting started

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    then edit .env — at minimum set DATABASE_URL, ADMIN_PASSWORD,
#    and ADMIN_SESSION_SECRET.

# 3. Set up the database schema
npm run db:generate      # generate the Prisma client
npm run db:push          # create tables from prisma/schema.prisma
#    (once migrations are introduced, use `npm run db:migrate` instead)

# 4. Run the app
npm run dev              # http://localhost:3000
```

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable                | Required | Purpose |
| ----------------------- | -------- | ------- |
| `DATABASE_URL`          | yes      | PostgreSQL connection string. |
| `ADMIN_PASSWORD`        | yes      | Shared password gating the admin app + mutations. |
| `ADMIN_SESSION_SECRET`  | yes      | Secret used to sign the admin session cookie. |
| `STORAGE_DRIVER`        | no       | `local` (default). |
| `LOCAL_STORAGE_DIR`     | no       | Local storage directory (default `.storage`). |
| `PUBLIC_BASE_URL`       | no       | Public origin for QR/`/view` URLs; derived from request if unset. |
| `MAX_UPLOAD_BYTES`      | no       | Max GLB size in bytes; `0` = no limit (default). |

## Scripts

| Script              | Description |
| ------------------- | ----------- |
| `npm run dev`       | Start the dev server. |
| `npm run build`     | Production build. |
| `npm start`         | Run the production build. |
| `npm run lint`      | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run test:e2e` | End-to-end pipeline test (needs the app running + `E2E_GLB=/path/to/model.glb`). |
| `npm run db:generate` | Generate the Prisma client. |
| `npm run db:push`   | Push the schema to the database. |
| `npm run db:studio` | Open Prisma Studio. |

## Uploading a model

1. Sign in at `/admin` (or `/admin/login`) with `ADMIN_PASSWORD`.
2. **New product** → enter name/description → choose a `.glb` file → **Create**.
3. On the product page you get a stable public URL, a QR code (preview +
   PNG/SVG download), a 3D preview, and a **Replace model** control.

Replacing the model **keeps the same public URL and QR code** — the QR always
points to `/view/<id>`, never the model file.

## Testing AR

See [`docs/AR.md`](docs/AR.md). In short: desktop shows the 3D viewer with an
"AR unavailable" message; on a phone (Android Chrome → Scene Viewer, iOS Safari →
Quick Look) a **View in AR** button appears once the model loads. Real devices
require the page be served over **HTTPS** (tunnel the dev server or deploy).

## Known limitations (MVP)

- **3D model generation is out of scope** — a valid GLB must already exist.
- **On-device AR requires HTTPS**; `localhost` only covers desktop 3D.
- **iOS Quick Look** works best with a USDZ; the schema/component already accept
  an optional `iosSrc`, but no GLB→USDZ conversion is performed.
- **Single GLB per product** (schema is designed to extend to variants).
- **Auth is a single shared password** — right-sized for the MVP, not multi-user.
- **Local filesystem storage** by default; S3-compatible storage is a drop-in
  adapter but not yet implemented.
- **No range requests** on the model stream (whole-file GET), which is fine for
  `<model-viewer>`.

## Future: 3D generation

Generation is intentionally decoupled and sits **upstream**:

```
Image/Video → 3D generation → GLB → [ this app: product · QR · viewer · AR ]
```

To add it later, an upstream process only needs to **produce a GLB and hand it to
the existing upload/storage flow** (`POST /api/products/:id/model`). Product
pages, QR codes, the database schema, the 3D viewer, and the AR experience are
reused unchanged. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Status

MVP complete through end-to-end integration (`npm run test:e2e` — 18/18). See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design.
