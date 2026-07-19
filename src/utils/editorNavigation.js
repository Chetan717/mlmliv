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

const EDITOR_BACK_TARGET_KEY = "mlmlive-editor-back-target";
const VALID_BACK_TARGETS = new Set(["/", "/mlmform"]);

function readSelectedType() {
  try {
    return JSON.parse(localStorage.getItem("selType") || "{}");
  } catch {
    return {};
  }
}

function readRememberedBackTarget(current) {
  try {
    const remembered = JSON.parse(
      sessionStorage.getItem(EDITOR_BACK_TARGET_KEY) || "{}",
    );
    if (!VALID_BACK_TARGETS.has(remembered?.target)) return null;

    // Ignore an origin left behind by a previously selected template.
    if (
      remembered.templateId &&
      current?.id &&
      String(remembered.templateId) !== String(current.id)
    ) {
      return null;
    }
    if (
      remembered.templateType &&
      current?.type &&
      remembered.templateType !== current.type
    ) {
      return null;
    }

    return remembered.target;
  } catch {
    return null;
  }
}

export function rememberEditorBackTarget(target, selectedType) {
  if (!VALID_BACK_TARGETS.has(target)) return;
  const current = selectedType?.type ? selectedType : readSelectedType();

  try {
    sessionStorage.setItem(
      EDITOR_BACK_TARGET_KEY,
      JSON.stringify({
        target,
        templateId: current?.id || "",
        templateType: current?.type || "",
      }),
    );
  } catch {
    // Navigation must continue even when WebView storage is unavailable.
  }
}

export function getEditorBackTarget(selectedType, navigationState) {
  if (VALID_BACK_TARGETS.has(navigationState?.editorBackTarget)) {
    return navigationState.editorBackTarget;
  }

  // localStorage is the authoritative selection. React context can briefly
  // contain the previous template while the editor route is mounting.
  const storedSelectedType = readSelectedType();
  const current = storedSelectedType?.type ? storedSelectedType : selectedType;
  const rememberedTarget = readRememberedBackTarget(current);
  if (rememberedTarget) return rememberedTarget;

  return GENERAL_TEMPLATE_TYPES.has(current?.type) ? "/" : "/mlmform";
}

export function isDirectEditorTemplate(type) {
  return GENERAL_TEMPLATE_TYPES.has(type);
}
