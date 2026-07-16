async function convertToWebP(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error("WebP conversion failed — canvas.toBlob returned null"),
            ),
      "image/webp",
      0.92,
    ),
  );
}

const REMOVEBG_API_URL = import.meta.env.VITE_REMOVEBG_API_URL;

async function removeBgViaApi(file, onProgress, signal) {
  if (!REMOVEBG_API_URL) {
    throw new Error(
      "VITE_REMOVEBG_API_URL is not set. Add it to your .env file and restart the dev server.",
    );
  }

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (onProgress) onProgress("Converting image…", 10);
  let webpBlob;
  try {
    webpBlob = await convertToWebP(file);
  } catch (err) {
    throw new Error(`Image conversion failed: ${err.message}`);
  }

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (onProgress) onProgress("Removing background…", 35);

  const formData = new FormData();
  formData.append("image", webpBlob, "photo.webp");

  let response;
  try {
    response = await fetch(REMOVEBG_API_URL, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new Error(
      `Network error reaching background removal API: ${err.message}`,
    );
  }

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (onProgress) onProgress("Removing background…", 65);

  if (!response.ok) {
    let errorMsg = `API error ${response.status}`;
    try {
      const body = await response.json();
      if (response.status === 429) {
        const retryAfterSec =
          body.retryAfterSeconds ??
          Number(response.headers.get("Retry-After") ?? 3600);
        const mins = Math.ceil(retryAfterSec / 60);
        errorMsg =
          `Rate limit reached — maximum 10 background removals per hour. ` +
          `Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`;
      } else {
        errorMsg = body.error || errorMsg;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }

  if (onProgress) onProgress("Finalising…", 90);
  const resultBlob = await response.blob();
  if (onProgress) onProgress("Done", 100);

  // console.log("[removeBg] API call complete via Cloud Function");

  return resultBlob;
}

export async function preloadBgModel(onProgress) {
  return "server";
}

/**
 * Remove background from any image via the Firebase Cloud Function API.
 *
 * If the API call fails (network / server error) → returns the original
 * image unchanged (no error thrown), so the UI never breaks.
 *
 * @param {File|Blob} file
 * @param {(stage: string, pct: number) => void} [onProgress]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Blob>} transparent PNG, or original image on failure
 */
export async function removeBg(file, onProgress, signal) {
  // Honour abort before we even start
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  try {
    return await removeBgViaApi(file, onProgress, signal);
  } catch (err) {

    if (err?.name === "AbortError") throw err;
    
    console.error(
      "[removeBg] API removal failed — returning original image:",
      err.message,
    );
    if (onProgress)
      onProgress("Could not remove background — showing original", 100);

    // Return original file as a Blob
    if (file instanceof Blob) return file;
    return new Blob([await file.arrayBuffer()], {
      type: file.type || "image/jpeg",
    });
  }
}

export function refreshRemoveBgKeys() {}
