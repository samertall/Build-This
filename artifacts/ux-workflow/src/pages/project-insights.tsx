import { useParams } from "wouter";
import { motion } from "framer-motion";
import { FlaskConical, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageHeader, EmptyState, listContainer, listItem } from "@/components/page-header";
import { useListInsights, useApproveInsight, getListInsightsQueryKey, getListApprovalHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ApprovalActions } from "@/components/approval-actions";
import { ReviewThread } from "@/components/review-thread";
import { trackEvent } from "@/lib/analytics";

function ConfidenceBadge({ level }: { level?: string | null }) {
  const map: Record<string, string> = {
    high: "bg-primary/10 text-primary border-primary/20",
    medium: "bg-secondary text-secondary-foreground border-border/50",
    low: "bg-muted text-muted-foreground border-border/50",
  };
  const l = level ?? "medium";
  return <Badge className={`${map[l] ?? map.medium} capitalize text-[10px] font-mono shadow-none tracking-wider font-bold`}>{l} conf</Badge>;
}

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold animate-border-flow">Review</Badge>;
}

export default function ProjectInsightsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: insights, isLoading } = useListInsights(projectId);
  const approve = useApproveInsight();

  const handleApprove = (insightId: number, status: "approved" | "rejected", comment?: string) => {
    approve.mutate(
      { id: projectId, insightId, data: { status, comment } },
      {
        onSuccess: () => {
          trackEvent("insight_reviewed", { decision: status });
          void qc.invalidateQueries({ queryKey: getListInsightsQueryKey(projectId) });
          void qc.invalidateQueries({ queryKey: getListApprovalHistoryQueryKey(projectId, "insight", insightId) });
          toast({ title: status === "approved" ? "Insight approved" : "Insight rejected" });
        },
      }
    );
  };

  const clusters = insights ? [...new Set(insights.map(i => i.cluster ?? "General"))] : [];
  const approvedCount = insights?.filter(i => i.approvalStatus === "approved").length ?? 0;

  const CountPill = () => insights ? (
    <div className="flex items-center gap-2 bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
      <span className="text-emerald-600 font-black font-mono text-base">{approvedCount}</span>
      <span className="text-muted-foreground/40 font-mono">/</span>
      <span className="text-muted-foreground font-black font-mono text-base">{insights.length}</span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono ml-1">approved</span>
    </div>
  ) : null;

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
        <PageHeader
          icon={FlaskConical}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10 border-violet-500/20"
          accentColor="bg-violet-500"
          label="Research Synthesis"
          title="Insights"
          description="AI-synthesized findings from your source materials. Validate to build consensus."
          count={insights?.length}
          right={<CountPill />}
        />

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-card border border-border overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-slide" />
              </div>
            ))}
          </div>
        ) : !insights || insights.length === 0 ? (
          <EmptyState icon={Brain} title="No insights synthesized" description="Run the Research Synthesis agent to generate evidence-linked insights from your pipeline sources." />
        ) : (
          <div className="space-y-14">
            {clusters.map(cluster => (
              <div key={cluster}>
                {/* Cluster header */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest font-mono bg-secondary/80 px-4 py-1.5 rounded-lg border border-border/50">{cluster}</span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-px flex-1 bg-gradient-to-r from-border/70 to-transparent origin-left"
                  />
                </div>

                <motion.div
                  variants={listContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  className="grid md:grid-cols-2 gap-5"
                >
                  {insights.filter(i => (i.cluster ?? "General") === cluster).map((insight) => (
                    <motion.div key={insight.id} variants={listItem}>
                      <motion.div
                        whileHover={{ y: -4, boxShadow: insight.approvalStatus === "approved" ? "0 16px 48px rgba(16,185,129,0.12)" : "0 16px 48px rgba(24,147,247,0.12)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="h-full"
                      >
                        <Card className={`h-full border-2 transition-colors duration-300 relative overflow-hidden group ${
                          insight.approvalStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5" :
                          insight.approvalStatus === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60" :
                          "border-border/60 bg-card hover:border-violet-500/30 glass-card"
                        }`}>
                          {/* Top accent */}
                          <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                            insight.approvalStatus === "approved" ? "bg-emerald-500" :
                            insight.approvalStatus === "rejected" ? "bg-destructive" :
                            "bg-gradient-to-r from-violet-500/60 to-transparent"
                          }`} />
                          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-[50px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          <CardContent className="p-6 flex flex-col h-full relative z-10">
                            <div className="flex items-start gap-3 mb-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                                insight.approvalStatus === "approved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                insight.approvalStatus === "rejected" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                "bg-violet-500/10 border-violet-500/20 text-violet-500"
                              }`}>
                                <FlaskConical className="w-5 h-5" />
                              </div>
                              <div className="flex-1 flex items-center gap-2 flex-wrap pt-1">
                                <ApprovalBadge status={insight.approvalStatus} />
                                <ConfidenceBadge level={insight.confidence} />
                                {insight.tags && (
                                  <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-mono shadow-none uppercase tracking-wider">{insight.tags}</Badge>
                                )}
                              </div>

                              {insight.approvalStatus === "pending" && (
                                <ApprovalActions
                                  pending={approve.isPending}
                                  onDecision={(status, comment) => handleApprove(insight.id, status, comment)}
                                />
                              )}
                            </div>

                            <p className="text-foreground text-base leading-relaxed mb-5 font-medium flex-1">{insight.insight}</p>

                            {insight.evidence && (
                              <div className="mt-auto bg-secondary/40 rounded-xl p-4 border border-border/50 group-hover:border-violet-500/20 transition-colors">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 font-mono">Evidence</div>
                                <p className="text-muted-foreground text-sm italic leading-relaxed">"{insight.evidence}"</p>
                              </div>
                            )}
                            <div className="mt-4 pt-3 border-t border-border/50">
                              <ReviewThread projectId={projectId} itemType="insight" itemId={insight.id} />
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
