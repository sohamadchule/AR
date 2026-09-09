/**
 * GLB model conventions for the MVP.
 *
 * Only GLB (binary glTF) is supported. Models are assumed to already exist —
 * this app never generates or repairs 3D models. The canonical unit for AR
 * models is METERS: `<model-viewer>` and platform AR (Scene Viewer / Quick Look)
 * interpret a GLB's units as meters, so a chair modeled at real-world scale
 * places correctly in AR. Author/export GLBs in meters.
 */

export const GLB_EXTENSION = ".glb";
export const GLB_CONTENT_TYPE = "model/gltf-binary";

/**
 * Content types a browser may report for a GLB upload. Some browsers/OSes do
 * not know the glTF-binary type and fall back to a generic binary type.
 */
export const ACCEPTED_UPLOAD_CONTENT_TYPES = [
  "model/gltf-binary",
  "application/octet-stream",
  "", // some clients send no content type for File uploads
];

/** Magic header bytes at the start of every valid GLB file: ASCII "glTF". */
export const GLB_MAGIC = new Uint8Array([0x67, 0x6c, 0x54, 0x46]);

/**
 * Storage key for a freshly uploaded GLB.
 *
 * A UNIQUE key is minted for every upload rather than reusing a deterministic
 * per-product path. Writing to a fresh key means a rejected upload (bad magic
 * bytes, oversize, aborted connection) can never truncate or delete the model
 * that is currently live: the previous object is removed only after the
 * database has been repointed at the new one. Existing rows keep working
 * because the key is always read from `Product.modelKey`, never recomputed.
 */
export function newModelStorageKey(productId: string): string {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `models/${productId}-${stamp}${GLB_EXTENSION}`;
}

/** True if a filename ends in `.glb` (case-insensitive). */
export function isGlbFilename(name: string): boolean {
  return name.toLowerCase().endsWith(GLB_EXTENSION);
}

/** True if the first bytes of a buffer match the GLB magic header. */
export function hasGlbMagic(head: Uint8Array): boolean {
  if (head.length < GLB_MAGIC.length) return false;
  for (let i = 0; i < GLB_MAGIC.length; i++) {
    if (head[i] !== GLB_MAGIC[i]) return false;
  }
  return true;
}
