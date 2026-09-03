import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageHeader, EmptyState, listContainer, listItem } from "@/components/page-header";
import { useListRecommendations, useApproveRecommendation, getListRecommendationsQueryKey, getListApprovalHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ApprovalActions } from "@/components/approval-actions";
import { ReviewThread } from "@/components/review-thread";

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

  const handleApprove = (recId: number, status: "approved" | "rejected", comment?: string) => {
    approve.mutate(
      { id: projectId, recId, data: { status, comment } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListRecommendationsQueryKey(projectId) });
          void qc.invalidateQueries({ queryKey: getListApprovalHistoryQueryKey(projectId, "recommendation", recId) });
          toast({ title: status === "approved" ? "Recommendation approved" : "Recommendation rejected" });
        },
      }
    );
  };

  const categories = recs ? [...new Set(recs.map(r => r.category ?? "General"))] : [];

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
        <PageHeader
          icon={Lightbulb}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10 border-amber-500/20"
          accentColor="bg-amber-500"
          label="UX Strategy"
          title="Recommendations"
          description="Evidence-linked recommendations with effort and priority scores."
          count={recs?.length}
          right={recs && (
            <div className="flex items-center gap-2 bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
              <span className="text-emerald-600 font-black font-mono">{recs.filter(r => r.approvalStatus === "approved").length}</span>
              <span className="text-muted-foreground/40 font-mono">/</span>
              <span className="text-muted-foreground font-black font-mono">{recs.length}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono ml-1">approved</span>
            </div>
          )}
        />

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />)}</div>
        ) : !recs || recs.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No strategy formulated" description="Run the UX Strategy agent to generate evidence-linked recommendations." />
        ) : (
          <div className="space-y-12">
            {categories.map(category => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest font-mono bg-secondary/80 px-4 py-1.5 rounded-lg border border-border/50">{category}</h2>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <motion.div variants={listContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid md:grid-cols-2 gap-5">
                  {recs.filter(r => (r.category ?? "General") === category).map((rec, i) => (
                    <motion.div key={rec.id} variants={listItem} className="h-full">
                      <motion.div whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(245,158,11,0.12)" }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="h-full">
                      <Card className={`h-full border-2 transition-colors duration-300 relative overflow-hidden group ${
                        rec.approvalStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]" :
                        rec.approvalStatus === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60 grayscale-[0.5]" :
                        "border-border/60 bg-card hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] glass-card"
                      }`}>
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardContent className="p-7 flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <h3 className="font-bold text-foreground text-xl tracking-tight leading-snug flex-1">{rec.title}</h3>
                            {rec.approvalStatus === "pending" && (
                              <ApprovalActions
                                pending={approve.isPending}
                                onDecision={(status, comment) => handleApprove(rec.id, status, comment)}
                              />
                            )}
                          </div>
                          <div className="mt-4 pt-3 border-t border-border/50">
                            <ReviewThread projectId={projectId} itemType="recommendation" itemId={rec.id} />
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
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
