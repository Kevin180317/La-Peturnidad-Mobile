import { formatDate } from "@/utils/format";

describe("formatDate", () => {
  it("returns fallback for empty values", () => {
    expect(formatDate(null)).toBe("No disponible");
    expect(formatDate(undefined)).toBe("No disponible");
    expect(formatDate("")).toBe("No disponible");
  });

  it("formats as dd/mm/yyyy with zero padding", () => {
    expect(formatDate("2024-03-05T12:00:00")).toBe("05/03/2024");
    expect(formatDate("2023-12-25T12:00:00")).toBe("25/12/2023");
  });
});
