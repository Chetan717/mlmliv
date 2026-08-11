import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import professionalGuide from "../assets/professional-guide.png";

const GUIDE_VERSION = "v1";

const GUIDE_ACTION_HINT_STYLES = `
  @keyframes mlmliveGuideActionHint {
    0%, 100% {
      background-color: #0088DA;
      transform: scale(1);
      box-shadow: 0 4px 10px rgba(0, 136, 218, 0.2);
    }
    12%, 36%, 60%, 84% {
      background-color: #dc2626;
      transform: scale(1.08);
      box-shadow:
        0 0 0 5px rgba(220, 38, 38, 0.2),
        0 8px 22px rgba(220, 38, 38, 0.48);
    }
    24%, 48%, 72% {
      background-color: #991b1b;
      transform: scale(1.02);
      box-shadow:
        0 0 0 2px rgba(220, 38, 38, 0.12),
        0 5px 14px rgba(153, 27, 27, 0.3);
    }
  }

  .mlmlive-guide-action-hint {
    animation: mlmliveGuideActionHint 1.15s ease-in-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    .mlmlive-guide-action-hint {
      animation-duration: 1.8s;
    }
  }
`;

const copy = (enTitle, hiTitle, en, hi, target) => ({
  title: { en: enTitle, hi: hiTitle },
  body: { en, hi },
  target,
});

const GUIDES = {
  "/ask-ai": {
    name: { en: "Ask AI", hi: "Ask AI सहायता" },
    steps: [
      copy(
        "Your 30 free credits",
        "आपके 30 फ्री क्रेडिट",
        "Every existing and new user receives 30 launch credits. One successful prescription reading uses one credit; a failed AI request returns the reserved credit.",
        "हर पुराने और नए यूज़र को 30 लॉन्च क्रेडिट मिलते हैं। एक सफल prescription reading में एक क्रेडिट लगता है; AI request fail होने पर reserved credit वापस हो जाता है।",
        '[data-guide="ask-ai-credits"]',
      ),
      copy(
        "Upload a clear image",
        "साफ फोटो अपलोड करें",
        "Choose one JPG, PNG, WEBP or HEIC image up to 20 MB. Keep the full prescription straight, bright and free from glare.",
        "20 MB तक की एक JPG, PNG, WEBP या HEIC फोटो चुनें। पूरा prescription सीधा, रोशनी में और बिना glare के रखें।",
        '[data-guide="ask-ai-upload"]',
      ),
      copy(
        "Read with AI",
        "AI से पढ़ें",
        "Review the preview, then tap Ask AI. Keep the screen open while the secure analysis is running.",
        "Preview जांचकर Ask AI दबाएं। सुरक्षित analysis पूरा होने तक यह screen खुली रखें।",
        '[data-guide="ask-ai-read"]',
      ),
      copy(
        "Verify the result",
        "Result जरूर जांचें",
        "Check medicines, strengths, directions and unclear text. AI can misread handwriting, so confirm everything with the prescribing doctor or pharmacist.",
        "Medicine, strength, direction और unclear text जांचें। AI handwriting गलत पढ़ सकता है, इसलिए doctor या pharmacist से हर जानकारी confirm करें।",
        '[data-guide="ask-ai-result"]',
      ),
    ],
  },
  "/": {
    name: { en: "Home", hi: "होम" },
    steps: [
      copy(
        "Welcome to MLM LIVE",
        "MLM LIVE में आपका स्वागत है",
        "Create professional marketing designs in a few simple steps. This guide is always available from the Help button.",
        "कुछ आसान चरणों में प्रोफेशनल मार्केटिंग डिज़ाइन बनाएं। यह गाइड Help बटन से कभी भी दोबारा खोल सकते हैं।",
      ),
      copy(
        "Find a design",
        "डिज़ाइन खोजें",
        "Search by occasion or template type, such as Birthday, Rank, Meeting or Festival.",
        "Birthday, Rank, Meeting या Festival जैसे नाम लिखकर अपना टेम्पलेट खोजें।",
        '[data-guide="home-search"]',
      ),
      copy(
        "Choose a template",
        "टेम्पलेट चुनें",
        "Browse a category and tap a design you like. MLM templates will first ask for the details needed in the design.",
        "कैटेगरी में अपनी पसंद का डिज़ाइन चुनें। MLM टेम्पलेट चुनने पर पहले डिज़ाइन में लगने वाली जानकारी मांगी जाएगी।",
        '[data-guide="home-templates"]',
      ),
      copy(
        "Keep your profile ready",
        "अपनी प्रोफाइल तैयार रखें",
        "Add your name, designation and one clear profile photo in Company Profile. The app can then place them in future designs automatically.",
        "Company Profile में नाम, पद और एक साफ प्रोफाइल फोटो सेव करें। आगे ऐप इन्हें डिज़ाइन में अपने आप इस्तेमाल कर सकेगा।",
      ),
    ],
  },
  "/mlmprofile": {
    name: { en: "Company Profile", hi: "कंपनी प्रोफाइल" },
    steps: [
      copy(
        "Create your Company Profile",
        "कंपनी प्रोफाइल बनाएं",
        "Complete this once so your correct name, designation and photos are available in every design.",
        "इसे एक बार सही से पूरा करें, ताकि हर डिज़ाइन में आपका सही नाम, पद और फोटो मिल सके।",
        '[data-guide="profile-basic"]',
      ),
      copy(
        "Name and designation",
        "नाम और पद",
        "Enter the name exactly as it should appear on designs. Select your designation or type it manually if it is not listed.",
        "नाम वैसा ही लिखें जैसा डिज़ाइन पर दिखाना है। अपना पद चुनें; सूची में न हो तो नीचे खुद लिखें।",
        '[data-guide="profile-basic"]',
      ),
      copy(
        "Top-upline photos",
        "टॉप-अपलाइन फोटो",
        "Select company-provided photos or upload a clear custom photo. Selected photos can be reused while creating team designs.",
        "कंपनी की दी हुई फोटो चुनें या साफ फोटो अपलोड करें। ये फोटो टीम के डिज़ाइन बनाते समय दोबारा उपयोग होंगी।",
        '[data-guide="profile-topupline"]',
      ),
      copy(
        "Upload and crop correctly",
        "फोटो सही तरह अपलोड और क्रॉप करें",
        "Use a clear, front-facing photo. First crop the original, wait while the background is removed, then adjust the final transparent photo and tap Done.",
        "साफ और सामने से ली गई फोटो चुनें। पहले ओरिजिनल फोटो क्रॉप करें, बैकग्राउंड हटने तक रुकें, फिर ट्रांसपेरेंट फोटो को अंतिम बार सेट करके Done दबाएं।",
        '[data-guide="profile-photo"]',
      ),
      copy(
        "Save profile",
        "प्रोफाइल सेव करें",
        "Review the details, then tap Save Profile. Do not close the app while photos are uploading.",
        "जानकारी जांचकर Save Profile दबाएं। फोटो अपलोड होते समय ऐप बंद न करें।",
        '[data-guide="profile-save"]',
      ),
    ],
  },
  "/mlmform": {
    name: { en: "Create Design", hi: "डिज़ाइन बनाएं" },
    steps: [
      copy(
        "Choose who the design is for",
        "डिज़ाइन किसके लिए है चुनें",
        "Use For Team when celebrating another member, or For Self when the design is about you.",
        "किसी टीम मेंबर के लिए For Team और अपने लिए डिज़ाइन बनाते समय For Self चुनें।",
        '[data-guide="design-audience"]',
      ),
      copy(
        "Select top-upline photos",
        "टॉप-अपलाइन फोटो चुनें",
        "Choose the people who should appear on the design. A newly uploaded photo is also saved to your Company Profile for later use.",
        "जिन लोगों की फोटो डिज़ाइन पर चाहिए उन्हें चुनें। नई अपलोड की गई फोटो आगे के लिए Company Profile में भी सेव हो जाएगी।",
        '[data-guide="design-topupline"]',
      ),
      copy(
        "Enter accurate details",
        "सही जानकारी भरें",
        "Fill the achiever or promoter name, city, mobile number, rank and amount carefully. These details are printed directly on the design.",
        "नाम, शहर, मोबाइल नंबर, रैंक और राशि ध्यान से भरें। यही जानकारी सीधे डिज़ाइन पर दिखाई देगी।",
        '[data-guide="design-details"]',
      ),
      copy(
        "Photo workflow",
        "फोटो अपलोड करने का सही तरीका",
        "Tap Add Photo → crop inside the photo area → tap Done → wait for background removal → adjust the final crop → tap Done again.",
        "Add Photo दबाएं → फोटो की सीमा के अंदर क्रॉप करें → Done दबाएं → बैकग्राउंड हटने दें → अंतिम क्रॉप सेट करें → फिर Done दबाएं।",
        '[data-guide="design-photo"]',
      ),
      copy(
        "Create the design",
        "डिज़ाइन तैयार करें",
        "Check every field, then tap Save & Create Design. You can adjust the final design in the editor.",
        "सभी जानकारी जांचकर Save & Create Design दबाएं। अगले पेज पर डिज़ाइन को एडिटर में सेट कर सकते हैं।",
        '[data-guide="design-submit"]',
      ),
    ],
  },
  "/editor": {
    name: { en: "Design Editor", hi: "डिज़ाइन एडिटर" },
    steps: [
      copy(
        "Preview your design",
        "डिज़ाइन का प्रीव्यू देखें",
        "Check the name, photo, mobile number and all text before downloading.",
        "डाउनलोड करने से पहले नाम, फोटो, मोबाइल नंबर और सभी टेक्स्ट ध्यान से जांचें।",
        '[data-guide="editor-canvas"]',
      ),
      copy(
        "Change your profile photo",
        "प्रोफाइल फोटो बदलें",
        "Tap a saved photo below the design to switch the photo used in the template.",
        "टेम्पलेट में फोटो बदलने के लिए डिज़ाइन के नीचे सेव की हुई फोटो पर टैप करें।",
        '[data-guide="editor-photos"]',
      ),
      copy(
        "Add music when needed",
        "जरूरत हो तो म्यूजिक जोड़ें",
        "Use the music button for video or animated designs. For a normal image, you can leave it off.",
        "वीडियो या एनिमेटेड डिज़ाइन के लिए Music बटन उपयोग करें। सामान्य फोटो डिज़ाइन में इसे छोड़ सकते हैं।",
        '[data-guide="editor-music"]',
      ),
      copy(
        "Download and use a caption",
        "डाउनलोड करें और कैप्शन लगाएं",
        "Tap Download to open captions. Pick a category, preview a caption, tap Copy, then download the design and paste the caption in your social post.",
        "Download दबाने पर Captions खुलेंगे। कैटेगरी चुनें, कैप्शन देखें, Copy दबाएं, फिर डिज़ाइन डाउनलोड करके सोशल पोस्ट में कैप्शन पेस्ट करें।",
        '[data-guide="editor-download"]',
      ),
    ],
  },
  "/alltemp": {
    name: { en: "Templates", hi: "टेम्पलेट्स" },
    steps: [
      copy(
        "Browse all templates",
        "सभी टेम्पलेट देखें",
        "Use filters or search, then tap any template to start creating your design.",
        "फिल्टर या सर्च का उपयोग करें, फिर डिज़ाइन बनाना शुरू करने के लिए किसी टेम्पलेट पर टैप करें।",
      ),
    ],
  },
  "/selectcomp": {
    name: { en: "Select Company", hi: "कंपनी चुनें" },
    steps: [
      copy(
        "Select your company",
        "अपनी कंपनी चुनें",
        "Search and select the company you currently work with. This controls the logos, ranks and templates shown to you.",
        "जिस कंपनी में आप काम करते हैं उसे खोजकर चुनें। इसी के अनुसार लोगो, रैंक और टेम्पलेट दिखाई देंगे।",
      ),
    ],
  },
};

const DEFAULT_GUIDE = {
  name: { en: "App Help", hi: "ऐप सहायता" },
  steps: [
    copy(
      "Need help?",
      "मदद चाहिए?",
      "Use this Help button on important screens for simple step-by-step instructions.",
      "महत्वपूर्ण स्क्रीन पर आसान चरण-दर-चरण जानकारी के लिए इस Help बटन का उपयोग करें।",
    ),
  ],
};

const HIDDEN_GUIDE_ROUTES = new Set(["/subscription", "/profile", "/editor"]);

function GuideLady() {
  return (
    <img
      src={professionalGuide}
      className="w-[82px] h-[94px] object-contain object-bottom shrink-0 drop-shadow-md"
      alt="Professional network marketing guide"
      draggable="false"
    />
  );
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Guide state is optional; the guide still works without storage.
  }
}

export default function AppGuide() {
  const { pathname } = useLocation();
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const guideHidden = HIDDEN_GUIDE_ROUTES.has(pathname) || imageEditorOpen;
  const guide = GUIDES[pathname] || DEFAULT_GUIDE;
  const storageKey = `mlmlive-guide-${GUIDE_VERSION}-${pathname}`;
  const [language, setLanguage] = useState(() => safeGet("mlmlive-guide-language") || "hi");
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [actionHintKey, setActionHintKey] = useState(0);

  useEffect(() => {
    const updateEditorState = () => {
      setImageEditorOpen(
        Boolean(document.querySelector('[data-image-editor-open="true"]')),
      );
    };
    updateEditorState();
    const observer = new MutationObserver(updateEditorState);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const step = guide.steps[Math.min(stepIndex, guide.steps.length - 1)];
  const isLast = stepIndex === guide.steps.length - 1;

  const updateTarget = useCallback(() => {
    if (!open || !step?.target) {
      setTargetRect(null);
      return;
    }
    const element = document.querySelector(step.target);
    if (!element || !element.getClientRects().length) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: Math.max(8, rect.top - 6),
      left: Math.max(8, rect.left - 6),
      width: Math.min(window.innerWidth - Math.max(8, rect.left - 6) - 8, rect.width + 12),
      height: rect.height + 12,
    });
  }, [open, step]);

  useEffect(() => {
    setOpen(false);
    setStepIndex(0);
    setTargetRect(null);
    if (guideHidden) return undefined;
    const timer = window.setTimeout(() => {
      if (!safeGet(storageKey)) setOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [guideHidden, storageKey]);

  useEffect(() => {
    if (!open) return;
    const element = step?.target ? document.querySelector(step.target) : null;
    if (element) element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const timer = window.setTimeout(updateTarget, 380);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [open, stepIndex, step, updateTarget]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeGuide();
      if (event.key === "ArrowRight") nextStep();
      if (event.key === "ArrowLeft" && stepIndex > 0) setStepIndex((value) => value - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const progress = useMemo(() => ((stepIndex + 1) / guide.steps.length) * 100, [guide.steps.length, stepIndex]);
  const cardStyle = useMemo(() => {
    if (typeof window === "undefined") return {};
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(420, viewportWidth - 24);
    const estimatedHeight = language === "hi" ? 286 : 270;

    if (!targetRect) {
      return {
        width,
        left: "50%",
        bottom: 12,
        transform: "translateX(-50%)",
      };
    }

    const targetRight = targetRect.left + targetRect.width;
    const targetBottom = targetRect.top + targetRect.height;
    let left = Math.max(12, Math.min(viewportWidth - width - 12, targetRect.left + targetRect.width / 2 - width / 2));
    let top;

    if (viewportWidth >= 768 && targetRight + width + 16 <= viewportWidth) {
      left = targetRight + 16;
      top = Math.max(12, Math.min(viewportHeight - estimatedHeight - 12, targetRect.top));
    } else if (viewportWidth >= 768 && targetRect.left - width - 16 >= 0) {
      left = targetRect.left - width - 16;
      top = Math.max(12, Math.min(viewportHeight - estimatedHeight - 12, targetRect.top));
    } else if (targetBottom + estimatedHeight + 14 <= viewportHeight) {
      top = targetBottom + 14;
    } else if (targetRect.top >= estimatedHeight + 14) {
      top = targetRect.top - estimatedHeight - 14;
    } else {
      top = Math.max(12, viewportHeight - estimatedHeight - 12);
    }

    return { width, left, top };
  }, [language, targetRect]);

  function closeGuide() {
    safeSet(storageKey, "seen");
    setOpen(false);
    setStepIndex(0);
    setTargetRect(null);
  }

  function nextStep() {
    if (isLast) closeGuide();
    else setStepIndex((value) => value + 1);
  }

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    safeSet("mlmlive-guide-language", nextLanguage);
  }

  function handleBlockedScreenAttempt(event) {
    const clickedGuideControl =
      event.target instanceof Element &&
      Boolean(event.target.closest('[data-mlmlive-guide-card="true"] button'));
    if (clickedGuideControl) return;

    event.preventDefault();
    setActionHintKey((value) => value + 1);
  }

  if (guideHidden) return null;

  return (
    <>
      <style>{GUIDE_ACTION_HINT_STYLES}</style>

      {!open && (
        <button
          type="button"
          onClick={() => {
            setStepIndex(0);
            setOpen(true);
          }}
          className="fixed right-4 bottom-[68px] md:bottom-5 z-[650] h-10 min-w-[66px] px-4 rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(0,136,218,0.34)] border border-white/25 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Open step-by-step help"
          title="Help / मदद"
        >
          <span className="text-[12px] font-bold">Help</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[99980]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mlm-guide-title"
          onPointerDown={handleBlockedScreenAttempt}
        >
          {targetRect && (
            <div
              className="fixed rounded-2xl ring-[3px] ring-accent pointer-events-none transition-all duration-300"
              style={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
                boxShadow: "0 0 0 5px rgba(0,136,218,0.16), 0 0 26px rgba(0,136,218,0.46)",
              }}
            />
          )}

          <div
            data-mlmlive-guide-card="true"
            className="fixed rounded-[24px] bg-background border border-accent/25 shadow-[0_18px_55px_rgba(15,23,42,0.26)] overflow-hidden transition-all duration-300"
            style={{ ...cardStyle, maxHeight: "calc(100dvh - 24px)", overflowY: "auto" }}
          >
            <div className="h-1 bg-accent/15">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 pt-1">
                  <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-accent">
                    {guide.name[language]} · {stepIndex + 1}/{guide.steps.length}
                  </p>
                  <h2 id="mlm-guide-title" className="text-[18px] font-extrabold text-foreground leading-tight mt-1">
                    {step.title[language]}
                  </h2>
                </div>

                <GuideLady />
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[10px] text-muted-foreground font-medium">
                  {language === "hi" ? "मैं आपको आसान तरीके से बताती हूँ" : "Let me guide you step by step"}
                </p>
                <div className="flex items-center bg-muted/60 rounded-xl p-1 shrink-0" aria-label="Guide language">
                  {[
                    ["en", "EN"],
                    ["hi", "हिंदी"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeLanguage(value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${language === value ? "bg-accent text-white shadow-sm" : "text-muted-foreground"}`}
                      aria-pressed={language === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-foreground/75 min-h-[58px]">
                {step.body[language]}
              </p>

              <div className="flex items-center justify-between gap-2 mt-5">
                <button type="button" onClick={closeGuide} className="px-2 py-2 text-[12px] font-semibold text-muted-foreground">
                  {language === "hi" ? "बाद में" : "Skip"}
                </button>

                <div className="flex gap-2">
                  {stepIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setStepIndex((value) => value - 1)}
                      className="px-4 py-2.5 rounded-xl border border-border text-[12px] font-bold text-foreground"
                    >
                      {language === "hi" ? "पीछे" : "Back"}
                    </button>
                  )}
                  <button
                    key={`guide-primary-action-${actionHintKey}`}
                    type="button"
                    onClick={nextStep}
                    data-guide-primary-action="true"
                    className={`min-w-[92px] px-4 py-2.5 rounded-xl bg-accent text-white text-[12px] font-bold shadow-md shadow-accent/20 ${
                      actionHintKey > 0 ? "mlmlive-guide-action-hint" : ""
                    }`}
                  >
                    {isLast
                      ? language === "hi" ? "समझ गया" : "Got it"
                      : language === "hi" ? "आगे" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
