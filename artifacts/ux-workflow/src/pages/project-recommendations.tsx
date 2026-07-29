import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Lightbulb, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListRecommendations, useApproveRecommendation, getListRecommendationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function EffortBadge({ effort }: { effort?: string | null }) {
  const map: Record<string, string> = {
    low: "bg-secondary text-secondary-foreground border-border/50",
    medium: "bg-secondary text-secondary-foreground border-border/50",
    high: "bg-secondary text-secondary-foreground border-border/50",
  };
  const e = effort ?? "medium";
  return <Badge className={`${map[e] ?? map.medium} text-[10px] font-black uppercase tracking-widest font-mono shadow-none`}>{e} eff</Badge>;
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const map: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    medium: "bg-primary/10 text-primary border-primary/20",
    low: "bg-muted text-muted-foreground border-border/50",
  };
  const p = priority ?? "medium";
  return <Badge className={`${map[p] ?? map.medium} text-[10px] font-black uppercase tracking-widest font-mono shadow-none`}>{p} pri</Badge>;
}

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest font-mono shadow-none">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-black uppercase tracking-widest font-mono shadow-none">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-black uppercase tracking-widest font-mono shadow-none">Review</Badge>;
}

export default function ProjectRecommendationsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: recs, isLoading } = useListRecommendations(projectId);
  const approve = useApproveRecommendation();

  const handleApprove = (recId: number, status: "approved" | "rejected") => {
    approve.mutate(
      { id: projectId, recId, data: { status } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListRecommendationsQueryKey(projectId) });
          toast({ title: status === "approved" ? "Recommendation approved" : "Recommendation rejected" });
        },
      }
    );
  };

  const categories = recs ? [...new Set(recs.map(r => r.category ?? "General"))] : [];

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-border/50 pb-6">
          <div className="relative">
            <div className="absolute -left-4 top-2 w-1 h-12 bg-amber-500 rounded-r-full" />
            <h1 className="text-3xl font-black text-foreground tracking-tighter">UX Strategy</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-medium">Evidence-linked recommendations with effort and priority scores.</p>
          </div>
          {recs && (
            <div className="flex gap-2 text-sm bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
              <span className="text-emerald-600 font-bold font-mono text-base">{recs.filter(r => r.approvalStatus === "approved").length} <span className="text-xs uppercase tracking-widest text-emerald-600/70">app</span></span>
              <span className="text-muted-foreground/30 font-mono text-lg">/</span>
              <span className="text-muted-foreground font-bold font-mono text-base">{recs.length} <span className="text-xs uppercase tracking-widest text-muted-foreground/50">tot</span></span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : !recs || recs.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-2 border-border bg-card/30 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 shadow-sm border border-amber-500/20">
                  <Lightbulb className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="font-black text-2xl text-foreground mb-3 tracking-tight">No strategy formulated</h3>
                <p className="text-muted-foreground text-base max-w-md font-medium">Run the UX Strategy agent to generate evidence-linked recommendations.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {categories.map(category => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest font-mono bg-secondary/80 px-4 py-1.5 rounded-lg border border-border/50">{category}</h2>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {recs.filter(r => (r.category ?? "General") === category).map((rec, i) => (
                    <motion.div key={rec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }} className="h-full">
                      <Card className={`h-full border-2 transition-all duration-300 shadow-sm relative overflow-hidden group ${
                        rec.approvalStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]" :
                        rec.approvalStatus === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60 grayscale-[0.5]" :
                        "border-border/60 bg-card hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] glass-card"
                      }`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardContent className="p-7 flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <h3 className="font-bold text-foreground text-xl tracking-tight leading-snug flex-1">{rec.title}</h3>
                            {rec.approvalStatus === "pending" && (
                              <div className="flex gap-2 flex-shrink-0 bg-background/50 backdrop-blur border border-border/50 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all focus-within:opacity-100 -translate-y-2 group-hover:translate-y-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 rounded-full"
                                  onClick={() => handleApprove(rec.id, "approved")} disabled={approve.isPending} title="Approve">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-full"
                                  onClick={() => handleApprove(rec.id, "rejected")} disabled={approve.isPending} title="Reject">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2.5 mb-6">
                            <ApprovalBadge status={rec.approvalStatus} />
                            <PriorityBadge priority={rec.priority} />
                            <EffortBadge effort={rec.effort} />
                          </div>

                          <p className="text-muted-foreground text-base font-medium leading-relaxed mb-6 flex-1">{rec.description}</p>

                          <div className="mt-auto space-y-4 pt-5 border-t border-border/50">
                            {rec.expectedImpact && (
                              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 group-hover:border-amber-500/20 transition-colors">
                                <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1 font-mono">Expected Impact</div>
                                  <span className="text-amber-900 dark:text-amber-200 font-bold text-sm">{rec.expectedImpact}</span>
                                </div>
                              </div>
                            )}
                            
                            {rec.evidence && (
                              <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 group-hover:border-border transition-colors">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 font-mono">Evidence Link</div>
                                <div className="text-sm font-medium text-muted-foreground italic leading-relaxed">
                                  "{rec.evidence}"
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
