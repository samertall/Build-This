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
  if (!emotions) return <Meh className="w-5 h-5 text-muted-foreground/60" />;
  const lower = emotions.toLowerCase();
  if (lower.includes("frustrat") || lower.includes("confus") || lower.includes("overwhelm")) return <Frown className="w-5 h-5 text-destructive" />;
  if (lower.includes("satisf") || lower.includes("happy") || lower.includes("excit") || lower.includes("delight")) return <Smile className="w-5 h-5 text-emerald-500" />;
  return <Meh className="w-5 h-5 text-amber-500" />;
}

export default function ProjectJourneysPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");

  const { data: journeys, isLoading } = useListJourneys(projectId);

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-border/50 pb-6">
          <div className="relative">
            <div className="absolute -left-4 top-2 w-1 h-12 bg-indigo-500 rounded-r-full" />
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Journey & Flow</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-medium">Mapped user states with emotion curves and opportunity gaps.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8">{[1,2].map(i => <Skeleton key={i} className="h-[400px] rounded-3xl" />)}</div>
        ) : !journeys || journeys.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-2 border-border bg-card/30 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 shadow-sm border border-indigo-500/20">
                  <Route className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="font-black text-2xl text-foreground mb-3 tracking-tight">No journeys mapped</h3>
                <p className="text-muted-foreground text-base max-w-md font-medium">Run the Journey & Flow agent to generate current and future state maps.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {journeys.map((journey, ji) => {
              const stages = (journey.stages as unknown as Stage[]) ?? [];
              const isFuture = journey.journeyType === "future";
              return (
                <motion.div key={journey.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ji * 0.1, type: "spring", stiffness: 300, damping: 30 }}>
                  <Card className="border-2 border-border/60 bg-card overflow-hidden shadow-sm glass-card rounded-3xl group">
                    <CardHeader className={`border-b border-border/50 pb-6 pt-6 px-8 relative overflow-hidden ${isFuture ? 'bg-primary/5' : 'bg-secondary/30'}`}>
                      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-50 ${isFuture ? 'bg-primary/20' : 'bg-foreground/5'}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <Badge className={isFuture ? "bg-primary text-primary-foreground font-black text-[10px] tracking-widest uppercase shadow-none px-3" : "bg-foreground text-background font-black text-[10px] tracking-widest uppercase shadow-none px-3"}>
                              {isFuture ? "Future State" : "Current State"}
                            </Badge>
                            {journey.persona && <Badge variant="outline" className="border-border/60 text-muted-foreground text-[10px] uppercase tracking-widest font-black shadow-none bg-background/50 backdrop-blur">{journey.persona}</Badge>}
                          </div>
                          <CardTitle className="text-2xl text-foreground font-black tracking-tight">{journey.title}</CardTitle>
                        </div>
                      </div>
                      {journey.scenario && <p className="text-foreground/80 font-medium text-base mt-4 max-w-4xl leading-relaxed relative z-10">{journey.scenario}</p>}
                    </CardHeader>
                    <CardContent className="p-0">
                      {stages.length === 0 ? (
                        <p className="p-8 text-muted-foreground text-center font-medium">No stages mapped.</p>
                      ) : (
                        <div className="overflow-x-auto custom-scrollbar pb-6 pt-6 px-8">
                          <div className="flex min-w-max pb-4">
                            {stages.map((stage, si) => (
                              <div key={si} className="flex relative">
                                <div className="w-80 flex-shrink-0 bg-background border border-border/60 rounded-2xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-md relative z-10 mx-2 flex flex-col">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black font-mono shadow-sm ${isFuture ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'}`}>
                                      {si + 1}
                                    </div>
                                    <span className="font-black text-foreground text-lg tracking-tight line-clamp-2">{stage.name}</span>
                                  </div>

                                  {stage.userGoal && (
                                    <div className="mb-6 bg-secondary/50 rounded-xl p-4 border border-border/50 flex-1">
                                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 font-mono">User Goal</div>
                                      <p className="text-sm font-medium text-foreground leading-relaxed">{stage.userGoal}</p>
                                    </div>
                                  )}

                                  {stage.emotions && (
                                    <div className="flex flex-col items-center justify-center gap-2 mb-6 bg-card border-2 border-border/50 rounded-xl p-4 shadow-sm">
                                      <EmotionIcon emotions={stage.emotions} />
                                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono text-center">{stage.emotions}</span>
                                    </div>
                                  )}

                                  {stage.painPoints && stage.painPoints.length > 0 && (
                                    <div className="mb-6">
                                      <div className="text-[10px] font-black uppercase tracking-widest text-destructive mb-3 flex items-center gap-1.5 font-mono">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Pain Points
                                      </div>
                                      <ul className="space-y-3">
                                        {stage.painPoints.slice(0, 3).map((p, i) => (
                                          <li key={i} className="text-sm font-medium text-foreground flex items-start gap-3 bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                                            <span className="text-destructive font-black shrink-0 mt-[1px]">•</span> 
                                            <span className="leading-snug">{p}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {stage.opportunities && stage.opportunities.length > 0 && (
                                    <div className="mt-auto">
                                      <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5 font-mono">
                                        <Lightbulb className="w-3.5 h-3.5" /> Opportunities
                                      </div>
                                      <ul className="space-y-3">
                                        {stage.opportunities.slice(0, 3).map((o, i) => (
                                          <li key={i} className="text-sm font-medium text-foreground flex items-start gap-3 bg-primary/5 rounded-lg p-3 border border-primary/10">
                                            <span className="text-primary font-black shrink-0 mt-[1px]">•</span> 
                                            <span className="leading-snug">{o}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                
                                {si < stages.length - 1 && (
                                  <div className="flex items-center px-0 relative z-0">
                                    <div className="absolute top-1/2 left-0 w-8 h-1 bg-gradient-to-r from-border/50 to-border/50 -translate-y-1/2 -z-10" />
                                    <div className="w-8 h-8 rounded-full bg-background border-2 border-border/80 flex items-center justify-center text-muted-foreground shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors bg-card z-20">
                                      <ChevronRight className="w-4 h-4" />
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
