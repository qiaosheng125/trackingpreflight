export const consentSelectors = [
  "#onetrust-accept-btn-handler",
  "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  "#didomi-notice-agree-button",
  "[data-testid='uc-accept-all-button']",
  "[data-testid='cookie-accept-all']",
  "[data-cookiebanner='accept_button']",
  "[aria-label='Accept cookies']",
  "[aria-label='Accept all cookies']",
];

export const consentTextPatterns = [
  "accept all",
  "allow all",
  "i agree",
  "accept cookies",
  "allow cookies",
  "accept optional cookies",
  "yes, i accept",
];

export const exactConsentTexts = ["ok", "got it", "agree"];

export function buildConsentClickExpression() {
  return `
    (() => {
      const selectors = ${JSON.stringify(consentSelectors)};
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (isClickable(element)) {
          element.click();
          return { result: "clicked", method: "selector", selector, text: cleanText(element) };
        }
      }

      const textPatterns = ${JSON.stringify(consentTextPatterns)};
      const exactTexts = ${JSON.stringify(exactConsentTexts)};
      const candidates = Array.from(document.querySelectorAll("button, a, [role='button'], input[type='button'], input[type='submit']"));
      for (const element of candidates) {
        if (!isClickable(element)) continue;
        const text = cleanText(element).toLowerCase();
        if (!text) continue;
        if (matchesConsentText(text, textPatterns, exactTexts)) {
          element.click();
          return { result: "clicked", method: "text", selector: bestSelector(element), text: cleanText(element) };
        }
      }

      return { result: "not-found", method: "auto-consent", selector: "", text: "" };

      function isClickable(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return false;
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        if (element.disabled) return false;
        return true;
      }

      function cleanText(element) {
        if (!element) return "";
        return String(element.innerText || element.textContent || element.value || "").replace(/\\s+/g, " ").trim().slice(0, 120);
      }

      function matchesConsentText(text, phrasePatterns, exactPatterns) {
        const normalized = text.replace(/[^a-z0-9 ]+/g, " ").replace(/\\s+/g, " ").trim();
        if (exactPatterns.includes(normalized)) return true;
        return phrasePatterns.some((pattern) => {
          const phrase = pattern.replace(/[^a-z0-9 ]+/g, " ").replace(/\\s+/g, " ").trim();
          return normalized === phrase || normalized.includes(" " + phrase + " ") || normalized.startsWith(phrase + " ") || normalized.endsWith(" " + phrase);
        });
      }

      function bestSelector(element) {
        if (!element) return "";
        if (element.id) return "#" + CSS.escape(element.id);
        const testId = element.getAttribute("data-testid");
        if (testId) return "[data-testid='" + testId.replace(/'/g, "\\\\'") + "']";
        const aria = element.getAttribute("aria-label");
        if (aria) return "[aria-label='" + aria.replace(/'/g, "\\\\'") + "']";
        return element.tagName.toLowerCase();
      }
    })()
  `;
}

export function matchesConsentText(text, phrasePatterns = consentTextPatterns, exactPatterns = exactConsentTexts) {
  const normalized = normalizeConsentText(text);
  if (exactPatterns.includes(normalized)) return true;
  return phrasePatterns.some((pattern) => {
    const phrase = normalizeConsentText(pattern);
    return (
      normalized === phrase ||
      normalized.includes(` ${phrase} `) ||
      normalized.startsWith(`${phrase} `) ||
      normalized.endsWith(` ${phrase}`)
    );
  });
}

function normalizeConsentText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
