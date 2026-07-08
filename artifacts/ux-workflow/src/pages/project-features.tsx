import { useParams } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Edit2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListFeatures, useUpdateFeature, getListFeaturesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function MoSCoWBadge({ priority }: { priority?: string | null }) {
  const map: Record<string, string> = {
    must: "bg-destructive/10 text-destructive border-destructive/20",
    should: "bg-primary/10 text-primary border-primary/20",
    could: "bg-secondary text-secondary-foreground border-border",
    wont: "bg-muted text-muted-foreground border-border",
  };
  const p = priority ?? "should";
  return <Badge className={`${map[p] ?? map.should} text-[10px] font-mono font-semibold uppercase tracking-wider`}>{p}</Badge>;
}

function PhaseBadge({ phase }: { phase?: string | null }) {
  const map: Record<string, string> = {
    mvp: "bg-primary/10 text-primary border-primary/20",
    phase2: "bg-secondary text-secondary-foreground border-border",
    future: "bg-muted text-muted-foreground border-border",
  };
  const p = phase ?? "phase2";
  const labels: Record<string, string> = { mvp: "MVP", phase2: "Phase 2", future: "Future" };
  return <Badge className={`${map[p] ?? map.phase2} text-xs font-mono font-medium tracking-wide`}>{labels[p] ?? p}</Badge>;
}

export default function ProjectFeaturesPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: features, isLoading } = useListFeatures(projectId);
  const updateFeature = useUpdateFeature();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editReach, setEditReach] = useState("");

  const phases = ["mvp", "phase2", "future"];

  const handleUpdateReach = (featureId: number) => {
    const reach = parseInt(editReach);
    if (isNaN(reach)) return;
    updateFeature.mutate(
      { id: projectId, featureId, data: { reach } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListFeaturesQueryKey(projectId) });
          setEditingId(null);
          toast({ title: "Feature updated" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 w-full">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Feature Prioritization</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl leading-relaxed">
              RICE-scored features organized by phase. Edit scores to recalibrate priorities.
            </p>
          </div>
          {features && (
            <Badge variant="secondary" className="font-mono text-xs shadow-sm bg-white">
              {features.length} features
            </Badge>
          )}
        </div>

        {!features || features.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-border bg-muted/30 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No features yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Run the Feature Prioritization agent to generate a RICE-scored backlog.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {phases.map((phase, pIndex) => {
              const phaseFeatures = features.filter(f => (f.phase ?? "phase2") === phase);
              if (phaseFeatures.length === 0) return null;
              
              return (
                <div key={phase}>
                  <div className="flex items-center gap-3 mb-5">
                    <PhaseBadge phase={phase} />
                    <div className="h-px flex-1 bg-border/50"></div>
                    <span className="text-xs font-mono text-muted-foreground">{phaseFeatures.length} item{phaseFeatures.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {phaseFeatures
                        .sort((a, b) => (b.riceScore ?? 0) - (a.riceScore ?? 0))
                        .map((feature, i) => (
                        <motion.div 
                          key={feature.id} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: (pIndex * 0.1) + (i * 0.05), duration: 0.3 }}
                        >
                          <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                                {/* RICE score */}
                                <div className="sm:w-28 sm:h-auto p-4 sm:p-6 bg-primary/5 sm:border-r border-b sm:border-b-0 border-border flex sm:flex-col items-center justify-center flex-shrink-0 gap-2 sm:gap-1">
                                  <div className="text-xs font-mono font-medium text-primary uppercase tracking-widest sm:mb-1">RICE</div>
                                  <div className="text-2xl sm:text-3xl font-bold font-mono text-primary tracking-tight">
                                    {feature.riceScore?.toFixed(0) ?? "—"}
                                  </div>
                                </div>

                                <div className="flex-1 p-4 sm:p-5 min-w-0">
                                  <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <h3 className="font-semibold text-foreground text-base tracking-tight">{feature.title}</h3>
                                    <MoSCoWBadge priority={feature.moscowPriority} />
                                    {feature.category && (
                                      <Badge variant="secondary" className="text-[10px] font-mono text-secondary-foreground capitalize">
                                        {feature.category.replace(/_/g, ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {feature.description && (
                                    <p className="text-muted-foreground text-sm mb-5 leading-relaxed line-clamp-2 pr-4">
                                      {feature.description}
                                    </p>
                                  )}

                                  {/* RICE components */}
                                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Reach</span>
                                      {editingId === feature.id ? (
                                        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                                          <Input
                                            value={editReach}
                                            onChange={e => setEditReach(e.target.value)}
                                            className="h-6 w-16 text-xs px-2 bg-background border-border font-mono shadow-sm"
                                            type="number"
                                            min={1} max={10000}
                                            autoFocus
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') handleUpdateReach(feature.id);
                                              if (e.key === 'Escape') setEditingId(null);
                                            }}
                                          />
                                          <button onClick={() => handleUpdateReach(feature.id)} className="w-6 h-6 flex items-center justify-center text-primary hover:bg-background rounded shadow-sm transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => setEditingId(null)} className="w-6 h-6 flex items-center justify-center text-destructive hover:bg-background rounded shadow-sm transition-colors"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 group/edit">
                                          <span className="text-foreground font-semibold">{feature.reach ?? "—"}</span>
                                          <button 
                                            onClick={() => { setEditingId(feature.id); setEditReach(String(feature.reach ?? "")); }} 
                                            className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover/edit:opacity-100 focus:opacity-100"
                                            aria-label="Edit reach"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Impact</span>
                                      <span className="text-foreground font-semibold">{feature.impact ?? "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Confidence</span>
                                      <span className="text-foreground font-semibold">{feature.confidence ?? "—"}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Effort</span>
                                      <span className="text-foreground font-semibold">{feature.effort ?? "—"}w</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
