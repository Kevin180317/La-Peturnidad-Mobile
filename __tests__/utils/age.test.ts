import { isAdult, MIN_AGE } from "../../utils/age";

describe("isAdult", () => {
  const today = new Date(2026, 10, 3); // 3 nov 2026

  it("requires at least 18 years by default", () => {
    expect(MIN_AGE).toBe(18);
  });

  it("accepts someone who turned 18 today", () => {
    expect(isAdult("2008-11-03", today)).toBe(true);
  });

  it("rejects someone who turns 18 tomorrow", () => {
    expect(isAdult("2008-11-04", today)).toBe(false);
  });

  it("accepts an older person", () => {
    expect(isAdult("1990-05-20", today)).toBe(true);
  });

  it("rejects a minor", () => {
    expect(isAdult("2015-01-01", today)).toBe(false);
  });

  it("handles leap-day birthdays (turns 18 on 1 Mar in a non-leap year)", () => {
    expect(isAdult("2008-02-29", new Date(2026, 1, 28))).toBe(false);
    expect(isAdult("2008-02-29", new Date(2026, 2, 1))).toBe(true);
  });

  it("rejects malformed or empty dates", () => {
    expect(isAdult("", today)).toBe(false);
    expect(isAdult("03/11/2008", today)).toBe(false);
  });

  it("accepts a custom minimum age", () => {
    expect(isAdult("2012-01-01", today, 13)).toBe(true);
  });
});
