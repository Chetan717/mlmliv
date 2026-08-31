import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildAllTemplatesReturnPath,
  buildAllTemplatesSubtypePath,
  getAllTemplatesBackTarget,
  getAllTemplatesSubtype,
} from "../src/utils/allTemplatesNavigation.js";
import {
  buildEditorTemplateSeed,
  getEditorGraphicSelectionKey,
} from "../src/utils/editorTemplateSelection.js";
import { getAppBackTarget } from "../src/utils/appBackNavigation.js";
import {
  GRAPHICS_ROW_LIMIT,
  getSubtypeRowItems,
  groupTemplateGraphicsBySubtype,
} from "../src/pages/Homepage/Component/templateGraphicsView.js";

const graphic = (id) => ({
  id,
  url: `https://cdn.example/${id}.jpg`,
  suggestionImage: `https://cdn.example/showcase-${id}.jpg`,
});

test("category data is grouped by subtype and each horizontal row is capped at 10", () => {
  const sections = groupTemplateGraphicsBySubtype([
    {
      id: "parent-a",
      Subtype: "GOLD",
      GraphicsLink: Array.from({ length: 12 }, (_, index) => graphic(`a-${index}`)),
    },
    {
      id: "parent-b",
      Subtype: "SILVER",
      GraphicsLink: [graphic("b-0")],
    },
    {
      id: "parent-c",
      Subtype: "GOLD",
      GraphicsLink: [graphic("c-0")],
    },
  ]);

  assert.deepEqual(
    sections.map((section) => [section.subtype, section.items.length]),
    [
      ["GOLD", 13],
      ["SILVER", 1],
    ],
  );
  assert.equal(GRAPHICS_ROW_LIMIT, 10);
  assert.equal(getSubtypeRowItems(sections[0]).length, 10);
  assert.equal(sections[0].items[12]._template.id, "parent-c");
});

test("GraphicsLink identity stays exact even when raw graphic ids are duplicated", () => {
  const shared = { id: "same-id", url: "https://cdn.example/same.jpg" };
  const firstKey = getEditorGraphicSelectionKey(shared, "parent-a");
  const secondKey = getEditorGraphicSelectionKey(shared, "parent-b");

  assert.notEqual(firstKey, secondKey);
});

test("editor seed keeps the explicitly selected background first and identifiable", () => {
  const graphics = Array.from({ length: 25 }, (_, index) => graphic(`g-${index}`));
  const template = {
    id: "template-1",
    MainType: "General",
    type: "Motivational",
    Subtype: "Success",
    serial: 7,
    GraphicsLink: graphics,
  };
  const selectedGraphic = graphics[23];
  const seed = buildEditorTemplateSeed({
    template,
    selectedGraphic,
    companyId: "company-1",
  });

  assert.equal(seed.items.length, 20);
  assert.equal(seed.items[0].id, selectedGraphic.id);
  assert.equal(
    seed.selectedGraphicKey,
    getEditorGraphicSelectionKey(selectedGraphic, template.id),
  );
});

test("subtype grid URL round-trips and its back target is the category page", () => {
  const path = buildAllTemplatesSubtypePath("Rank & Gold");
  const search = path.slice(path.indexOf("?"));

  assert.equal(getAllTemplatesSubtype(search), "Rank & Gold");
  assert.equal(getAllTemplatesBackTarget(search), "/alltemp");
  assert.equal(getAllTemplatesBackTarget(""), "/");
  assert.equal(buildAllTemplatesReturnPath(search), path);
  assert.equal(buildAllTemplatesReturnPath(""), "/alltemp");
  assert.equal(getAppBackTarget("/alltemp", null, null, search), "/alltemp");
  assert.equal(getAppBackTarget("/alltemp", null, null, ""), "/");
});

test("View All renders GraphicsLink showcases instead of parent Showcase_url cards", async () => {
  const [source, editorListSource] = await Promise.all([
    readFile(
      new URL("../src/pages/Homepage/Component/AllTemplates.jsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/pages/Editor/components/ListOfTemplates.jsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(source, /groupTemplateGraphicsBySubtype/);
  assert.match(source, /getSubtypeRowItems\(section, GRAPHICS_ROW_LIMIT\)/);
  assert.match(source, /h-\[110px\] w-\[110px\]/);
  assert.doesNotMatch(source, /aspect-\[4\/5\]/);
  assert.match(source, /storeEditorTemplateSeed/);
  assert.doesNotMatch(source, /Showcase_url/);
  assert.match(editorListSource, /findEditorItemBySelectionKey/);
  assert.match(editorListSource, /selectedSelectionKey === getEditorGraphicSelectionKey/);
});
