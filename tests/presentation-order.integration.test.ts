import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { orderedContentEntries as orderedExportContentEntries } from "../artifacts/api-server/src/lib/presentation-export";
import { orderedContentEntries as orderedViewerContentEntries } from "../artifacts/ux-workflow/src/lib/presentation-order";
import { renderSlideContent } from "../artifacts/ux-workflow/src/lib/presentation-content";

const requireFromWebPackage = createRequire(
  new URL("../artifacts/ux-workflow/package.json", import.meta.url),
);
const { renderToStaticMarkup } = requireFromWebPackage("react-dom/server");

const jsonbReorderedContent = {
  zeta: "Z",
  headline: "H",
  alpha: "A",
};

describe("presentation section ordering", () => {
  it("keeps preview and downloads aligned for authored and legacy slides", () => {
    const authoredOrder = ["headline", "zeta"];
    const expectedAuthoredEntries = [
      ["headline", "H"],
      ["zeta", "Z"],
      ["alpha", "A"],
    ];
    const expectedLegacyEntries = [
      ["alpha", "A"],
      ["headline", "H"],
      ["zeta", "Z"],
    ];

    expect(orderedViewerContentEntries(jsonbReorderedContent, authoredOrder)).toEqual(expectedAuthoredEntries);
    expect(orderedExportContentEntries(jsonbReorderedContent, authoredOrder)).toEqual(expectedAuthoredEntries);
    expect(orderedViewerContentEntries(jsonbReorderedContent)).toEqual(expectedLegacyEntries);
    expect(orderedExportContentEntries(jsonbReorderedContent)).toEqual(expectedLegacyEntries);
  });

  it("renders visible section labels in authored and legacy order", () => {
    const sectionLabels = (content: object, sectionOrder?: string[]) =>
      [...renderToStaticMarkup(
        renderSlideContent(content, "overview", true, sectionOrder),
      ).matchAll(/data-testid="presentation-section-label"[^>]*>([^<]+)<\/p>/g)]
        .map((match) => match[1]);

    expect(sectionLabels(jsonbReorderedContent, ["headline", "zeta", "alpha"])).toEqual([
      "Headline",
      "Zeta",
      "Alpha",
    ]);
    expect(sectionLabels(jsonbReorderedContent)).toEqual([
      "Alpha",
      "Headline",
      "Zeta",
    ]);
  });
});