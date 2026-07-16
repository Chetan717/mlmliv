const GENERAL_TEMPLATE_TYPES = new Set([
  "Trending",
  "Festival",
  "Motivational",
  "Good_Morning",
  "Sport",
  "Daily_Life",
  "Devotional_Spiritual",
  "Leader_Quotes",
  "Health_Tips",
  "Greeting_Wishes",
  "ThankYou_Banner_B",
  "ThankYou_Birthday_Anniversary",
  "Today_Trending",
]);

function readSelectedType() {
  try {
    return JSON.parse(localStorage.getItem("selType") || "{}");
  } catch {
    return {};
  }
}

export function getEditorBackTarget(selectedType) {
  const current = selectedType?.type ? selectedType : readSelectedType();
  return GENERAL_TEMPLATE_TYPES.has(current?.type) ? "/" : "/mlmform";
}

export function isDirectEditorTemplate(type) {
  return GENERAL_TEMPLATE_TYPES.has(type);
}
