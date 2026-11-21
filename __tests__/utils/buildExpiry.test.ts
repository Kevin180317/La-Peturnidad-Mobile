import { isBuildExpired } from "../../utils/buildExpiry";

const DAY = 24 * 60 * 60 * 1000;
const expires = "2026-11-26T23:59:59Z";
const t = Date.parse(expires);

describe("isBuildExpired", () => {
  it("no vence sin variable o con fecha inválida", () => {
    expect(isBuildExpired(undefined, t + DAY)).toBe(false);
    expect(isBuildExpired("", t + DAY)).toBe(false);
    expect(isBuildExpired("no-es-fecha", t + DAY)).toBe(false);
  });

  it("vigente antes de la fecha y vencido después", () => {
    expect(isBuildExpired(expires, t - DAY)).toBe(false);
    expect(isBuildExpired(expires, t + 1)).toBe(true);
  });
});
