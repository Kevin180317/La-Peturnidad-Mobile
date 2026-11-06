// Teléfonos en formato internacional E.164 (+52XXXXXXXXXX). Si cambia el formato, actualizar también
// el trigger enforce_phone_format de la base de datos.
export type CountryKey = "MX" | "US" | "OTHER";

export interface Country {
  key: CountryKey;
  label: string;
  dial: string;
}

export const COUNTRIES: Country[] = [
  { key: "MX", label: "México", dial: "+52" },
  { key: "US", label: "Estados Unidos / Canadá", dial: "+1" },
  { key: "OTHER", label: "Otro país", dial: "+" },
];

export const E164 = /^\+[1-9]\d{7,14}$/;
const ALLOWED_CHARS = /^[\d\s\-().+]*$/;

export function normalizePhone(country: CountryKey, input: string): { value: string } | { error: string } {
  const text = input.trim();
  if (!ALLOWED_CHARS.test(text)) return { error: "El teléfono solo puede tener números" };
  let digits = text.replace(/\D/g, "");

  if (country === "MX") {
    if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
    else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
    if (!/^\d{10}$/.test(digits)) return { error: "Ingresa los 10 dígitos de tu número, sin la lada" };
    return { value: `+52${digits}` };
  }

  if (country === "US") {
    if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    if (!/^[2-9]\d{9}$/.test(digits)) return { error: "Ingresa los 10 dígitos de tu número, sin la lada" };
    return { value: `+1${digits}` };
  }

  if (!text.startsWith("+")) return { error: "Incluye tu código de país, por ejemplo +34 600 123 456" };
  const value = `+${digits}`;
  if (!E164.test(value)) return { error: "El número no es válido: revisa el código de país y los dígitos" };
  return { value };
}

/** Separa un teléfono guardado en país y número para mostrarlo en el formulario. */
export function splitPhone(stored: string | null | undefined): { country: CountryKey; number: string } {
  const raw = (stored ?? "").trim();
  if (!raw) return { country: "MX", number: "" };
  const mx = /^\+52(\d{10})$/.exec(raw);
  if (mx) return { country: "MX", number: mx[1] };
  const us = /^\+1([2-9]\d{9})$/.exec(raw);
  if (us) return { country: "US", number: us[1] };
  if (raw.startsWith("+")) return { country: "OTHER", number: raw };
  const digits = raw.replace(/\D/g, "");
  if (/^\d{10}$/.test(digits) && ALLOWED_CHARS.test(raw)) return { country: "MX", number: digits };
  return { country: "OTHER", number: raw };
}

/** Limpia lo que se escribe o pega: solo dígitos y, en México/EE. UU., máximo 10 (sin la lada). */
export function sanitizePhoneInput(country: CountryKey, text: string): string {
  if (country === "OTHER") {
    const plus = text.trimStart().startsWith("+") ? "+" : "";
    return (plus + text.replace(/\D/g, "")).slice(0, 16);
  }
  let digits = text.replace(/\D/g, "");
  if (country === "MX") {
    if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
    else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}
