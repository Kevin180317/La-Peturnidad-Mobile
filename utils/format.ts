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

// Fecha relativa corta para feeds: "ahora", "hace 5 min", "hace 3 h", "hace 2 d"; después de una semana, "12 oct"
export const formatTimeAgo = (dateString: string | null | undefined, now: Date = new Date()) => {
  if (!dateString) return "";
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
};

// Hora si fue en las últimas 24 h; si no, "12 oct" (lista de chats)
export const formatShortTime = (dateString: string | null | undefined, now: Date = new Date()) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  if (now.getTime() - date.getTime() < 86400000) {
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
};
