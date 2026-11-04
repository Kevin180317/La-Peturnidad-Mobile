import { COUNTRIES, normalizePhone, sanitizePhoneInput, splitPhone } from "../../utils/phone";

describe("normalizePhone", () => {
  it("builds an E.164 number for Mexico from 10 digits with any separators", () => {
    expect(normalizePhone("MX", "664 123-4567")).toEqual({ value: "+526641234567" });
    expect(normalizePhone("MX", "(664) 123 4567")).toEqual({ value: "+526641234567" });
  });

  it("drops a country code or the old mobile prefix typed by mistake", () => {
    expect(normalizePhone("MX", "+52 664 123 4567")).toEqual({ value: "+526641234567" });
    expect(normalizePhone("MX", "52 1 664 123 4567")).toEqual({ value: "+526641234567" });
  });

  it("rejects Mexican numbers that are not 10 digits", () => {
    expect(normalizePhone("MX", "664123456")).toHaveProperty("error");
    expect(normalizePhone("MX", "66412345678")).toHaveProperty("error");
    expect(normalizePhone("MX", "")).toHaveProperty("error");
  });

  it("builds a +1 number for the US and Canada", () => {
    expect(normalizePhone("US", "(619) 555-0123")).toEqual({ value: "+16195550123" });
    expect(normalizePhone("US", "1 619 555 0123")).toEqual({ value: "+16195550123" });
  });

  it("rejects US numbers with an invalid area code or wrong length", () => {
    expect(normalizePhone("US", "019 555 0123")).toHaveProperty("error");
    expect(normalizePhone("US", "619555012")).toHaveProperty("error");
  });

  it("accepts another country only with an explicit + country code", () => {
    expect(normalizePhone("OTHER", "+34 600 123 456")).toEqual({ value: "+34600123456" });
    expect(normalizePhone("OTHER", "600123456")).toHaveProperty("error");
    expect(normalizePhone("OTHER", "+0123456789")).toHaveProperty("error");
    expect(normalizePhone("OTHER", "+1234")).toHaveProperty("error");
    expect(normalizePhone("OTHER", "+1234567890123456")).toHaveProperty("error");
  });

  it("never lets letters through", () => {
    expect(normalizePhone("MX", "664abc4567")).toHaveProperty("error");
  });
});

describe("splitPhone", () => {
  it("splits stored E.164 numbers by country", () => {
    expect(splitPhone("+526641234567")).toEqual({ country: "MX", number: "6641234567" });
    expect(splitPhone("+16195550123")).toEqual({ country: "US", number: "6195550123" });
    expect(splitPhone("+34600123456")).toEqual({ country: "OTHER", number: "+34600123456" });
  });

  it("treats legacy 10-digit numbers as Mexican", () => {
    expect(splitPhone("6641234567")).toEqual({ country: "MX", number: "6641234567" });
    expect(splitPhone("664 123 4567")).toEqual({ country: "MX", number: "6641234567" });
  });

  it("keeps unknown legacy values so the user can fix them", () => {
    expect(splitPhone("12345")).toEqual({ country: "OTHER", number: "12345" });
    expect(splitPhone(null)).toEqual({ country: "MX", number: "" });
  });
});

describe("COUNTRIES", () => {
  it("lists Mexico first, then US/Canada, then other", () => {
    expect(COUNTRIES.map((c) => c.key)).toEqual(["MX", "US", "OTHER"]);
    expect(COUNTRIES[0].dial).toBe("+52");
    expect(COUNTRIES[1].dial).toBe("+1");
  });
});

describe("sanitizePhoneInput", () => {
  it("keeps only digits and caps Mexico and US numbers at 10", () => {
    expect(sanitizePhoneInput("MX", "664-123-4567")).toBe("6641234567");
    expect(sanitizePhoneInput("MX", "66412345678999")).toBe("6641234567");
    expect(sanitizePhoneInput("US", "(619) 555-0123x")).toBe("6195550123");
  });

  it("strips a pasted country code when it leaves exactly 10 digits", () => {
    expect(sanitizePhoneInput("MX", "+52 664 123 4567")).toBe("6641234567");
    expect(sanitizePhoneInput("MX", "52 1 664 123 4567")).toBe("6641234567");
    expect(sanitizePhoneInput("US", "+1 619 555 0123")).toBe("6195550123");
  });

  it("lets other countries keep a leading + and up to 15 digits", () => {
    expect(sanitizePhoneInput("OTHER", "+34 600 123 456")).toBe("+34600123456");
    expect(sanitizePhoneInput("OTHER", "+1234567890123456789")).toBe("+123456789012345");
    expect(sanitizePhoneInput("OTHER", "abc")).toBe("");
  });
});
