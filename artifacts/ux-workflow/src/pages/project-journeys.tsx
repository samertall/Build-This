import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Route, ChevronRight, Frown, Meh, Smile, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListJourneys } from "@workspace/api-client-react";

type Stage = {
  name: string;
  userGoal?: string;
  actions?: string[];
  thoughts?: string;
  emotions?: string;
  painPoints?: string[];
  touchpoints?: string[];
  opportunities?: string[];
};

function EmotionIcon({ emotions }: { emotions?: string }) {
  if (!emotions) return <Meh className="w-4 h-4 text-muted-foreground" />;
  const lower = emotions.toLowerCase();
  if (lower.includes("frustrat") || lower.includes("confus") || lower.includes("overwhelm")) return <Frown className="w-4 h-4 text-destructive" />;
  if (lower.includes("satisf") || lower.includes("happy") || lower.includes("excit") || lower.includes("delight")) return <Smile className="w-4 h-4 text-emerald-500" />;
  return <Meh className="w-4 h-4 text-amber-500" />;
}

export default function ProjectJourneysPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");

  const { data: journeys, isLoading } = useListJourneys(projectId);

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">User Journey Maps</h1>
          <p className="text-muted-foreground text-sm mt-1">Current and future state journeys with emotions, pain points, and opportunities.</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">{[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
        ) : !journeys || journeys.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Route className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No journey maps yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Journey & Flow agent to generate current and future state user journey maps.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {journeys.map((journey, ji) => {
              const stages = (journey.stages as unknown as Stage[]) ?? [];
              return (
                <motion.div key={journey.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ji * 0.1 }}>
                  <Card className="border-border bg-card overflow-hidden shadow-sm">
                    <CardHeader className="border-b border-border/50 pb-5 bg-secondary/20">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-xl text-foreground font-bold">{journey.title}</CardTitle>
                        <Badge className={journey.journeyType === "future" ? "bg-primary/10 text-primary border-primary/20 font-mono shadow-none" : "bg-secondary text-secondary-foreground border-border font-mono shadow-none"}>
                          {journey.journeyType === "future" ? "Future State" : "Current State"}
                        </Badge>
                        {journey.persona && <Badge variant="outline" className="border-border text-muted-foreground text-[10px] uppercase tracking-widest font-mono shadow-none">{journey.persona}</Badge>}
                      </div>
                      {journey.scenario && <p className="text-muted-foreground text-sm mt-3 max-w-3xl leading-relaxed">{journey.scenario}</p>}
                    </CardHeader>
                    <CardContent className="p-0">
                      {stages.length === 0 ? (
                        <p className="p-5 text-muted-foreground text-sm">No stages defined.</p>
                      ) : (
                        <div className="overflow-x-auto pb-4">
                          <div className="flex min-w-max">
                            {stages.map((stage, si) => (
                              <div key={si} className="flex group">
                                <div className="w-64 flex-shrink-0 p-5 border-r border-border/50 last:border-r-0 transition-colors hover:bg-secondary/10">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold font-mono">
                                      {si + 1}
                                    </div>
                                    <span className="font-bold text-foreground text-sm line-clamp-2">{stage.name}</span>
                                  </div>

                                  {stage.userGoal && (
                                    <div className="mb-4">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 font-mono">Goal</div>
                                      <p className="text-sm text-foreground leading-relaxed">{stage.userGoal}</p>
                                    </div>
                                  )}

                                  {stage.emotions && (
                                    <div className="flex items-center gap-2 mb-4 bg-background border border-border rounded-md px-2.5 py-1.5 w-fit">
                                      <EmotionIcon emotions={stage.emotions} />
                                      <span className="text-xs font-medium text-foreground capitalize">{stage.emotions}</span>
                                    </div>
                                  )}

                                  {stage.painPoints && stage.painPoints.length > 0 && (
                                    <div className="mb-4">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1.5 font-mono">
                                        <AlertTriangle className="w-3 h-3" />Pain Points
                                      </div>
                                      <ul className="space-y-2">
                                        {stage.painPoints.slice(0, 3).map((p, i) => (
                                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                            <span className="text-destructive font-bold mt-[-2px]">•</span> 
                                            <span className="leading-snug">{p}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {stage.opportunities && stage.opportunities.length > 0 && (
                                    <div>
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5 font-mono">
                                        <Lightbulb className="w-3 h-3" />Opportunities
                                      </div>
                                      <ul className="space-y-2">
                                        {stage.opportunities.slice(0, 3).map((o, i) => (
                                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                            <span className="text-primary font-bold mt-[-2px]">•</span> 
                                            <span className="leading-snug">{o}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                {si < stages.length - 1 && (
                                  <div className="flex items-center px-0 bg-gradient-to-r from-transparent to-transparent">
                                    <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center -ml-3 z-10 text-muted-foreground shadow-sm group-hover:border-primary/30 group-hover:text-primary transition-colors">
                                      <ChevronRight className="w-3 h-3" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
