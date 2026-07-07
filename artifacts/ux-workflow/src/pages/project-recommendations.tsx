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
    low: "bg-green-400/15 text-green-400 border-green-400/20",
    medium: "bg-yellow-400/15 text-yellow-400 border-yellow-400/20",
    high: "bg-red-400/15 text-red-400 border-red-400/20",
  };
  const e = effort ?? "medium";
  return <Badge className={`${map[e] ?? map.medium} text-xs capitalize`}>{e} effort</Badge>;
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const map: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-400/30",
    high: "bg-orange-400/15 text-orange-400 border-orange-400/20",
    medium: "bg-yellow-400/15 text-yellow-400 border-yellow-400/20",
    low: "bg-muted text-muted-foreground border-border",
  };
  const p = priority ?? "medium";
  return <Badge className={`${map[p] ?? map.medium} text-xs capitalize`}>{p} priority</Badge>;
}

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-green-400/15 text-green-400 border-green-400/20 text-xs">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-400/15 text-red-400 border-red-400/20 text-xs">Rejected</Badge>;
  return <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/20 text-xs">Pending</Badge>;
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
      { projectId, recId, data: { status } },
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
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">UX Recommendations</h1>
            <p className="text-muted-foreground text-sm mt-1">Evidence-linked strategic recommendations. Approve your priorities.</p>
          </div>
          {recs && (
            <div className="flex gap-2 text-sm">
              <span className="text-green-400 font-medium">{recs.filter(r => r.approvalStatus === "approved").length} approved</span>
              <span className="text-muted-foreground">/ {recs.length}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
        ) : !recs || recs.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the UX Strategy agent to generate evidence-linked recommendations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{category}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {recs.filter(r => (r.category ?? "General") === category).map((rec, i) => (
                    <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card className={`border h-full transition-colors ${
                        rec.approvalStatus === "approved" ? "border-green-400/20 bg-green-400/3" :
                        rec.approvalStatus === "rejected" ? "border-red-400/15 opacity-60 bg-card" :
                        "border-border bg-card"
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-semibold text-foreground text-sm leading-snug flex-1">{rec.title}</h3>
                            {rec.approvalStatus === "pending" && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:bg-green-400/10"
                                  onClick={() => handleApprove(rec.id, "approved")} disabled={approve.isPending} title="Approve">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-400/10"
                                  onClick={() => handleApprove(rec.id, "rejected")} disabled={approve.isPending} title="Reject">
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <ApprovalBadge status={rec.approvalStatus} />
                            <PriorityBadge priority={rec.priority} />
                            <EffortBadge effort={rec.effort} />
                          </div>

                          <p className="text-muted-foreground text-xs leading-relaxed mb-3">{rec.description}</p>

                          {rec.evidence && (
                            <div className="text-xs text-muted-foreground border-l-2 border-teal-400/30 pl-2 mb-2 italic">
                              {rec.evidence}
                            </div>
                          )}

                          {rec.expectedImpact && (
                            <div className="flex items-center gap-1.5 text-xs text-green-400">
                              <TrendingUp className="w-3 h-3" />
                              <span>{rec.expectedImpact}</span>
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
