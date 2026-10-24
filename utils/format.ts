// "YYYY-MM-DD" (columna date) se interpreta como fecha local; new Date() la tomaría como UTC
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDate = (dateString: string) => {
  const m = DATE_ONLY.exec(dateString);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(dateString);
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "No disponible";
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return "No disponible";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
};

// Fecha de hoy en hora local como "YYYY-MM-DD" (no usar toISOString, que es UTC)
export const toLocalDateString = (date: Date = new Date()) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
