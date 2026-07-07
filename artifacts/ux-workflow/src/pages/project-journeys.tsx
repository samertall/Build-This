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
  if (lower.includes("frustrat") || lower.includes("confus") || lower.includes("overwhelm")) return <Frown className="w-4 h-4 text-red-400" />;
  if (lower.includes("satisf") || lower.includes("happy") || lower.includes("excit") || lower.includes("delight")) return <Smile className="w-4 h-4 text-green-400" />;
  return <Meh className="w-4 h-4 text-yellow-400" />;
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
              <div className="w-12 h-12 rounded-2xl bg-indigo-400/10 flex items-center justify-center mb-4">
                <Route className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No journey maps yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Journey & Flow agent to generate current and future state user journey maps.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {journeys.map((journey, ji) => {
              const stages = (journey.stages as Stage[]) ?? [];
              return (
                <motion.div key={journey.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ji * 0.1 }}>
                  <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="border-b border-border pb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-lg text-foreground">{journey.title}</CardTitle>
                        <Badge className={journey.journeyType === "future" ? "bg-cyan-400/15 text-cyan-400 border-cyan-400/20" : "bg-purple-400/15 text-purple-400 border-purple-400/20"}>
                          {journey.journeyType === "future" ? "Future State" : "Current State"}
                        </Badge>
                        {journey.persona && <Badge variant="outline" className="border-border text-muted-foreground text-xs">{journey.persona}</Badge>}
                      </div>
                      {journey.scenario && <p className="text-muted-foreground text-sm mt-2">{journey.scenario}</p>}
                    </CardHeader>
                    <CardContent className="p-0">
                      {stages.length === 0 ? (
                        <p className="p-5 text-muted-foreground text-sm">No stages defined.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <div className="flex min-w-max">
                            {stages.map((stage, si) => (
                              <div key={si} className="flex">
                                <div className="w-56 flex-shrink-0 p-4 border-r border-border last:border-r-0">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-indigo-400/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                      {si + 1}
                                    </div>
                                    <span className="font-semibold text-foreground text-sm">{stage.name}</span>
                                  </div>

                                  {stage.userGoal && (
                                    <div className="mb-3">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Goal</div>
                                      <p className="text-xs text-foreground">{stage.userGoal}</p>
                                    </div>
                                  )}

                                  {stage.emotions && (
                                    <div className="flex items-center gap-1.5 mb-3">
                                      <EmotionIcon emotions={stage.emotions} />
                                      <span className="text-xs text-muted-foreground">{stage.emotions}</span>
                                    </div>
                                  )}

                                  {stage.painPoints && stage.painPoints.length > 0 && (
                                    <div className="mb-3">
                                      <div className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />Pain Points
                                      </div>
                                      <ul className="space-y-1">
                                        {stage.painPoints.slice(0, 2).map((p, i) => (
                                          <li key={i} className="text-xs text-muted-foreground">• {p}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {stage.opportunities && stage.opportunities.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3" />Opportunities
                                      </div>
                                      <ul className="space-y-1">
                                        {stage.opportunities.slice(0, 2).map((o, i) => (
                                          <li key={i} className="text-xs text-muted-foreground">• {o}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                {si < stages.length - 1 && (
                                  <div className="flex items-center px-0">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
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
