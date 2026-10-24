import * as WebBrowser from "expo-web-browser";

// Páginas publicadas en luckytracker.com.mx; las mismas URLs van en Play Console
export const LEGAL_URLS = {
  terms: "https://luckytracker.com.mx/terms",
  privacy: "https://luckytracker.com.mx/policy",
} as const;

export function openLegalUrl(kind: keyof typeof LEGAL_URLS) {
  return WebBrowser.openBrowserAsync(LEGAL_URLS[kind]);
}
