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
    medium: "bg-secondary text-secondary-foreground border-border",
    low: "bg-muted text-muted-foreground border-border",
  };
  const l = level ?? "medium";
  return <Badge className={`${map[l] ?? map.medium} capitalize text-xs font-mono shadow-none`}>{l} confidence</Badge>;
}

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-mono shadow-none">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-mono shadow-none">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-mono shadow-none">Pending review</Badge>;
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
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Research Insights</h1>
            <p className="text-muted-foreground text-sm mt-1">AI-synthesized findings from your source materials. Approve or reject each insight.</p>
          </div>
          {insights && (
            <div className="flex gap-2 text-sm">
              <span className="text-emerald-600 font-medium font-mono">{insights.filter(i => i.approvalStatus === "approved").length} approved</span>
              <span className="text-muted-foreground font-mono">/</span>
              <span className="text-muted-foreground font-mono">{insights.length} total</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : !insights || insights.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No insights yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Research Synthesis agent to generate evidence-linked insights from your source materials.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {clusters.map(cluster => (
              <div key={cluster}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1 font-mono">{cluster}</h2>
                <div className="space-y-3">
                  {insights.filter(i => (i.cluster ?? "General") === cluster).map((insight, idx) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card className={`border transition-all duration-200 shadow-sm hover:shadow-md ${
                        insight.approvalStatus === "approved" ? "border-emerald-500/20 bg-emerald-500/5" :
                        insight.approvalStatus === "rejected" ? "border-destructive/15 bg-destructive/5 opacity-70" :
                        "border-border bg-card hover:border-primary/30"
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FlaskConical className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <ApprovalBadge status={insight.approvalStatus} />
                                <ConfidenceBadge level={insight.confidence} />
                                {insight.tags && (
                                  <Badge variant="outline" className="text-xs border-border text-muted-foreground font-mono shadow-none">{insight.tags}</Badge>
                                )}
                              </div>
                              <p className="text-foreground text-sm leading-relaxed mb-3">{insight.insight}</p>
                              {insight.evidence && (
                                <p className="text-muted-foreground text-xs italic border-l-2 border-primary/20 pl-3">
                                  Evidence: {insight.evidence}
                                </p>
                              )}
                            </div>
                            {insight.approvalStatus === "pending" && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 rounded-full"
                                  onClick={() => handleApprove(insight.id, "approved")}
                                  disabled={approve.isPending}
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                                  onClick={() => handleApprove(insight.id, "rejected")}
                                  disabled={approve.isPending}
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
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
