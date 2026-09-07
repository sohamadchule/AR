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

/** Deterministic storage key for a product's single GLB. */
export function modelStorageKey(productId: string): string {
  return `models/${productId}${GLB_EXTENSION}`;
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
