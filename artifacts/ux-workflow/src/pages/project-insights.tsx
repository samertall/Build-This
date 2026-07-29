import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, FlaskConical, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListInsights, useApproveInsight, getListInsightsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Review</Badge>;
}

export default function ProjectInsightsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: insights, isLoading } = useListInsights(projectId);
  const approve = useApproveInsight();

  const handleApprove = (insightId: number, status: "approved" | "rejected") => {
    approve.mutate(
      { id: projectId, insightId, data: { status } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListInsightsQueryKey(projectId) });
          toast({ title: status === "approved" ? "Insight approved" : "Insight rejected" });
        },
      }
    );
  };

  const clusters = insights ? [...new Set(insights.map(i => i.cluster ?? "General"))] : [];

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-border/50 pb-6">
          <div className="relative">
            <div className="absolute -left-4 top-2 w-1 h-12 bg-primary rounded-r-full" />
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Research Insights</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-medium">AI-synthesized findings from your source materials. Validate outputs to build consensus.</p>
          </div>
          {insights && (
            <div className="flex gap-2 text-sm bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
              <span className="text-emerald-600 font-bold font-mono text-base">{insights.filter(i => i.approvalStatus === "approved").length} <span className="text-xs uppercase tracking-widest text-emerald-600/70">app</span></span>
              <span className="text-muted-foreground/30 font-mono text-lg">/</span>
              <span className="text-muted-foreground font-bold font-mono text-base">{insights.length} <span className="text-xs uppercase tracking-widest text-muted-foreground/50">tot</span></span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
        ) : !insights || insights.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-2 border-border bg-card/30 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/10">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-black text-2xl text-foreground mb-3 tracking-tight">No insights synthesized</h3>
                <p className="text-muted-foreground text-base max-w-md font-medium">Run the Research Synthesis agent to generate evidence-linked insights from your pipeline sources.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {clusters.map(cluster => (
              <div key={cluster} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest font-mono bg-secondary/80 px-4 py-1.5 rounded-lg border border-border/50">{cluster}</h2>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {insights.filter(i => (i.cluster ?? "General") === cluster).map((insight, idx) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                      className="h-full"
                    >
                      <Card className={`h-full border-2 transition-all duration-300 shadow-sm relative overflow-hidden group ${
                        insight.approvalStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]" :
                        insight.approvalStatus === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60 grayscale-[0.5]" :
                        "border-border/60 bg-card hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(24,147,247,0.1)] glass-card"
                      }`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 flex flex-col h-full relative z-10">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                              insight.approvalStatus === "approved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                              insight.approvalStatus === "rejected" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                              "bg-primary/10 border-primary/20 text-primary"
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
                              <div className="flex gap-2 flex-shrink-0 bg-background/50 backdrop-blur border border-border/50 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all focus-within:opacity-100 -translate-y-2 group-hover:translate-y-0">
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 rounded-full transition-colors"
                                  onClick={() => handleApprove(insight.id, "approved")}
                                  disabled={approve.isPending}
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors"
                                  onClick={() => handleApprove(insight.id, "rejected")}
                                  disabled={approve.isPending}
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-foreground text-base leading-relaxed mb-6 font-medium flex-1">{insight.insight}</p>
                          
                          {insight.evidence && (
                            <div className="mt-auto bg-secondary/50 rounded-xl p-4 border border-border/50 group-hover:border-primary/20 transition-colors">
                              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 font-mono">Evidence</div>
                              <p className="text-muted-foreground text-sm italic leading-relaxed">
                                "{insight.evidence}"
                              </p>
                            </div>
                          )}
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
