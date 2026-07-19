/**
 * Free, on-device background removal.
 *
 * Images never leave the browser. The AI model is downloaded once and then
 * reused from the browser cache. Normal browsers use IMG.LY; embedded React
 * Native WebViews use MODNet portrait matting so hair and ears get a real
 * continuous alpha edge instead of MediaPipe's low-resolution binary mask.
 */

const MODEL_PUBLIC_PATH = import.meta.env.VITE_BG_MODEL_PATH?.trim();

let enginePromise = null;
let preloadPromise = null;
let mediaPipePromise = null;
let modNetPromise = null;
let preferredDevice = null;
let configRevision = 0;
let activeProgress = null;
let processingTail = Promise.resolve();

function abortError() {
  return new DOMException("Background removal cancelled", "AbortError");
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function emitProgress(stage, percentage) {
  if (!activeProgress) return;
  const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  activeProgress(stage, safePercentage);
}

function engineProgress(key, current, total) {
  const ratio = total > 0 ? Math.min(1, current / total) : 0;

  if (key.startsWith("fetch:/models/")) {
    emitProgress("AI मॉडल पहली बार तैयार हो रहा है…", 5 + ratio * 50);
    return;
  }
  if (key.includes(".wasm")) {
    emitProgress("AI इंजन तैयार किया जा रहा है…", 55 + ratio * 15);
    return;
  }
  if (key.includes(".mjs")) {
    emitProgress("AI फोटो प्रोसेसिंग शुरू हो रही है…", 70 + ratio * 10);
    return;
  }

  const computeProgress = {
    "compute:decode": ["फोटो पढ़ी और पहचानी जा रही है…", 82],
    "compute:inference": ["AI बैकग्राउंड हटा रहा है…", 88],
    "compute:mask": ["बाल और किनारे साफ किए जा रहे हैं…", 95],
    "compute:encode": ["Transparent Photo तैयार हो रही है…", current >= total ? 100 : 98],
  };
  const update = computeProgress[key];
  if (update) emitProgress(update[0], update[1]);
}

function isEmbeddedWebView() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  // React Native exposes this bridge when onMessage is configured. Android
  // System WebView also includes the `wv` token in its user agent. iOS
  // WKWebView contains AppleWebKit + Mobile but not the Safari token.
  if (window.ReactNativeWebView) return true;
  const userAgent = navigator.userAgent || "";
  return (
    /(?:^|[;\s])wv(?:[);\s]|$)/i.test(userAgent) ||
    /(?:iPhone|iPad|iPod).*AppleWebKit.*Mobile(?!.*Safari)/i.test(userAgent)
  );
}

function reportNativeFailure(error) {
  try {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "REMOVE_BG_ERROR",
        message: error?.message || String(error),
      }),
    );
  } catch {
    // Diagnostics must never hide the original processing error.
  }
}

async function loadMediaPipeSegmenter() {
  if (!mediaPipePromise) {
    mediaPipePromise = import("@mediapipe/selfie_segmentation")
      .then(async (module) => {
        const SelfieSegmentation =
          module.SelfieSegmentation ||
          module.default?.SelfieSegmentation ||
          module.default;
        if (typeof SelfieSegmentation !== "function") {
          throw new Error("WebView background-removal engine is unavailable.");
        }

        const assetBase = new URL(
          `${import.meta.env.BASE_URL}mediapipe-selfie/`,
          window.location.href,
        );
        const segmenter = new SelfieSegmentation({
          locateFile: (fileName) => new URL(fileName, assetBase).href,
        });
        segmenter.setOptions({ modelSelection: 0, selfieMode: false });
        await segmenter.initialize();
        return segmenter;
      })
      .catch((error) => {
        mediaPipePromise = null;
        throw error;
      });
  }
  return mediaPipePromise;
}

async function loadEngine() {
  if (!enginePromise) {
    enginePromise = import("@imgly/background-removal").catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

async function loadModNetEngine() {
  if (!modNetPromise) {
    modNetPromise = import("./modnetBg.js").catch((error) => {
      modNetPromise = null;
      throw error;
    });
  }
  return modNetPromise;
}

function getPreferredDevice() {
  if (preferredDevice) return preferredDevice;
  preferredDevice =
    typeof navigator !== "undefined" && navigator.gpu ? "gpu" : "cpu";
  return preferredDevice;
}

function createConfig(device) {
  return {
    // "small" is the fast ~40 MB quantized model. It is the best balance for
    // phones and is cached after the first download.
    model: "small",
    device,
    proxyToWorker: false,
    rescale: true,
    debug: false,
    output: {
      // Ask the engine for raw pixels and encode them ourselves below. Some
      // Android WebViews expose a normal HTMLCanvas without convertToBlob(),
      // which makes IMG.LY's direct PNG encoder throw after inference.
      format: "image/x-rgba8",
      quality: 1,
    },
    fetchArgs: { cache: "force-cache" },
    progress: engineProgress,
    ...(MODEL_PUBLIC_PATH ? { publicPath: MODEL_PUBLIC_PATH } : {}),

    // IMG.LY memoizes a session from the JSON form of this object. This value
    // lets refreshRemoveBgKeys() recover from a transient failed download.
    _cacheKey: configRevision,
  };
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
      // Older Android WebViews occasionally expose createImageBitmap but fail
      // to decode camera images. Fall through to the HTML image decoder.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
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
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function createSquareInputCanvas(file, maxSize) {
  const decoded = await decodeImage(file);
  const longestSide = Math.max(decoded.width, decoded.height);
  const size = Math.max(1, Math.min(maxSize, longestSide));
  const scale = Math.min(1, size / longestSide);
  const drawWidth = Math.max(1, Math.round(decoded.width * scale));
  const drawHeight = Math.max(1, Math.round(decoded.height * scale));

  // The model itself works at 1024×1024. Sending a huge 4K/8K photo only
  // increases decode, mask-resize and PNG time. A square, aspect-preserving
  // 1280px working image is much faster and is still ample for app templates.
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    decoded.close();
    throw new Error("Canvas is unavailable on this device.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(
    decoded.source,
    Math.round((size - drawWidth) / 2),
    Math.round((size - drawHeight) / 2),
    drawWidth,
    drawHeight,
  );
  decoded.close();
  return canvas;
}

async function prepareFastAiInput(file, maxSize = 1280) {
  const canvas = await createSquareInputCanvas(file, maxSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Fast AI image preparation failed.")),
      "image/webp",
      0.92,
    );
  });
}

function refineConfidenceWithImage(
  confidenceMap,
  sourcePixels,
  width,
  height,
) {
  // MediaPipe's general selfie model produces a 256px confidence mask. When
  // that mask is enlarged for a phone photo, interpolation can put high mask
  // values over a bright background rim. A compact joint-bilateral pass uses
  // the original photo as the guide: confidence is smoothed across similar
  // colours, but not across a real hair/skin-to-background colour edge.
  let current = confidenceMap;
  const radius = 2;

  for (let pass = 0; pass < 2; pass += 1) {
    const refined = current.slice();
    for (let y = radius; y < height - radius; y += 1) {
      for (let x = radius; x < width - radius; x += 1) {
        const index = y * width + x;
        const centerConfidence = current[index];
        if (centerConfidence <= 5 || centerConfidence >= 250) continue;

        const dataIndex = index * 4;
        const centerRed = sourcePixels[dataIndex];
        const centerGreen = sourcePixels[dataIndex + 1];
        const centerBlue = sourcePixels[dataIndex + 2];
        let confidenceSum = centerConfidence * 6;
        let weightSum = 6;

        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
          for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) continue;
            const neighbour = index + offsetY * width + offsetX;
            const neighbourDataIndex = neighbour * 4;
            const redDifference = sourcePixels[neighbourDataIndex] - centerRed;
            const greenDifference =
              sourcePixels[neighbourDataIndex + 1] - centerGreen;
            const blueDifference =
              sourcePixels[neighbourDataIndex + 2] - centerBlue;
            const colourDistanceSquared =
              redDifference * redDifference +
              greenDifference * greenDifference +
              blueDifference * blueDifference;
            const spatialWeight =
              6 - Math.abs(offsetX) - Math.abs(offsetY);
            const colourWeight = 1 / (1 + colourDistanceSquared / 1100);
            const weight = spatialWeight * colourWeight;
            confidenceSum += current[neighbour] * weight;
            weightSum += weight;
          }
        }

        refined[index] = Math.round(confidenceSum / weightSum);
      }
    }
    current = refined;
  }

  return current;
}

function colourDistanceSquared(red, green, blue, otherRed, otherGreen, otherBlue) {
  const redDifference = red - otherRed;
  const greenDifference = green - otherGreen;
  const blueDifference = blue - otherBlue;
  return (
    redDifference * redDifference +
    greenDifference * greenDifference +
    blueDifference * blueDifference
  );
}

function createCleanPersonCutout(segmentationMask, sourceCanvas) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskContext = maskCanvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  });
  if (!maskContext) throw new Error("Canvas is unavailable on this device.");

  maskContext.clearRect(0, 0, width, height);
  maskContext.drawImage(segmentationMask, 0, 0, width, height);
  const maskData = maskContext.getImageData(0, 0, width, height);
  const pixels = maskData.data;
  const sourceContext = sourceCanvas.getContext("2d", {
    alpha: false,
    willReadFrequently: true,
  });
  if (!sourceContext) throw new Error("Canvas is unavailable on this device.");
  const sourcePixels = sourceContext.getImageData(0, 0, width, height).data;

  // MediaPipe usually stores confidence in alpha. A few WebView GPU drivers
  // expose it as a grayscale texture instead, so detect the available channel.
  let minAlpha = 255;
  let maxAlpha = 0;
  for (let index = 3; index < pixels.length; index += 64) {
    minAlpha = Math.min(minAlpha, pixels[index]);
    maxAlpha = Math.max(maxAlpha, pixels[index]);
  }
  const confidenceIsAlpha = maxAlpha - minAlpha > 12;

  // Build a hard foreground mask. MediaPipe's normal soft matte contains
  // semi-transparent background colors around the body; a binary cutout is
  // required here so WebView scaling cannot bring that halo back.
  const totalPixels = width * height;
  let confidenceMap = new Uint8Array(totalPixels);
  const foreground = new Uint8Array(totalPixels);
  let personTop = height;
  let personBottom = -1;
  let foregroundCount = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const confidence = confidenceIsAlpha
      ? pixels[index + 3] / 255
      : (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (255 * 3);
    const pixelIndex = index / 4;
    confidenceMap[pixelIndex] = Math.round(confidence * 255);
  }

  confidenceMap = refineConfidenceWithImage(
    confidenceMap,
    sourcePixels,
    width,
    height,
  );

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const confidence = confidenceMap[pixelIndex] / 255;
    if (confidence >= 0.42) {
      const y = Math.floor(pixelIndex / width);
      personTop = Math.min(personTop, y);
      personBottom = Math.max(personBottom, y);
    }
  }

  const hasPersonBounds = personBottom >= personTop;
  const protectedHeadEnd = hasPersonBounds
    ? personTop + Math.round((personBottom - personTop) * 0.42)
    : Math.round(height * 0.4);

  // Ears and hair are naturally lower-confidence than the face and torso.
  // Preserve them with a gentler cutoff in the upper part of the person,
  // while retaining a stricter body cutoff to reject background objects.
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const y = Math.floor(pixelIndex / width);
    const cutoff = y <= protectedHeadEnd ? 0.55 : 0.68;
    if (confidenceMap[pixelIndex] / 255 >= cutoff) {
      foreground[pixelIndex] = 1;
      foregroundCount += 1;
    }
  }

  // Avoid returning a blank image for unusually dark/low-contrast photos.
  if (foregroundCount === 0) {
    for (let index = 0; index < pixels.length; index += 4) {
      foreground[index / 4] = confidenceMap[index / 4] / 255 >= 0.5 ? 1 : 0;
    }
  }

  // Keep only the main connected person. Detached high-confidence specks are
  // background mistakes and are removed before edge processing.
  const labels = new Uint32Array(totalPixels);
  const queue = new Uint32Array(totalPixels);
  let label = 0;
  let largestLabel = 0;
  let largestArea = 0;
  for (let start = 0; start < totalPixels; start += 1) {
    if (!foreground[start] || labels[start]) continue;
    label += 1;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = label;

    while (head < tail) {
      const current = queue[head++];
      const x = current % width;
      let neighbour;
      if (x > 0) {
        neighbour = current - 1;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      if (x + 1 < width) {
        neighbour = current + 1;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      if (current >= width) {
        neighbour = current - width;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      if (current + width < totalPixels) {
        neighbour = current + width;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      // Diagonal connectivity keeps thin ears, hair strands and fingers
      // attached to the main person instead of treating them as noise.
      if (x > 0 && current >= width) {
        neighbour = current - width - 1;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      if (x + 1 < width && current >= width) {
        neighbour = current - width + 1;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      if (x > 0 && current + width < totalPixels) {
        neighbour = current + width - 1;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
      if (x + 1 < width && current + width < totalPixels) {
        neighbour = current + width + 1;
        if (foreground[neighbour] && !labels[neighbour]) {
          labels[neighbour] = label;
          queue[tail++] = neighbour;
        }
      }
    }

    if (tail > largestArea) {
      largestArea = tail;
      largestLabel = label;
    }
  }

  let cleanForeground = new Uint8Array(totalPixels);
  for (let index = 0; index < totalPixels; index += 1) {
    cleanForeground[index] =
      largestLabel !== 0 && labels[index] === largestLabel ? 1 : 0;
  }

  // Compare every boundary pixel with its *local* outside and inside colours.
  // The old corner sampler saw the white square padding instead of the real
  // photo background, so coloured particles survived and white rims could be
  // retained. Local sampling works for every backdrop and keeps skin/ears when
  // they match the inner-person colour.
  for (let pass = 0; pass < 10; pass += 1) {
    const decontaminated = cleanForeground.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!cleanForeground[index]) continue;
        const isBoundary =
          !cleanForeground[index - 1] ||
          !cleanForeground[index + 1] ||
          !cleanForeground[index - width] ||
          !cleanForeground[index + width];
        if (!isBoundary) continue;

        const dataIndex = index * 4;
        const red = sourcePixels[dataIndex];
        const green = sourcePixels[dataIndex + 1];
        const blue = sourcePixels[dataIndex + 2];
        let outsideRed = 0;
        let outsideGreen = 0;
        let outsideBlue = 0;
        let outsideCount = 0;
        let insideRed = 0;
        let insideGreen = 0;
        let insideBlue = 0;
        let insideWeight = 0;

        for (let offsetY = -4; offsetY <= 4; offsetY += 1) {
          const sampleY = y + offsetY;
          if (sampleY < 0 || sampleY >= height) continue;
          for (let offsetX = -4; offsetX <= 4; offsetX += 1) {
            const sampleX = x + offsetX;
            if (sampleX < 0 || sampleX >= width) continue;
            if (offsetX === 0 && offsetY === 0) continue;
            const sampleIndex = sampleY * width + sampleX;
            const sampleDataIndex = sampleIndex * 4;
            const distance = Math.max(Math.abs(offsetX), Math.abs(offsetY));

            if (!cleanForeground[sampleIndex] && distance <= 3) {
              outsideRed += sourcePixels[sampleDataIndex];
              outsideGreen += sourcePixels[sampleDataIndex + 1];
              outsideBlue += sourcePixels[sampleDataIndex + 2];
              outsideCount += 1;
            } else if (
              cleanForeground[sampleIndex] &&
              confidenceMap[sampleIndex] >= 178
            ) {
              const weight = confidenceMap[sampleIndex] / (255 * distance);
              insideRed += sourcePixels[sampleDataIndex] * weight;
              insideGreen += sourcePixels[sampleDataIndex + 1] * weight;
              insideBlue += sourcePixels[sampleDataIndex + 2] * weight;
              insideWeight += weight;
            }
          }
        }

        if (outsideCount === 0 || insideWeight === 0) continue;
        outsideRed /= outsideCount;
        outsideGreen /= outsideCount;
        outsideBlue /= outsideCount;
        insideRed /= insideWeight;
        insideGreen /= insideWeight;
        insideBlue /= insideWeight;

        const backgroundDistanceSquared = colourDistanceSquared(
          red,
          green,
          blue,
          outsideRed,
          outsideGreen,
          outsideBlue,
        );
        const personDistanceSquared = colourDistanceSquared(
          red,
          green,
          blue,
          insideRed,
          insideGreen,
          insideBlue,
        );
        const brightest = Math.max(red, green, blue);
        const darkest = Math.min(red, green, blue);
        const neutralLightSpill = darkest >= 178 && brightest - darkest <= 42;
        const likelySkin =
          red >= 95 &&
          green >= 40 &&
          blue >= 20 &&
          red > green &&
          red > blue &&
          Math.abs(red - green) >= 15 &&
          brightest - darkest >= 15;
        const confidence = confidenceMap[index] / 255;
        const clearlyMatchesBackground =
          backgroundDistanceSquared + 1200 < personDistanceSquared * 0.72;
        const strongBackgroundMatch =
          backgroundDistanceSquared <= 38 * 38 * 3 &&
          personDistanceSquared >= 48 * 48;
        const extremeBackgroundMatch =
          backgroundDistanceSquared <= 24 * 24 * 3 &&
          personDistanceSquared >= 70 * 70 * 3;

        const shouldRemove =
          extremeBackgroundMatch ||
          (clearlyMatchesBackground && confidence < 0.97) ||
          (strongBackgroundMatch && confidence < 0.985) ||
          (neutralLightSpill && clearlyMatchesBackground && confidence < 0.992);
        const safelyRemovableSkinSpill =
          extremeBackgroundMatch &&
          confidence < 0.82;

        if (shouldRemove && (!likelySkin || safelyRemovableSkinSpill)) {
          decontaminated[index] = 0;
        }
      }
    }
    cleanForeground = decontaminated;
  }

  // Use only one erosion pass, and never erode the protected head region.
  // This cleans the body outline without shrinking ears or the top of hair.
  const eroded = new Uint8Array(totalPixels);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (y <= protectedHeadEnd || x === 0 || y === 0 || x + 1 === width || y + 1 === height) {
        eroded[index] = cleanForeground[index];
        continue;
      }
      eroded[index] =
        cleanForeground[index] &&
        cleanForeground[index - 1] &&
        cleanForeground[index + 1] &&
        cleanForeground[index - width] &&
        cleanForeground[index + width]
          ? 1
          : 0;
    }
  }
  cleanForeground = eroded;

  // A small majority filter removes isolated 1–2px foreground particles and
  // fills tiny pinholes without changing real facial features. Two lightweight
  // passes also smooth the stair-step outline from the 256px MediaPipe mask.
  for (let pass = 0; pass < 2; pass += 1) {
    const smoothed = cleanForeground.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const neighbours =
          cleanForeground[index - width - 1] +
          cleanForeground[index - width] +
          cleanForeground[index - width + 1] +
          cleanForeground[index - 1] +
          cleanForeground[index + 1] +
          cleanForeground[index + width - 1] +
          cleanForeground[index + width] +
          cleanForeground[index + width + 1];
        if (cleanForeground[index]) {
          if (neighbours <= 2) smoothed[index] = 0;
        } else if (neighbours >= 7) {
          smoothed[index] = 1;
        }
      }
    }
    cleanForeground = smoothed;
  }

  // Measure the first three *inside* edge layers. Feathering only inside the
  // cleaned silhouette prevents background pixels from being reintroduced.
  const edgeDepth = new Uint8Array(totalPixels);
  let remaining = cleanForeground.slice();
  for (let depth = 1; depth <= 3; depth += 1) {
    const nextRemaining = remaining.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!remaining[index]) continue;
        if (
          !remaining[index - 1] ||
          !remaining[index + 1] ||
          !remaining[index - width] ||
          !remaining[index + width]
        ) {
          edgeDepth[index] = depth;
          nextRemaining[index] = 0;
        }
      }
    }
    remaining = nextRemaining;
  }

  // White/grey halo is frequently baked into the RGB values of otherwise
  // valid foreground edge pixels. Pull only contaminated edge colours toward
  // nearby high-confidence inner-person colours. This preserves the shape of
  // fine hair and ears instead of eroding them to solve colour spill.
  const cleanedPixels = new Uint8ClampedArray(sourcePixels);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const depth = edgeDepth[index];
      if (!depth || !cleanForeground[index]) continue;

      let insideRed = 0;
      let insideGreen = 0;
      let insideBlue = 0;
      let insideWeight = 0;
      let outsideRed = 0;
      let outsideGreen = 0;
      let outsideBlue = 0;
      let outsideCount = 0;

      for (let offsetY = -6; offsetY <= 6; offsetY += 1) {
        const sampleY = y + offsetY;
        if (sampleY < 0 || sampleY >= height) continue;
        for (let offsetX = -6; offsetX <= 6; offsetX += 1) {
          const sampleX = x + offsetX;
          if (sampleX < 0 || sampleX >= width) continue;
          if (offsetX === 0 && offsetY === 0) continue;
          const distance = Math.max(Math.abs(offsetX), Math.abs(offsetY));
          const sampleIndex = sampleY * width + sampleX;
          const sampleDataIndex = sampleIndex * 4;

          if (!cleanForeground[sampleIndex] && distance <= 3) {
            outsideRed += sourcePixels[sampleDataIndex];
            outsideGreen += sourcePixels[sampleDataIndex + 1];
            outsideBlue += sourcePixels[sampleDataIndex + 2];
            outsideCount += 1;
          } else if (
            cleanForeground[sampleIndex] &&
            (edgeDepth[sampleIndex] === 0 || edgeDepth[sampleIndex] > depth) &&
            confidenceMap[sampleIndex] >= 185
          ) {
            const weight = confidenceMap[sampleIndex] / (255 * distance);
            insideRed += sourcePixels[sampleDataIndex] * weight;
            insideGreen += sourcePixels[sampleDataIndex + 1] * weight;
            insideBlue += sourcePixels[sampleDataIndex + 2] * weight;
            insideWeight += weight;
          }
        }
      }

      if (insideWeight === 0) continue;
      insideRed /= insideWeight;
      insideGreen /= insideWeight;
      insideBlue /= insideWeight;
      const dataIndex = index * 4;
      const red = sourcePixels[dataIndex];
      const green = sourcePixels[dataIndex + 1];
      const blue = sourcePixels[dataIndex + 2];
      let blend = depth === 1 ? 0.32 : depth === 2 ? 0.18 : 0.08;

      if (outsideCount > 0) {
        outsideRed /= outsideCount;
        outsideGreen /= outsideCount;
        outsideBlue /= outsideCount;
        const backgroundDistance = colourDistanceSquared(
          red,
          green,
          blue,
          outsideRed,
          outsideGreen,
          outsideBlue,
        );
        const personDistance = colourDistanceSquared(
          red,
          green,
          blue,
          insideRed,
          insideGreen,
          insideBlue,
        );
        if (backgroundDistance + 900 < personDistance) {
          blend = depth === 1 ? 0.9 : depth === 2 ? 0.68 : 0.38;
        }
      }

      cleanedPixels[dataIndex] = Math.round(
        red * (1 - blend) + insideRed * blend,
      );
      cleanedPixels[dataIndex + 1] = Math.round(
        green * (1 - blend) + insideGreen * blend,
      );
      cleanedPixels[dataIndex + 2] = Math.round(
        blue * (1 - blend) + insideBlue * blend,
      );
    }
  }

  // Write the transparent cutout directly. This avoids an additional canvas
  // composite step that can re-premultiply light mask-edge pixels in WebViews.
  for (let index = 0; index < totalPixels; index += 1) {
    const dataIndex = index * 4;
    if (!cleanForeground[index]) {
      cleanedPixels[dataIndex] = 0;
      cleanedPixels[dataIndex + 1] = 0;
      cleanedPixels[dataIndex + 2] = 0;
      cleanedPixels[dataIndex + 3] = 0;
      continue;
    }
    cleanedPixels[dataIndex + 3] =
      edgeDepth[index] === 1 ? 210 : edgeDepth[index] === 2 ? 242 : 255;
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Canvas is unavailable on this device.");
  outputContext.putImageData(
    new ImageData(cleanedPixels, width, height),
    0,
    0,
  );
  return outputCanvas;
}

async function removeBgWithMediaPipe(file, signal) {
  emitProgress("WebView के लिए तेज AI मॉडल तैयार हो रहा है…", 10);
  const [segmenter, inputCanvas] = await Promise.all([
    loadMediaPipeSegmenter(),
    createSquareInputCanvas(file, 1024),
  ]);
  throwIfAborted(signal);
  emitProgress("AI फोटो में व्यक्ति को पहचान रहा है…", 55);

  const results = await new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      callback(value);
    };
    const timeoutId = window.setTimeout(
      () => finish(reject, new Error("WebView AI processing timed out.")),
      60_000,
    );

    segmenter.onResults((value) => finish(resolve, value));
    segmenter
      .send({ image: inputCanvas })
      .catch((error) => finish(reject, error));
  });

  throwIfAborted(signal);
  if (!results?.segmentationMask) {
    throw new Error("AI could not create a person mask from this image.");
  }

  emitProgress("फोटो के किनारे साफ किए जा रहे हैं…", 88);
  const outputCanvas = createCleanPersonCutout(
    results.segmentationMask,
    inputCanvas,
  );

  emitProgress("Transparent Photo तैयार हो रही है…", 97);
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

async function rawRgbaToPng(rawBlob) {
  const params = Object.fromEntries(
    rawBlob.type
      .split(";")
      .slice(1)
      .map((part) => part.trim().split("=")),
  );
  const width = Number(params.width);
  const height = Number(params.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error("The AI engine returned invalid image dimensions.");
  }

  const pixels = new Uint8ClampedArray(await rawBlob.arrayBuffer());
  if (pixels.length !== width * height * 4) {
    throw new Error("The AI engine returned incomplete image pixels.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable on this device.");
  context.putImageData(new ImageData(pixels, width, height), 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Transparent PNG creation failed.")),
      "image/png",
    );
  });
}

async function preloadDevice(device) {
  const { preload } = await loadEngine();
  await preload(createConfig(device));
  return device;
}

/** Download and initialise the local model without uploading any photo. */
export async function preloadBgModel(onProgress) {
  if (typeof window === "undefined") return "unavailable";
  if (onProgress) activeProgress = onProgress;

  if (!preloadPromise) {
    preloadPromise = (async () => {
      if (isEmbeddedWebView()) {
        emitProgress("Professional portrait AI मॉडल तैयार हो रहा है…", 5);
        const { preloadModNet } = await loadModNetEngine();
        return preloadModNet((stage, percentage) =>
          emitProgress(stage, percentage),
        );
      }

      const device = getPreferredDevice();
      try {
        return await preloadDevice(device);
      } catch (error) {
        if (device !== "gpu") throw error;

        // A few devices expose WebGPU but cannot run this particular model.
        // Retry once with the widely-supported CPU/WASM engine.
        preferredDevice = "cpu";
        emitProgress("Compatible AI mode शुरू किया जा रहा है…", 8);
        return preloadDevice("cpu");
      }
    })().catch((error) => {
      preloadPromise = null;
      configRevision += 1;
      throw error;
    });
  }

  return preloadPromise;
}

function raceWithAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

function queueProcessing(task, signal) {
  // ONNX sessions are fastest and most stable when one image is processed at
  // a time. A cancelled caller returns immediately, while the internal queue
  // still waits for any already-running inference to finish safely.
  const scheduled = processingTail.then(async () => {
    throwIfAborted(signal);
    return task();
  });
  processingTail = scheduled.catch(() => {});
  return raceWithAbort(scheduled, signal);
}

/**
 * Remove a background entirely on the user's device.
 *
 * @param {File|Blob} file
 * @param {(stage: string, pct: number) => void} [onProgress]
 * @param {AbortSignal} [signal]
 * @returns {Promise<Blob>} transparent PNG
 */
export async function removeBg(file, onProgress, signal) {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error("Please select a valid image.");
  }
  throwIfAborted(signal);
  onProgress?.("फ्री AI बैकग्राउंड रिमूवर तैयार हो रहा है…", 2);

  return queueProcessing(async () => {
    throwIfAborted(signal);
    activeProgress = onProgress || null;

    try {
      if (isEmbeddedWebView()) {
        const { removeBackgroundWithModNet } = await loadModNetEngine();
        const result = await removeBackgroundWithModNet(
          file,
          (stage, percentage) => emitProgress(stage, percentage),
          signal,
        );
        throwIfAborted(signal);
        emitProgress("फोटो तैयार है", 100);
        return result;
      }

      const engine = await loadEngine();
      await preloadBgModel(onProgress);
      throwIfAborted(signal);
      emitProgress("फोटो को तेज AI प्रोसेसिंग के लिए तैयार किया जा रहा है…", 80);
      const aiInput = await prepareFastAiInput(file);
      throwIfAborted(signal);

      // v1.7 exposes removeBackground as a named export at runtime. Some
      // bundlers also provide a default export, so support both shapes.
      const removeBackground =
        engine.removeBackground ||
        engine.default?.removeBackground ||
        engine.default;
      if (typeof removeBackground !== "function") {
        throw new Error("Background-removal function is unavailable.");
      }

      let device = getPreferredDevice();
      let result;
      try {
        result = await removeBackground(aiInput, createConfig(device));
      } catch (gpuError) {
        if (device !== "gpu" || signal?.aborted) throw gpuError;

        // WebGPU can initialise successfully and still fail on a particular
        // phone/driver during inference. Retry that photo once on CPU.
        preferredDevice = "cpu";
        configRevision += 1;
        preloadPromise = null;
        emitProgress("Compatible AI mode शुरू किया जा रहा है…", 10);
        await preloadDevice("cpu");
        throwIfAborted(signal);
        result = await removeBackground(aiInput, createConfig("cpu"));
      }
      throwIfAborted(signal);

      if (!(result instanceof Blob) || result.size === 0) {
        throw new Error("The background remover returned an empty image.");
      }
      result = await rawRgbaToPng(result);
      emitProgress("फोटो तैयार है", 100);
      return result;
    } catch (error) {
      if (error?.name === "AbortError" || signal?.aborted) throw abortError();
      console.error("[removeBg] On-device background removal failed:", error);
      reportNativeFailure(error);
      throw new Error(
        isEmbeddedWebView()
          ? "Professional background removal failed. First use पर internet चालू रखें ताकि free AI model download हो सके, फिर try करें."
          : "Free background removal could not start. Check the internet once so the AI model can download, then try again.",
        { cause: error },
      );
    } finally {
      activeProgress = null;
    }
  }, signal);
}

/** Force a clean model retry after a failed/corrupt browser download. */
export function refreshRemoveBgKeys() {
  configRevision += 1;
  preloadPromise = null;
}
