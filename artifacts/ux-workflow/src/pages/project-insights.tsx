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
    high: "bg-cyan-400/15 text-cyan-400 border-cyan-400/20",
    medium: "bg-yellow-400/15 text-yellow-400 border-yellow-400/20",
    low: "bg-orange-400/15 text-orange-400 border-orange-400/20",
  };
  const l = level ?? "medium";
  return <Badge className={`${map[l] ?? map.medium} capitalize text-xs`}>{l} confidence</Badge>;
}

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-green-400/15 text-green-400 border-green-400/20 text-xs">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-400/15 text-red-400 border-red-400/20 text-xs">Rejected</Badge>;
  return <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/20 text-xs">Pending review</Badge>;
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
      { projectId, insightId, data: { status } },
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
              <span className="text-green-400 font-medium">{insights.filter(i => i.approvalStatus === "approved").length} approved</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{insights.length} total</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : !insights || insights.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No insights yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Research Synthesis agent to generate evidence-linked insights from your source materials.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {clusters.map(cluster => (
              <div key={cluster}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{cluster}</h2>
                <div className="space-y-3">
                  {insights.filter(i => (i.cluster ?? "General") === cluster).map((insight, idx) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card className={`border transition-colors ${
                        insight.approvalStatus === "approved" ? "border-green-400/20 bg-green-400/3" :
                        insight.approvalStatus === "rejected" ? "border-red-400/15 bg-red-400/3 opacity-60" :
                        "border-border bg-card"
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FlaskConical className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <ApprovalBadge status={insight.approvalStatus} />
                                <ConfidenceBadge level={insight.confidence} />
                                {insight.tags && (
                                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">{insight.tags}</Badge>
                                )}
                              </div>
                              <p className="text-foreground text-sm leading-relaxed mb-2">{insight.insight}</p>
                              {insight.evidence && (
                                <p className="text-muted-foreground text-xs italic border-l-2 border-cyan-400/30 pl-3">
                                  Evidence: {insight.evidence}
                                </p>
                              )}
                            </div>
                            {insight.approvalStatus === "pending" && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-8 w-8 text-green-400 hover:bg-green-400/10 hover:text-green-400"
                                  onClick={() => handleApprove(insight.id, "approved")}
                                  disabled={approve.isPending}
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-8 w-8 text-red-400 hover:bg-red-400/10 hover:text-red-400"
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
