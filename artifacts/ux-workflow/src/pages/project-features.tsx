import { useParams } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Plus, Loader2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListFeatures, useUpdateFeature, getListFeaturesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function MoSCoWBadge({ priority }: { priority?: string | null }) {
  const map: Record<string, string> = {
    must: "bg-red-500/20 text-red-400 border-red-400/30",
    should: "bg-orange-400/15 text-orange-400 border-orange-400/20",
    could: "bg-yellow-400/15 text-yellow-400 border-yellow-400/20",
    wont: "bg-muted text-muted-foreground border-border",
  };
  const p = priority ?? "should";
  return <Badge className={`${map[p] ?? map.should} text-xs uppercase`}>{p}</Badge>;
}

function PhaseBadge({ phase }: { phase?: string | null }) {
  const map: Record<string, string> = {
    mvp: "bg-cyan-400/15 text-cyan-400 border-cyan-400/20",
    phase2: "bg-purple-400/15 text-purple-400 border-purple-400/20",
    future: "bg-muted text-muted-foreground border-border",
  };
  const p = phase ?? "phase2";
  const labels: Record<string, string> = { mvp: "MVP", phase2: "Phase 2", future: "Future" };
  return <Badge className={`${map[p] ?? map.phase2} text-xs`}>{labels[p] ?? p}</Badge>;
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
      { projectId, featureId, data: { reach } },
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
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feature Prioritization</h1>
            <p className="text-muted-foreground text-sm mt-1">RICE-scored features organized by phase. Edit scores to recalibrate priorities.</p>
          </div>
          {features && (
            <Badge variant="outline" className="border-border text-muted-foreground">{features.length} features</Badge>
          )}
        </div>

        {!features || features.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No features yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Feature Prioritization agent to generate a RICE-scored backlog.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {phases.map(phase => {
              const phaseFeatures = features.filter(f => (f.phase ?? "phase2") === phase);
              if (phaseFeatures.length === 0) return null;
              const phaseLabels: Record<string, string> = { mvp: "MVP", phase2: "Phase 2", future: "Future" };
              return (
                <div key={phase}>
                  <div className="flex items-center gap-3 mb-4">
                    <PhaseBadge phase={phase} />
                    <span className="text-sm text-muted-foreground">{phaseFeatures.length} features</span>
                  </div>
                  <div className="space-y-3">
                    {phaseFeatures
                      .sort((a, b) => (b.riceScore ?? 0) - (a.riceScore ?? 0))
                      .map((feature, i) => (
                      <motion.div key={feature.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <Card className="border-border bg-card hover:border-border/80 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {/* RICE score */}
                              <div className="w-16 h-16 rounded-xl bg-orange-400/10 flex flex-col items-center justify-center flex-shrink-0">
                                <div className="text-xl font-bold text-orange-400">{feature.riceScore?.toFixed(0) ?? "—"}</div>
                                <div className="text-xs text-muted-foreground">RICE</div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold text-foreground text-sm">{feature.title}</span>
                                  <MoSCoWBadge priority={feature.moscowPriority} />
                                  {feature.category && <Badge variant="outline" className="text-xs border-border text-muted-foreground">{feature.category}</Badge>}
                                </div>
                                {feature.description && (
                                  <p className="text-muted-foreground text-xs mb-3">{feature.description}</p>
                                )}

                                {/* RICE components */}
                                <div className="flex gap-4 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Reach: </span>
                                    {editingId === feature.id ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Input
                                          value={editReach}
                                          onChange={e => setEditReach(e.target.value)}
                                          className="h-5 w-14 text-xs px-1 bg-input border-border"
                                          type="number"
                                          min={1} max={100}
                                        />
                                        <button onClick={() => handleUpdateReach(feature.id)} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                                        <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
                                      </span>
                                    ) : (
                                      <span className="text-foreground font-medium">{feature.reach ?? "—"}
                                        <button onClick={() => { setEditingId(feature.id); setEditReach(String(feature.reach ?? "")); }} className="ml-1 text-muted-foreground hover:text-foreground">
                                          <Edit2 className="w-2.5 h-2.5 inline" />
                                        </button>
                                      </span>
                                    )}
                                  </div>
                                  <div><span className="text-muted-foreground">Impact: </span><span className="text-foreground font-medium">{feature.impact ?? "—"}</span></div>
                                  <div><span className="text-muted-foreground">Confidence: </span><span className="text-foreground font-medium">{feature.confidence ?? "—"}%</span></div>
                                  <div><span className="text-muted-foreground">Effort: </span><span className="text-foreground font-medium">{feature.effort ?? "—"}w</span></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
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
