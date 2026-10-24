import { formatDate, parseDate, toLocalDateString } from "@/utils/format";

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
