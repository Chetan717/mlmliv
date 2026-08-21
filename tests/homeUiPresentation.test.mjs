import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  buildHomeTemplateSections,
  getHomeTemplateSearchText,
} from "../src/pages/Homepage/Component/homeTemplatePresentation.js";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath) =>
  readFileSync(join(projectRoot, relativePath), "utf8");

const orderedTypes = [
  "Today_Trending",
  "Motivational",
  "Rank_Promotion",
  "Rank_Promotion_B",
  "Bonanza",
  "Welcome_Closing",
  "Training",
  "Meeting",
  "General_Meeting",
  "Achievements",
  "Income",
  "Anniversary_Birthday",
  "ThankYou_Banner_B",
  "ThankYou_Birthday_Anniversary",
  "Capping",
  "Good_Morning",
  "Sport",
  "Daily_Life",
  "Greeting_Wishes",
  "Health_Tips",
  "Devotional_Spiritual",
  "Leader_Quotes",
];

const groups = orderedTypes.map((type, index) => ({
  type,
  templates: [{ id: `${type}-${index}`, type }],
}));

test("Home template sections follow the product order and group related types", () => {
  const sections = buildHomeTemplateSections([...groups].reverse());

  assert.deepEqual(
    sections.map((section) => section.title),
    [
      "Today Trending",
      "Motivational",
      "Rank Promotion",
      "Bonanza",
      "Welcome Closing",
      "Training",
      "Meeting",
      "General Meeting",
      "Achievements",
      "Income",
      "Anniversary Birthday",
      "Thank You",
      "Capping",
      "Everyday Moments",
    ],
  );

  assert.deepEqual(
    sections.find((section) => section.id === "rank-promotion").entries.map(
      (entry) => entry.type,
    ),
    ["Rank_Promotion", "Rank_Promotion_B"],
  );
  assert.deepEqual(
    sections.find((section) => section.id === "thank-you").entries.map(
      (entry) => entry.type,
    ),
    ["ThankYou_Banner_B", "ThankYou_Birthday_Anniversary"],
  );
  assert.deepEqual(
    sections.find((section) => section.id === "everyday-moments").entries.map(
      (entry) => entry.type,
    ),
    [
      "Good_Morning",
      "Sport",
      "Daily_Life",
      "Greeting_Wishes",
      "Health_Tips",
      "Devotional_Spiritual",
      "Leader_Quotes",
    ],
  );
});

test("group display names remain searchable", () => {
  assert.match(getHomeTemplateSearchText("Good_Morning"), /everyday moments/);
  assert.match(getHomeTemplateSearchText("ThankYou_Banner_B"), /thank you/);
  assert.match(getHomeTemplateSearchText("Rank_Promotion_B"), /rank promotion b/);
});

test("Home keeps special layouts and applies the new default tile dimensions", () => {
  const list = read("src/pages/Homepage/Component/ListOfGenaraltemp.jsx");
  assert.match(list, /const GRID_TYPES/);
  assert.match(list, /const FULL_TYPES/);
  assert.match(list, /const CIRCLE_TYPES/);
  assert.match(list, /w-\[100px\] card-press/);
  assert.match(list, /h-\[130px\] w-full rounded-md/);
  assert.match(list, /w-\[60px\] h-\[60px\] rounded-full/);
});

test("Festival precedes trending and Home has sticky search plus pull refresh", () => {
  const home = read("src/pages/Home.jsx");
  const renderStart = home.indexOf("const pullIndicatorHeight");
  const festivalIndex = home.indexOf("<Festival", renderStart);
  const carouselIndex = home.indexOf("<Carosel", renderStart);

  assert.ok(festivalIndex > renderStart);
  assert.ok(carouselIndex > festivalIndex);
  assert.match(home, /sticky top-0 z-40/);
  assert.match(home, /addEventListener\("touchmove", handleTouchMove/);
  assert.match(home, /consumeRefreshAttempt\(auth\.currentUser\?\.uid\)/);
  assert.match(home, /await refreshHomeData\(\)/);
});
