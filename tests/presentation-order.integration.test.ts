import { describe, expect, it } from "vitest";
import { orderedContentEntries as orderedExportContentEntries } from "../artifacts/api-server/src/lib/presentation-export";
import { orderedContentEntries as orderedViewerContentEntries } from "../artifacts/ux-workflow/src/lib/presentation-order";

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
});