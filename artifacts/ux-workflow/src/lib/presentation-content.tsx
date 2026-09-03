import * as React from "react";
import { orderedContentEntries, type SlideContent } from "./presentation-order";

export function renderSlideContent(
  content: SlideContent,
  layout: string,
  large = false,
  sectionOrder?: string[],
): React.ReactNode {
  if (!content || Object.keys(content).length === 0) {
    return <p className={`text-muted-foreground italic font-medium ${large ? "text-2xl" : "text-sm"}`}>No content available for this slide.</p>;
  }

  const entries = orderedContentEntries(content, sectionOrder);

  return (
    <div className={large ? "space-y-8" : "space-y-4"}>
      {entries.map(([key, value]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const labelClass = `${large ? "text-sm mb-4" : "text-[10px] mb-2"} font-black text-muted-foreground uppercase tracking-widest font-mono`;

        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <p data-testid="presentation-section-label" className={labelClass}>{label}</p>
              <ul className={large ? "space-y-4" : "space-y-2"}>
                {(value as unknown[]).map((item, i) => (
                  <li key={i} className={`flex items-start gap-4 text-foreground bg-card border border-border rounded-2xl shadow-sm ${large ? "text-xl p-5 md:p-6" : "text-sm p-3"}`}>
                    <span className={`${large ? "w-10 h-10 text-base" : "w-6 h-6 text-xs"} rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-black`}>{i + 1}</span>
                    <span className={`leading-relaxed font-semibold ${large ? "mt-1.5" : "mt-0.5"}`}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (typeof value === "object" && value !== null) {
          const subEntries = Object.entries(value as Record<string, unknown>);
          return (
            <div key={key}>
              <p data-testid="presentation-section-label" className={labelClass}>{label}</p>
              <div className={`grid grid-cols-2 ${large ? "gap-6" : "gap-3"}`}>
                {subEntries.map(([k, v]) => (
                  <div key={k} className={`bg-muted/40 border border-border/50 rounded-2xl ${large ? "p-6" : "p-3.5"}`}>
                    <p className={`${large ? "text-xs" : "text-[10px]"} font-black text-muted-foreground uppercase tracking-widest font-mono mb-2`}>{k.replace(/_/g, " ")}</p>
                    <p className={`${large ? "text-2xl" : "text-sm"} text-foreground font-semibold leading-snug`}>{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key}>
            <p data-testid="presentation-section-label" className={labelClass}>{label}</p>
            <p className={`text-foreground leading-relaxed font-semibold bg-muted/40 border border-border/50 rounded-2xl ${large ? "text-2xl p-8 md:p-10" : "text-sm p-4"}`}>{String(value)}</p>
          </div>
        );
      })}
    </div>
  );
}