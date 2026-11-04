import { POST_MAX, LIMITS } from "@/utils/limits";

// Etiqueta: minúsculas, sin "#", sin acentos ni símbolos (solo letras a-z, números y guion bajo)
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, LIMITS.tag);
}

// #hashtags escritos dentro del texto
export function extractHashtags(text: string): string[] {
  const found = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return found.map(normalizeTag).filter(Boolean);
}

// Une etiquetas sin repetir y respetando el máximo
export function mergeTags(...lists: string[][]): string[] {
  return [...new Set(lists.flat().map(normalizeTag).filter(Boolean))].slice(0, POST_MAX.tags);
}

// Solo http(s). Si falta el protocolo se asume https. Devuelve null si no es una URL válida
export function normalizeLink(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// Texto corto para mostrar un enlace: "sitio.com/ruta"
export function displayLink(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
