// Edad mínima para usar la app. Si cambia, actualizar también el trigger de la base de datos
// (enforce_min_age, migración 20261104000001) y los Términos / Política de privacidad.
export const MIN_AGE = 18;

const pad = (n: number) => String(n).padStart(2, "0");

/** `birthDate` en formato YYYY-MM-DD. Cumplir años cuenta desde ese mismo día. */
export function isAdult(birthDate: string, today: Date = new Date(), minAge: number = MIN_AGE): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
  const limit = `${today.getFullYear() - minAge}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return birthDate <= limit;
}
