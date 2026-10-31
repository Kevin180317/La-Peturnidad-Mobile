import { formatChatDay, formatDate, formatShortTime, formatTimeAgo, parseDate, toLocalDateString } from "@/utils/format";

describe("formatDate", () => {
  it("returns fallback for empty values", () => {
    expect(formatDate(null)).toBe("No disponible");
    expect(formatDate(undefined)).toBe("No disponible");
    expect(formatDate("")).toBe("No disponible");
  });

  it("returns fallback for invalid dates", () => {
    expect(formatDate("no es fecha")).toBe("No disponible");
  });

  it("formats as dd/mm/yyyy with zero padding", () => {
    expect(formatDate("2024-03-05T12:00:00")).toBe("05/03/2024");
    expect(formatDate("2023-12-25T12:00:00")).toBe("25/12/2023");
  });

  it("parses date-only strings as local dates (no UTC shift)", () => {
    expect(formatDate("2024-03-01")).toBe("01/03/2024");
    expect(formatDate("2024-01-01")).toBe("01/01/2024");
  });
});

describe("parseDate", () => {
  it("builds a local date for YYYY-MM-DD", () => {
    const d = parseDate("2024-03-05");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2024, 2, 5, 0]);
  });
});

describe("toLocalDateString", () => {
  it("uses local date parts", () => {
    expect(toLocalDateString(new Date(2024, 0, 9, 23, 30))).toBe("2024-01-09");
    expect(toLocalDateString(new Date(2023, 11, 31, 0, 5))).toBe("2023-12-31");
  });
});

describe("formatTimeAgo", () => {
  const now = new Date("2026-10-29T12:00:00Z");

  it("returns empty string for missing or invalid dates", () => {
    expect(formatTimeAgo(null, now)).toBe("");
    expect(formatTimeAgo("no es fecha", now)).toBe("");
  });

  it.each([
    ["2026-10-29T11:59:30Z", "ahora"],
    ["2026-10-29T11:55:00Z", "hace 5 min"],
    ["2026-10-29T09:00:00Z", "hace 3 h"],
    ["2026-10-27T12:00:00Z", "hace 2 d"],
  ])("%s -> %s", (date, expected) => {
    expect(formatTimeAgo(date, now)).toBe(expected);
  });

  it("falls back to day and short month after a week", () => {
    expect(formatTimeAgo("2026-10-12T12:00:00Z", now)).toMatch(/^12 oct/);
  });
});

describe("formatShortTime", () => {
  const now = new Date("2026-10-29T12:00:00Z");

  it("returns empty string for missing or invalid dates", () => {
    expect(formatShortTime(null, now)).toBe("");
    expect(formatShortTime("x", now)).toBe("");
  });

  it("shows the time within the last 24 hours and the date otherwise", () => {
    expect(formatShortTime("2026-10-29T10:00:00Z", now)).toMatch(/\d{1,2}:\d{2}/);
    expect(formatShortTime("2026-10-12T12:00:00Z", now)).toMatch(/^12 oct/);
  });
});

describe("formatChatDay", () => {
  const now = new Date(2026, 9, 31, 8, 0);

  it("uses calendar days, not 24-hour windows", () => {
    expect(formatChatDay(new Date(2026, 9, 31, 0, 5).toISOString(), now)).toBe("Hoy");
    // Hace 9 horas, pero fue ayer
    expect(formatChatDay(new Date(2026, 9, 30, 23, 0).toISOString(), now)).toBe("Ayer");
    expect(formatChatDay(new Date(2026, 9, 30, 0, 5).toISOString(), now)).toBe("Ayer");
  });

  it("uses a short date for older days and handles the month boundary", () => {
    expect(formatChatDay(new Date(2026, 9, 29, 12, 0).toISOString(), now)).toContain("29");
    expect(formatChatDay(new Date(2026, 9, 31, 12, 0).toISOString(), new Date(2026, 10, 1, 8, 0))).toBe("Ayer");
  });

  it("returns empty for missing or invalid values", () => {
    expect(formatChatDay(null)).toBe("");
    expect(formatChatDay("no es fecha")).toBe("");
  });
});
