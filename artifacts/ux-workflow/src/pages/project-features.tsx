import { useParams } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Edit2, Check, X, Sparkles } from "lucide-react";
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
    should: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    could: "bg-primary/10 text-primary border-primary/20",
    wont: "bg-muted text-muted-foreground border-border/50",
  };
  const p = priority ?? "should";
  return <Badge className={`${map[p] ?? map.should} text-[10px] font-mono font-black uppercase tracking-widest shadow-none`}>{p}</Badge>;
}

function PhaseBadge({ phase }: { phase?: string | null }) {
  const map: Record<string, string> = {
    mvp: "bg-primary/10 text-primary border-primary/20",
    phase2: "bg-secondary text-secondary-foreground border-border/50",
    future: "bg-muted text-muted-foreground border-border/50",
  };
  const p = phase ?? "phase2";
  const labels: Record<string, string> = { mvp: "MVP", phase2: "Phase 2", future: "Future" };
  return <Badge className={`${map[p] ?? map.phase2} text-sm font-mono font-black tracking-widest uppercase shadow-none px-4 py-1.5`}>{labels[p] ?? p}</Badge>;
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
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 w-full">
          <div>
            <Skeleton className="h-10 w-80 mb-3 rounded-xl" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-border/50 pb-6">
          <div className="relative">
            <div className="absolute -left-4 top-2 w-1 h-12 bg-emerald-500 rounded-r-full" />
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Feature Prioritization</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-medium">
              RICE-scored features organized by phase. Edit scores to recalibrate.
            </p>
          </div>
          {features && (
            <div className="flex gap-2 text-sm bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
              <span className="text-emerald-600 font-bold font-mono text-base">{features.length} <span className="text-xs uppercase tracking-widest text-emerald-600/70">features</span></span>
            </div>
          )}
        </div>

        {!features || features.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-2 border-border bg-card/30 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 shadow-sm border border-emerald-500/20">
                  <Star className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-black text-2xl text-foreground mb-3 tracking-tight">No features prioritized</h3>
                <p className="text-muted-foreground text-base max-w-md font-medium">
                  Run the Feature Prioritization agent to generate a RICE-scored backlog.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {phases.map((phase, pIndex) => {
              const phaseFeatures = features.filter(f => (f.phase ?? "phase2") === phase);
              if (phaseFeatures.length === 0) return null;
              
              return (
                <div key={phase}>
                  <div className="flex items-center gap-4 mb-6">
                    <PhaseBadge phase={phase} />
                    <div className="h-px flex-1 bg-border/50"></div>
                    <span className="text-xs font-black font-mono text-muted-foreground uppercase tracking-widest">{phaseFeatures.length} item{phaseFeatures.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-5">
                    <AnimatePresence>
                      {phaseFeatures
                        .sort((a, b) => (b.riceScore ?? 0) - (a.riceScore ?? 0))
                        .map((feature, i) => (
                        <motion.div 
                          key={feature.id} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: (pIndex * 0.1) + (i * 0.05), type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <Card className="border-border/60 bg-card shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:border-emerald-500/30 transition-all duration-300 overflow-hidden group glass-card">
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center relative">
                                {/* Ambient glow on hover */}
                                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* RICE score */}
                                <div className="sm:w-32 sm:h-auto p-5 sm:p-6 bg-gradient-to-br from-emerald-500/10 to-transparent sm:border-r border-b sm:border-b-0 border-border/50 flex sm:flex-col items-center justify-center flex-shrink-0 gap-3 sm:gap-2 relative z-10">
                                  <div className="text-[11px] font-black font-mono text-emerald-600 uppercase tracking-widest">RICE</div>
                                  <div className="text-4xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                                    {feature.riceScore?.toFixed(0) ?? "—"}
                                  </div>
                                </div>

                                <div className="flex-1 p-6 sm:p-7 min-w-0 relative z-10">
                                  <div className="flex items-center gap-4 flex-wrap mb-3">
                                    <h3 className="font-black text-foreground text-xl tracking-tight leading-none">{feature.title}</h3>
                                    <MoSCoWBadge priority={feature.moscowPriority} />
                                    {feature.category && (
                                      <Badge variant="secondary" className="text-[10px] font-black font-mono text-muted-foreground uppercase tracking-widest shadow-none bg-secondary/50">
                                        {feature.category.replace(/_/g, ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {feature.description && (
                                    <p className="text-muted-foreground text-base mb-6 leading-relaxed line-clamp-2 pr-4 font-medium">
                                      {feature.description}
                                    </p>
                                  )}

                                  {/* RICE components */}
                                  <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm font-mono">
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Reach</span>
                                      {editingId === feature.id ? (
                                        <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(24,147,247,0.15)]">
                                          <Input
                                            value={editReach}
                                            onChange={e => setEditReach(e.target.value)}
                                            className="h-8 w-20 text-sm px-3 bg-transparent border-0 focus-visible:ring-0 font-mono font-bold"
                                            type="number"
                                            min={1} max={10000}
                                            autoFocus
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') handleUpdateReach(feature.id);
                                              if (e.key === 'Escape') setEditingId(null);
                                            }}
                                          />
                                          <button onClick={() => handleUpdateReach(feature.id)} className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                                          <button onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 group/edit bg-secondary/40 px-3 py-1.5 rounded-lg border border-border/50">
                                          <span className="text-foreground font-bold">{feature.reach ?? "—"}</span>
                                          <button 
                                            onClick={() => { setEditingId(feature.id); setEditReach(String(feature.reach ?? "")); }} 
                                            className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover/edit:opacity-100 focus:opacity-100"
                                            aria-label="Edit reach"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Impact</span>
                                      <span className="text-foreground font-bold bg-secondary/40 px-3 py-1.5 rounded-lg border border-border/50">{feature.impact ?? "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Conf</span>
                                      <span className="text-foreground font-bold bg-secondary/40 px-3 py-1.5 rounded-lg border border-border/50">{feature.confidence ?? "—"}%</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Effort</span>
                                      <span className="text-foreground font-bold bg-secondary/40 px-3 py-1.5 rounded-lg border border-border/50">{feature.effort ?? "—"}</span>
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
