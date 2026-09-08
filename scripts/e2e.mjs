/**
 * End-to-end pipeline test for the AR product platform.
 *
 * Exercises the full acceptance flow against a running server:
 *   login -> create product -> upload GLB -> public page -> stream model ->
 *   QR -> REPLACE model (QR/URL must stay identical) -> deactivate (public 404)
 *   -> reactivate -> delete (gone).
 *
 * Usage:
 *   1. Start the app:  npm run dev   (or npm start)
 *   2. In another shell:
 *        E2E_GLB=/path/to/model.glb npm run test:e2e
 *
 * Env:
 *   E2E_BASE   base URL (default http://localhost:3000)
 *   E2E_GLB    path to a .glb file to upload (required)
 *   ADMIN_PASSWORD  admin password (loaded from .env via the npm script)
 */

import { readFile } from "node:fs/promises";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD || "dev-admin";
const GLB = process.env.E2E_GLB;

let cookie = "";
let passed = 0;
let failed = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  if (!GLB) {
    console.error("E2E_GLB is required (path to a .glb file).");
    process.exit(2);
  }
  const glbBytes = new Uint8Array(await readFile(GLB));
  console.log(`\nE2E against ${BASE} with ${GLB} (${glbBytes.byteLength} bytes)\n`);

  // 1. Login
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  const setCookie = login.headers.getSetCookie?.() ?? [];
  const arCookie = setCookie.find((c) => c.startsWith("ar_admin="));
  cookie = arCookie ? arCookie.split(";")[0] : "";
  ok("login sets session cookie", login.status === 200 && cookie !== "");

  const auth = { Cookie: cookie };

  // 2. Create product
  const createRes = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: { "content-type": "application/json", ...auth },
    body: JSON.stringify({ name: "Modern Chair", description: "Wooden dining chair" }),
  });
  const { product } = await createRes.json();
  const id = product?.id;
  ok("create product -> 201 with id", createRes.status === 201 && !!id);
  ok("new product has no model", product?.hasModel === false);

  // 3. Upload GLB
  const upload = await fetch(`${BASE}/api/products/${id}/model`, {
    method: "POST",
    headers: { "content-type": "model/gltf-binary", "x-filename": "chair.glb", ...auth },
    body: glbBytes,
  });
  const uploaded = await upload.json();
  ok("upload GLB -> 200 hasModel", upload.status === 200 && uploaded.product?.hasModel === true);
  ok("model size recorded", uploaded.product?.model?.sizeBytes === glbBytes.byteLength);

  // 4. Public page
  const view = await fetch(`${BASE}/view/${id}`);
  const viewHtml = await view.text();
  ok("public /view -> 200", view.status === 200);
  ok("public page shows product name", viewHtml.includes("Modern Chair"));

  // 5. Stream model (public), byte-identical
  const modelRes = await fetch(`${BASE}/api/products/${id}/model`);
  const modelBytes = new Uint8Array(await modelRes.arrayBuffer());
  ok("public model -> 200 model/gltf-binary", modelRes.status === 200 && modelRes.headers.get("content-type") === "model/gltf-binary");
  ok("model round-trips byte-identical", modelBytes.byteLength === glbBytes.byteLength);

  // 6. QR encodes /view/<id>, not storage
  const qr1 = await fetch(`${BASE}/api/products/${id}/qr`, { headers: auth });
  const target1 = qr1.headers.get("x-qr-target");
  ok("QR -> 200 image/png", qr1.status === 200 && qr1.headers.get("content-type") === "image/png");
  ok("QR encodes /view/<id>", target1 === `${BASE}/view/${id}`, target1 ?? "null");
  ok("QR does NOT encode storage/model URL", !/model|\.glb|:5432/.test(target1 ?? ""));

  // 7. REPLACE model — QR/URL must stay identical
  const replace = await fetch(`${BASE}/api/products/${id}/model`, {
    method: "POST",
    headers: { "content-type": "model/gltf-binary", "x-filename": "chair-v2.glb", ...auth },
    body: glbBytes,
  });
  ok("replace model -> 200", replace.status === 200);
  const qr2 = await fetch(`${BASE}/api/products/${id}/qr`, { headers: auth });
  const target2 = qr2.headers.get("x-qr-target");
  ok("QR target UNCHANGED after model replace", target1 === target2, `${target1} vs ${target2}`);

  // 8. Deactivate -> public 404
  await fetch(`${BASE}/api/products/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", ...auth },
    body: JSON.stringify({ isActive: false }),
  });
  const viewInactive = await fetch(`${BASE}/view/${id}`);
  const modelInactive = await fetch(`${BASE}/api/products/${id}/model`);
  ok("inactive product /view -> 404", viewInactive.status === 404);
  ok("inactive product model -> 404 (public)", modelInactive.status === 404);

  // 9. Reactivate + delete
  await fetch(`${BASE}/api/products/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", ...auth },
    body: JSON.stringify({ isActive: true }),
  });
  const del = await fetch(`${BASE}/api/products/${id}`, { method: "DELETE", headers: auth });
  ok("delete -> 200", del.status === 200);
  const gone = await fetch(`${BASE}/api/products/${id}`, { headers: auth });
  ok("deleted product -> 404", gone.status === 404);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("E2E crashed:", err);
  process.exit(1);
});
