import { displayLink, extractHashtags, mergeTags, normalizeLink, normalizeTag } from "@/utils/postMeta";

describe("postMeta", () => {
  it("normalizeTag quita #, acentos y símbolos", () => {
    expect(normalizeTag("#Perrito-Perdído!")).toBe("perritoperdido");
    expect(normalizeTag("  ##Gatos_1 ")).toBe("gatos_1");
    expect(normalizeTag("###")).toBe("");
  });

  it("extractHashtags lee #etiquetas del texto", () => {
    expect(extractHashtags("Mi #Perro está #feliz, #Mascotas_MX y # solo")).toEqual(["perro", "feliz", "mascotas_mx"]);
  });

  it("mergeTags quita repetidas y limita a 10", () => {
    expect(mergeTags(["a", "A"], ["#a", "b"])).toEqual(["a", "b"]);
    const many = Array.from({ length: 15 }, (_, i) => `t${i}`);
    expect(mergeTags(many)).toHaveLength(10);
  });

  it("normalizeLink acepta http(s) y rechaza el resto", () => {
    expect(normalizeLink("sitio.com/ruta")).toBe("https://sitio.com/ruta");
    expect(normalizeLink("http://sitio.com")).toBe("http://sitio.com/");
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("ftp://sitio.com")).toBeNull();
    expect(normalizeLink("palabra")).toBeNull();
    expect(normalizeLink("dos palabras.com")).toBeNull();
    expect(normalizeLink("")).toBeNull();
  });

  it("displayLink quita protocolo y barra final", () => {
    expect(displayLink("https://sitio.com/")).toBe("sitio.com");
    expect(displayLink("http://sitio.com/a")).toBe("sitio.com/a");
  });
});
