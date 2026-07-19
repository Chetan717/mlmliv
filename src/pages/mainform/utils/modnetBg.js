/**
 * Local, free portrait matting powered by MODNet (Apache-2.0).
 *
 * Unlike MediaPipe Selfie Segmentation, MODNet predicts a continuous alpha
 * matte. That is essential for hair, ears and other soft portrait boundaries.
 * The model and ONNX Runtime assets are served from /public/modnet so Android
 * WebView never needs blob: scripts or a paid/cloud background-removal API.
 */

let runtimePromise = null;
let sessionPromise = null;

function abortError() {
  return new DOMException("Background removal cancelled", "AbortError");
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function assetUrl(fileName) {
  return new URL(
    `${import.meta.env.BASE_URL}modnet/${fileName}`,
    window.location.href,
  ).href;
}

async function loadRuntime() {
  if (!runtimePromise) {
    runtimePromise = import("onnxruntime-web/wasm")
      .then((module) => {
        const ort = module.default || module;
        // A single WASM thread avoids SharedArrayBuffer/crossOriginIsolated
        // requirements in React Native WebView. Direct same-origin paths avoid
        // the blob: CSP failure that the previous engine hit.
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
        ort.env.wasm.wasmPaths = {
          wasm: assetUrl("ort-wasm-simd-threaded.wasm"),
          mjs: assetUrl("ort-wasm-simd-threaded.mjs"),
        };
        return ort;
      })
      .catch((error) => {
        runtimePromise = null;
        throw error;
      });
  }
  return runtimePromise;
}

async function fetchModel(onProgress) {
  const response = await fetch(assetUrl("modnet.onnx"), {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`Portrait model download failed (${response.status}).`);
  }

  const expectedSize = Number(response.headers.get("content-length")) || 0;
  if (!response.body?.getReader) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onProgress?.("Professional AI मॉडल तैयार है…", 38);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const ratio = expectedSize > 0 ? Math.min(1, received / expectedSize) : 0;
    onProgress?.(
      "Professional AI मॉडल पहली बार डाउनलोड हो रहा है…",
      8 + ratio * 30,
    );
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function getSession(onProgress) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const [ort, model] = await Promise.all([
        loadRuntime(),
        fetchModel(onProgress),
      ]);
      onProgress?.("Professional portrait engine शुरू हो रहा है…", 42);
      return ort.InferenceSession.create(model, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
        executionMode: "sequential",
        enableCpuMemArena: true,
      });
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close?.(),
      };
    } catch {
      // Some older Android camera decoders need the HTMLImage fallback.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    if (typeof image.decode === "function") await image.decode();
    else {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Selected image could not be read."));
      });
    }
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function getInferenceSize(width, height, referenceSize = 512) {
  let inferenceWidth = width;
  let inferenceHeight = height;
  if (Math.max(width, height) < referenceSize || Math.min(width, height) > referenceSize) {
    if (width >= height) {
      inferenceHeight = referenceSize;
      inferenceWidth = Math.round((width / height) * referenceSize);
    } else {
      inferenceWidth = referenceSize;
      inferenceHeight = Math.round((height / width) * referenceSize);
    }
  }

  inferenceWidth = Math.max(32, inferenceWidth - (inferenceWidth % 32));
  inferenceHeight = Math.max(32, inferenceHeight - (inferenceHeight % 32));
  return { width: inferenceWidth, height: inferenceHeight };
}

function smoothAlpha(value) {
  const normalized = Math.max(0, Math.min(1, (value - 0.012) / 0.976));
  return normalized * normalized * (3 - 2 * normalized);
}

function removeDetachedMatteParticles(values, width, height) {
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const components = [];
  let largestSize = 0;

  // Find real foreground islands on the small inference matte. Very faint
  // alpha is deliberately excluded here, otherwise a background line can
  // connect dust/noise to the portrait. This does not erode the final edge;
  // it only decides which islands are allowed to keep their soft alpha.
  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || values[start] < 0.055) continue;
    let head = 0;
    let tail = 1;
    queue[0] = start;
    visited[start] = 1;
    const members = [];

    while (head < tail) {
      const index = queue[head];
      head += 1;
      members.push(index);
      const x = index % width;
      let neighbour;
      if (x > 0) {
        neighbour = index - 1;
        if (!visited[neighbour] && values[neighbour] >= 0.055) {
          visited[neighbour] = 1;
          queue[tail++] = neighbour;
        }
      }
      if (x + 1 < width) {
        neighbour = index + 1;
        if (!visited[neighbour] && values[neighbour] >= 0.055) {
          visited[neighbour] = 1;
          queue[tail++] = neighbour;
        }
      }
      if (index >= width) {
        neighbour = index - width;
        if (!visited[neighbour] && values[neighbour] >= 0.055) {
          visited[neighbour] = 1;
          queue[tail++] = neighbour;
        }
      }
      if (index + width < pixelCount) {
        neighbour = index + width;
        if (!visited[neighbour] && values[neighbour] >= 0.055) {
          visited[neighbour] = 1;
          queue[tail++] = neighbour;
        }
      }
    }

    largestSize = Math.max(largestSize, members.length);
    components.push(members);
  }

  if (largestSize === 0) return values;
  const keep = new Uint8Array(pixelCount);
  const minimumIslandSize = Math.max(48, Math.round(largestSize * 0.006));
  for (const members of components) {
    if (members.length < minimumIslandSize) continue;
    for (const index of members) keep[index] = 1;
  }

  // Two inference pixels retain the continuous soft hair/ear boundary while
  // detached background specks remain outside the permitted portrait area.
  for (let pass = 0; pass < 2; pass += 1) {
    const expanded = new Uint8Array(keep);
    for (let index = 0; index < pixelCount; index += 1) {
      if (!keep[index]) continue;
      const x = index % width;
      if (x > 0) expanded[index - 1] = 1;
      if (x + 1 < width) expanded[index + 1] = 1;
      if (index >= width) expanded[index - width] = 1;
      if (index + width < pixelCount) expanded[index + width] = 1;
    }
    keep.set(expanded);
  }

  const cleaned = new Float32Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    cleaned[index] = keep[index] ? values[index] : 0;
  }
  return cleaned;
}

function decontaminateEdgeColours(pixels, alphaMap, width, height) {
  const cleaned = new Uint8ClampedArray(pixels);
  const radius = 4;

  for (let y = radius; y < height - radius; y += 1) {
    for (let x = radius; x < width - radius; x += 1) {
      const index = y * width + x;
      const alphaByte = alphaMap[index];
      if (alphaByte <= 10 || alphaByte >= 248) continue;

      let backgroundRed = 0;
      let backgroundGreen = 0;
      let backgroundBlue = 0;
      let backgroundCount = 0;
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const sampleIndex =
            (y + offsetY) * width + (x + offsetX);
          if (alphaMap[sampleIndex] > 5) continue;
          const sampleDataIndex = sampleIndex * 4;
          backgroundRed += pixels[sampleDataIndex];
          backgroundGreen += pixels[sampleDataIndex + 1];
          backgroundBlue += pixels[sampleDataIndex + 2];
          backgroundCount += 1;
        }
      }
      if (backgroundCount === 0) continue;

      backgroundRed /= backgroundCount;
      backgroundGreen /= backgroundCount;
      backgroundBlue /= backgroundCount;
      const alpha = alphaByte / 255;
      const dataIndex = index * 4;
      const strength = Math.min(0.9, Math.max(0.22, (1 - alpha) * 1.1));
      const safeAlpha = Math.max(alpha, 0.1);
      const reconstructedRed = Math.max(
        0,
        Math.min(255, (pixels[dataIndex] - (1 - alpha) * backgroundRed) / safeAlpha),
      );
      const reconstructedGreen = Math.max(
        0,
        Math.min(
          255,
          (pixels[dataIndex + 1] - (1 - alpha) * backgroundGreen) / safeAlpha,
        ),
      );
      const reconstructedBlue = Math.max(
        0,
        Math.min(
          255,
          (pixels[dataIndex + 2] - (1 - alpha) * backgroundBlue) / safeAlpha,
        ),
      );

      cleaned[dataIndex] = Math.round(
        pixels[dataIndex] * (1 - strength) + reconstructedRed * strength,
      );
      cleaned[dataIndex + 1] = Math.round(
        pixels[dataIndex + 1] * (1 - strength) + reconstructedGreen * strength,
      );
      cleaned[dataIndex + 2] = Math.round(
        pixels[dataIndex + 2] * (1 - strength) + reconstructedBlue * strength,
      );
    }
  }

  return cleaned;
}

export async function preloadModNet(onProgress) {
  await getSession(onProgress);
  return "modnet";
}

export async function removeBackgroundWithModNet(file, onProgress, signal) {
  throwIfAborted(signal);
  onProgress?.("Professional portrait model तैयार हो रहा है…", 6);
  const [ort, session, decoded] = await Promise.all([
    loadRuntime(),
    getSession(onProgress),
    decodeImage(file),
  ]);
  throwIfAborted(signal);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = decoded.width;
  sourceCanvas.height = decoded.height;
  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!sourceContext) {
    decoded.close();
    throw new Error("Canvas is unavailable on this device.");
  }
  sourceContext.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);
  decoded.close();

  const inferenceSize = getInferenceSize(sourceCanvas.width, sourceCanvas.height);
  const inferenceCanvas = document.createElement("canvas");
  inferenceCanvas.width = inferenceSize.width;
  inferenceCanvas.height = inferenceSize.height;
  const inferenceContext = inferenceCanvas.getContext("2d", {
    alpha: false,
    willReadFrequently: true,
  });
  if (!inferenceContext) throw new Error("Canvas is unavailable on this device.");
  inferenceContext.imageSmoothingEnabled = true;
  inferenceContext.imageSmoothingQuality = "high";
  inferenceContext.drawImage(
    sourceCanvas,
    0,
    0,
    inferenceCanvas.width,
    inferenceCanvas.height,
  );

  onProgress?.("AI बाल, कान और body की alpha edge बना रहा है…", 55);
  const inputPixels = inferenceContext.getImageData(
    0,
    0,
    inferenceCanvas.width,
    inferenceCanvas.height,
  ).data;
  const planeSize = inferenceCanvas.width * inferenceCanvas.height;
  const tensorData = new Float32Array(planeSize * 3);
  for (let sourceIndex = 0, pixelIndex = 0; sourceIndex < inputPixels.length; sourceIndex += 4, pixelIndex += 1) {
    tensorData[pixelIndex] = (inputPixels[sourceIndex] - 127.5) / 127.5;
    tensorData[pixelIndex + planeSize] =
      (inputPixels[sourceIndex + 1] - 127.5) / 127.5;
    tensorData[pixelIndex + planeSize * 2] =
      (inputPixels[sourceIndex + 2] - 127.5) / 127.5;
  }

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const feeds = {
    [inputName]: new ort.Tensor("float32", tensorData, [
      1,
      3,
      inferenceCanvas.height,
      inferenceCanvas.width,
    ]),
  };
  const results = await session.run(feeds);
  throwIfAborted(signal);
  const matteTensor = results[outputName];
  if (!matteTensor?.data?.length) {
    throw new Error("Professional portrait model returned an empty matte.");
  }

  const matteHeight = matteTensor.dims[matteTensor.dims.length - 2];
  const matteWidth = matteTensor.dims[matteTensor.dims.length - 1];
  const cleanMatte = removeDetachedMatteParticles(
    matteTensor.data,
    matteWidth,
    matteHeight,
  );
  const matteCanvas = document.createElement("canvas");
  matteCanvas.width = matteWidth;
  matteCanvas.height = matteHeight;
  const matteContext = matteCanvas.getContext("2d");
  if (!matteContext) throw new Error("Canvas is unavailable on this device.");
  const matteImage = matteContext.createImageData(matteWidth, matteHeight);
  for (let index = 0; index < cleanMatte.length; index += 1) {
    const value = Math.round(
      Math.max(0, Math.min(1, cleanMatte[index])) * 255,
    );
    const dataIndex = index * 4;
    matteImage.data[dataIndex] = value;
    matteImage.data[dataIndex + 1] = value;
    matteImage.data[dataIndex + 2] = value;
    matteImage.data[dataIndex + 3] = 255;
  }
  matteContext.putImageData(matteImage, 0, 0);

  onProgress?.("Background particles और edge colour साफ हो रहे हैं…", 86);
  const resizedMatteCanvas = document.createElement("canvas");
  resizedMatteCanvas.width = sourceCanvas.width;
  resizedMatteCanvas.height = sourceCanvas.height;
  const resizedMatteContext = resizedMatteCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!resizedMatteContext) throw new Error("Canvas is unavailable on this device.");
  resizedMatteContext.imageSmoothingEnabled = true;
  resizedMatteContext.imageSmoothingQuality = "high";
  resizedMatteContext.drawImage(
    matteCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );

  const sourceImage = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  const resizedMatte = resizedMatteContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  ).data;
  const alphaMap = new Uint8Array(sourceCanvas.width * sourceCanvas.height);
  let visiblePixels = 0;
  for (let pixelIndex = 0; pixelIndex < alphaMap.length; pixelIndex += 1) {
    const alpha = Math.round(smoothAlpha(resizedMatte[pixelIndex * 4] / 255) * 255);
    alphaMap[pixelIndex] = alpha;
    if (alpha >= 128) visiblePixels += 1;
  }
  if (visiblePixels < alphaMap.length * 0.001) {
    throw new Error("No clear person was found in this photo.");
  }

  const outputPixels = decontaminateEdgeColours(
    sourceImage.data,
    alphaMap,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  for (let pixelIndex = 0; pixelIndex < alphaMap.length; pixelIndex += 1) {
    const dataIndex = pixelIndex * 4;
    const alpha = alphaMap[pixelIndex];
    if (alpha <= 5) {
      outputPixels[dataIndex] = 0;
      outputPixels[dataIndex + 1] = 0;
      outputPixels[dataIndex + 2] = 0;
      outputPixels[dataIndex + 3] = 0;
    } else {
      outputPixels[dataIndex + 3] = alpha;
    }
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Canvas is unavailable on this device.");
  outputContext.putImageData(
    new ImageData(outputPixels, sourceCanvas.width, sourceCanvas.height),
    0,
    0,
  );

  onProgress?.("Lossless Transparent PNG तैयार हो रही है…", 97);
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Transparent PNG creation failed.")),
      "image/png",
    );
  });
}
