import type { ExportPresentation } from "../../artifacts/api-server/src/lib/presentation-export";

const longResearchSummary = [
  "Customers need a clear way to compare their current workflow with the proposed experience.",
  "The redesigned path reduces handoffs, makes the next action visible, and gives teams confidence before they share the work.",
  "This deliberately long paragraph exercises text fitting and PDF clipping without making the export fail.",
].join(" ");

export const representativePresentationFixture: ExportPresentation = {
  title: "Customer Discovery Readout",
  presentationType: "research-readout",
  audience: "Product leadership",
  slides: [
    {
      title: "Executive Summary",
      layout: "overview",
      sectionOrder: ["headline", "evidence", "recommendation"],
      content: {
        headline: "Make the next step obvious",
        evidence: [
          "Teams lose momentum when research findings are hard to scan.",
          { source: "Customer interviews", signal: "Repeated handoff friction" },
        ],
        recommendation: {
          direction: "Prioritize a guided review flow",
          confidence: "High",
        },
      },
    },
    {
      title: "Empty Content Still Exports",
      layout: "closing",
      sectionOrder: [],
      content: {},
    },
    {
      title: "Long and Nested Findings",
      layout: "details",
      sectionOrder: ["research_summary", "nested_finding", "follow_up"],
      content: {
        research_summary: longResearchSummary,
        nested_finding: {
          observation: "Reviewers want evidence beside each recommendation",
          impact: "Faster decisions with less context switching",
        },
        follow_up: [
          { owner: "Research", action: "Validate the comparison view" },
          { owner: "Design", action: "Prototype the guided review flow" },
        ],
      },
    },
  ],
};

export const expectedSlideHeadings = [
  "Executive Summary",
  "Empty Content Still Exports",
  "Long and Nested Findings",
];

export const expectedContentText = [
  "Make the next step obvious",
  "Reviewers want evidence beside each recommendation",
  "Prototype the guided review flow",
];