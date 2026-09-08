/**
 * Client-side GLB upload with progress, using XMLHttpRequest (fetch cannot
 * report upload progress). Streams the raw File as the request body.
 */
export function uploadModel(
  productId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/products/${productId}/model`);
    xhr.setRequestHeader(
      "content-type",
      file.type || "model/gltf-binary",
    );
    xhr.setRequestHeader("x-filename", file.name);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        // keep default message
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
