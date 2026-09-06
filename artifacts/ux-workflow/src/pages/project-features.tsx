import { useParams } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Edit2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageHeader, EmptyState, listContainer, listItem } from "@/components/page-header";
import { useListFeatures, useUpdateFeature, getListFeaturesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

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
  const styles: Record<string, { bg: string; dot: string; label: string }> = {
    mvp: { bg: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary", label: "MVP" },
    phase2: { bg: "bg-secondary text-secondary-foreground border-border/50", dot: "bg-secondary-foreground/40", label: "Phase 2" },
    future: { bg: "bg-muted text-muted-foreground border-border/50", dot: "bg-muted-foreground/40", label: "Future" },
  };
  const s = styles[phase ?? "phase2"] ?? styles.phase2;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-mono font-black tracking-widest uppercase border ${s.bg} shadow-sm`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
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
          const feature = features?.find(item => item.id === featureId);
          trackEvent("feature_reach_updated", {
            phase: feature?.phase ?? "unspecified",
            priority: feature?.moscowPriority ?? "unspecified",
            reach,
          });
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
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full space-y-6">
          <div className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
          {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
        <PageHeader
          icon={Star}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          accentColor="bg-emerald-500"
          label="Feature Prioritization"
          title="Features"
          description="RICE-scored features organized by phase. Edit reach scores to recalibrate."
          count={features?.length}
        />

        {!features || features.length === 0 ? (
          <EmptyState icon={Star} title="No features prioritized" description="Run the Feature Prioritization agent to generate a RICE-scored backlog with MoSCoW prioritization." />
        ) : (
          <div className="space-y-14">
            {phases.map((phase, pIndex) => {
              const phaseFeatures = features.filter(f => (f.phase ?? "phase2") === phase);
              if (phaseFeatures.length === 0) return null;

              return (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pIndex * 0.12, type: "spring", stiffness: 240, damping: 26 }}
                >
                  {/* Phase header */}
                  <div className="flex items-center gap-4 mb-6">
                    <PhaseBadge phase={phase} />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: pIndex * 0.12 + 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="h-px flex-1 bg-gradient-to-r from-border/70 to-transparent origin-left"
                    />
                    <span className="text-[10px] font-black font-mono text-muted-foreground uppercase tracking-widest">
                      {phaseFeatures.length} item{phaseFeatures.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-4">
                    <AnimatePresence>
                      {phaseFeatures
                        .sort((a, b) => (b.riceScore ?? 0) - (a.riceScore ?? 0))
                        .map((feature) => (
                          <motion.div key={feature.id} variants={listItem} layout>
                            <motion.div
                              whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(16,185,129,0.1)" }}
                              transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            >
                              <Card className="border-border/60 bg-card hover:border-emerald-500/30 transition-colors duration-300 overflow-hidden group glass-card">
                                {/* Top accent line */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardContent className="p-0">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                                    {/* RICE score panel */}
                                    <div className="sm:w-28 p-5 sm:p-6 bg-gradient-to-br from-emerald-500/8 to-transparent sm:border-r border-b sm:border-b-0 border-border/50 flex sm:flex-col items-center justify-center flex-shrink-0 gap-3 sm:gap-1">
                                      <div className="text-[10px] font-black font-mono text-emerald-600 uppercase tracking-widest">RICE</div>
                                      <motion.div
                                        whileHover={{ scale: 1.15 }}
                                        className="text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tighter cursor-default"
                                      >
                                        {feature.riceScore?.toFixed(0) ?? "—"}
                                      </motion.div>
                                    </div>

                                    <div className="flex-1 p-5 sm:p-6 min-w-0">
                                      <div className="flex items-center gap-3 flex-wrap mb-2">
                                        <h3 className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">{feature.title}</h3>
                                        <MoSCoWBadge priority={feature.moscowPriority} />
                                        {feature.category && (
                                          <Badge variant="secondary" className="text-[10px] font-black font-mono text-muted-foreground uppercase tracking-widest shadow-none">
                                            {feature.category.replace(/_/g, " ")}
                                          </Badge>
                                        )}
                                      </div>

                                      {feature.description && (
                                        <p className="text-muted-foreground text-sm mb-5 leading-relaxed line-clamp-2 font-medium pr-4">{feature.description}</p>
                                      )}

                                      {/* RICE components */}
                                      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-mono">
                                        {/* Editable Reach */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Reach</span>
                                          {editingId === feature.id ? (
                                            <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-lg border border-primary/30 shadow-[0_0_12px_rgba(24,147,247,0.15)]">
                                              <Input
                                                value={editReach}
                                                onChange={e => setEditReach(e.target.value)}
                                                className="h-7 w-16 text-xs px-2 bg-transparent border-0 focus-visible:ring-0 font-mono font-bold"
                                                type="number" min={1} max={10000} autoFocus
                                                onKeyDown={e => { if (e.key === "Enter") handleUpdateReach(feature.id); if (e.key === "Escape") setEditingId(null); }}
                                              />
                                              <button onClick={() => handleUpdateReach(feature.id)} className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => setEditingId(null)} className="w-6 h-6 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5 group/edit bg-secondary/40 px-2.5 py-1.5 rounded-lg border border-border/50">
                                              <span className="text-foreground font-bold">{feature.reach ?? "—"}</span>
                                              <button onClick={() => { setEditingId(feature.id); setEditReach(String(feature.reach ?? "")); }} className="text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover/edit:opacity-100 focus:opacity-100" aria-label="Edit reach">
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        {[
                                          { label: "Impact", val: feature.impact },
                                          { label: "Conf", val: feature.confidence != null ? `${feature.confidence}%` : null },
                                          { label: "Effort", val: feature.effort },
                                        ].map(({ label, val }) => (
                                          <div key={label} className="flex items-center gap-2">
                                            <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">{label}</span>
                                            <span className="text-foreground font-bold bg-secondary/40 px-2.5 py-1.5 rounded-lg border border-border/50">{val ?? "—"}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
