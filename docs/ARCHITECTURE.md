# Architecture

AR 3D Product Visualization — MVP.

## Scope

This application implements everything **after** a valid GLB 3D model already
exists:

```
Existing GLB  →  Admin upload  →  Product  →  Stable public URL  →  QR code
              →  Mobile web product page  →  3D viewer  →  AR placement
```

**Out of scope (intentionally):** any 3D model *generation* — image/video → 3D,
photogrammetry, NeRF, or AI generation. A GLB is assumed to already exist.

## Technology

| Concern    | Choice                                  | Notes |
| ---------- | --------------------------------------- | ----- |
| Framework  | Next.js (App Router) + TypeScript       | One app serves admin, public pages, and APIs. |
| Styling    | Tailwind CSS v4                         | Mobile-first customer UI. |
| 3D / AR    | `<model-viewer>` (`@google/model-viewer`) | No custom WebGL/AR engine. AR via Scene Viewer (Android) / Quick Look (iOS). |
| Database   | PostgreSQL + Prisma ORM (v6)            | Prisma 6's classic `datasource url` model — simplest for the MVP. |
| Storage    | Pluggable `StorageAdapter`              | Local filesystem for dev; S3-compatible later, no caller changes. |
| QR         | `qrcode`                                | Reliable, zero native deps; emits SVG + PNG data URLs. |
| Validation | `zod`                                   | Runtime validation of API inputs; types derived via `z.infer`. |
| Admin auth | Signed cookie (Web Crypto HMAC)         | Single shared password; no user table, no auth library. |

Guiding principle: keep it simple and maintainable; no dependency is added
without a concrete reason.

## Key design decisions

### Stable identity, replaceable model
- The product `id` (a CUID) is the **only** identifier in the public URL
  (`/view/<id>`) and in QR codes. It never changes.
- The GLB is referenced by an **opaque storage key** (`Product.modelKey`), never
  a public storage URL.
- The public model URL is always the app route `/api/products/<id>/model`, which
  streams the current GLB from storage.
- **Result:** replacing a product's GLB changes only the stored bytes — the
  public URL and QR code keep working, exactly as required.

> The QR code always encodes `https://<domain>/view/<id>` — never a
> storage/model URL. This is the core guarantee that lets models be swapped
> (including, later, by a generation pipeline) without reissuing QR codes.

### Storage abstraction
`src/lib/storage` defines a `StorageAdapter` interface. `getStorage()` selects an
implementation from `STORAGE_DRIVER` (`local` today). The local adapter streams
uploads to disk and streams reads back, so it handles arbitrarily large GLBs.
Adding S3-compatible storage means adding one adapter and a `case` — no route,
page, DB, or QR changes.

### Units
Meters is the canonical unit for AR models. `<model-viewer>` and platform AR
interpret a GLB's units as meters, so models must be authored/exported at
real-world scale in meters.

### Admin vs public boundary
- Public users can view **active** products and load their models (read-only).
- All mutations (create/update/delete, upload) require the admin cookie, enforced
  by middleware over `/admin` and mutation APIs.
- No account is needed to view a product.

## Layout

```
prisma/
  schema.prisma            Product model (stable id; opaque model key)
src/
  app/
    page.tsx               Landing → /admin
    layout.tsx             Root layout + metadata
    admin/                 Admin app (products list, create, edit, QR)   [later milestone]
    view/[productId]/      Public mobile-first product page              [later milestone]
    api/                   REST endpoints + model upload/serve           [later milestone]
  lib/
    env.ts                 Lazily-validated environment config
    db.ts                  Prisma client singleton
    auth.ts                Admin session (signed cookie)
    crypto.ts              Web Crypto HMAC (works in Node + Edge)
    validation.ts          Zod schemas for API inputs
    model.ts               GLB conventions (extension, content type, magic, keys)
    storage/
      types.ts             StorageAdapter interface
      local.ts             Local filesystem adapter (streaming)
      index.ts             getStorage() driver factory
docs/
  ARCHITECTURE.md          This file
```

## Future: 3D generation as an upstream process

Generation is deliberately decoupled. The future system becomes:

```
Image/Video → 3D Generation → GLB → [ Product → QR → Mobile Web → Viewer → AR ]
```

Everything in brackets is what this repo builds. To introduce generation later,
an upstream process only needs to **produce a GLB and feed it into the same
upload/storage flow**. Nothing here couples to a specific generation provider, so
product pages, the QR system, the database schema, the 3D viewer, and the AR
experience are reused unchanged.

## API surface (planned)

```
GET    /api/products            list products (admin)
POST   /api/products            create product (admin)
GET    /api/products/:id        get product
PUT    /api/products/:id        update product (admin)
DELETE /api/products/:id        delete/deactivate product (admin)
POST   /api/products/:id/model  upload/replace GLB (admin)
GET    /api/products/:id/model  stream current GLB (public, active products)
GET    /api/products/:id/qr     QR code for the public URL (admin)
```

Public read endpoints only expose **active** products; mutation endpoints are
admin-gated.
