import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { join, resolve } from "node:path";

import {
  cleanPortraitMatte,
  getInferenceSize,
  getSafeOutputSize,
} from "../src/pages/mainform/utils/modnetBg.js";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath) =>
  readFileSync(join(projectRoot, relativePath), "utf8");

test("quality inference keeps enough detail and caps panoramic images", () => {
  assert.deepEqual(getInferenceSize(800, 800), { width: 640, height: 640 });
  assert.deepEqual(getInferenceSize(4000, 1000), {
    width: 1024,
    height: 256,
  });
  assert.deepEqual(getInferenceSize(1000, 4000), {
    width: 256,
    height: 1024,
  });

  const unusual = getInferenceSize(317, 911);
  assert.equal(unusual.width % 32, 0);
  assert.equal(unusual.height % 32, 0);
  assert.ok(Math.max(unusual.width, unusual.height) <= 1024);
});

test("large source photos are downscaled without changing aspect ratio", () => {
  assert.deepEqual(getSafeOutputSize(800, 600), {
    width: 800,
    height: 600,
    scale: 1,
  });

  const large = getSafeOutputSize(8000, 6000);
  assert.deepEqual(
    { width: large.width, height: large.height },
    { width: 2048, height: 1536 },
  );
  assert.equal(large.width / large.height, 4 / 3);
});

test("portrait matte preserves weak ear detail but rejects detached background", () => {
  const width = 32;
  const height = 32;
  const matte = new Float32Array(width * height);
  const setRect = (left, top, right, bottom, value) => {
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        matte[y * width + x] = value;
      }
    }
  };

  // Main portrait.
  setRect(12, 7, 20, 28, 0.92);
  // Low-confidence ear connected to the head.
  setRect(10, 11, 11, 16, 0.08);
  // A sizeable, confident but detached background object.
  setRect(1, 20, 8, 29, 0.88);

  const cleaned = cleanPortraitMatte(matte, width, height);
  assert.ok(cleaned[13 * width + 10] > 0.03, "ear edge should survive");
  assert.ok(cleaned[12 * width + 15] > 0.85, "portrait core should survive");
  assert.equal(cleaned[24 * width + 4], 0, "detached background must be removed");
});

test("every Remove-BG path uses the quality engine with a local fallback", () => {
  const removeBg = read("src/pages/mainform/utils/removeBg.js");
  assert.match(removeBg, /model:\s*"medium"/);
  assert.match(removeBg, /removeWithImgly/);
  assert.match(removeBg, /removeWithModNet/);
  assert.match(removeBg, /removeBgWithMediaPipe/);
  assert.match(removeBg, /did not create transparency/);

  for (const path of [
    "src/pages/mainform/components/ImageUploadWithBgRemove.jsx",
    "src/pages/mainform/components/MultiImagePicker.jsx",
    "src/pages/Form/Mlmprofilemodal.jsx",
  ]) {
    assert.match(read(path), /mainform\/utils\/removeBg|\.\.\/utils\/removeBg/);
  }
});

test("Income achiever photo uses the shared Remove-BG flow", () => {
  const salesForm = read(
    "src/pages/mainform/components/SalesExecutiveForm.jsx",
  );

  assert.match(salesForm, /label="Upload achiever photo"/);
  assert.doesNotMatch(
    salesForm,
    /skipBackgroundRemoval=\{isIncome\}/,
    "Income must not bypass background removal for the achiever photo",
  );
});
