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
    low: "bg-secondary text-secondary-foreground border-border",
    medium: "bg-secondary text-secondary-foreground border-border",
    high: "bg-secondary text-secondary-foreground border-border",
  };
  const e = effort ?? "medium";
  return <Badge className={`${map[e] ?? map.medium} text-[10px] uppercase tracking-widest font-mono shadow-none`}>{e} effort</Badge>;
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const map: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/30",
    high: "bg-primary/10 text-primary border-primary/20",
    medium: "bg-secondary text-secondary-foreground border-border",
    low: "bg-muted text-muted-foreground border-border",
  };
  const p = priority ?? "medium";
  return <Badge className={`${map[p] ?? map.medium} text-[10px] uppercase tracking-widest font-mono shadow-none`}>{p} priority</Badge>;
}

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase tracking-widest font-mono shadow-none">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase tracking-widest font-mono shadow-none">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase tracking-widest font-mono shadow-none">Pending</Badge>;
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
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">UX Recommendations</h1>
            <p className="text-muted-foreground text-sm mt-1">Evidence-linked strategic recommendations. Approve your priorities.</p>
          </div>
          {recs && (
            <div className="flex gap-2 text-sm font-mono">
              <span className="text-emerald-600 font-medium">{recs.filter(r => r.approvalStatus === "approved").length} approved</span>
              <span className="text-muted-foreground">/ {recs.length} total</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
        ) : !recs || recs.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the UX Strategy agent to generate evidence-linked recommendations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {categories.map(category => (
              <div key={category}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 font-mono">{category}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {recs.filter(r => (r.category ?? "General") === category).map((rec, i) => (
                    <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card className={`border h-full transition-all duration-200 shadow-sm hover:shadow-md ${
                        rec.approvalStatus === "approved" ? "border-emerald-500/20 bg-emerald-500/5" :
                        rec.approvalStatus === "rejected" ? "border-destructive/15 opacity-70 bg-destructive/5" :
                        "border-border bg-card hover:border-primary/30"
                      }`}>
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <h3 className="font-bold text-foreground text-base leading-snug flex-1">{rec.title}</h3>
                            {rec.approvalStatus === "pending" && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 rounded-full"
                                  onClick={() => handleApprove(rec.id, "approved")} disabled={approve.isPending} title="Approve">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                                  onClick={() => handleApprove(rec.id, "rejected")} disabled={approve.isPending} title="Reject">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <ApprovalBadge status={rec.approvalStatus} />
                            <PriorityBadge priority={rec.priority} />
                            <EffortBadge effort={rec.effort} />
                          </div>

                          <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">{rec.description}</p>

                          <div className="mt-auto space-y-3 pt-3 border-t border-border/50">
                            {rec.evidence && (
                              <div className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-3 italic">
                                {rec.evidence}
                              </div>
                            )}

                            {rec.expectedImpact && (
                              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-500/5 px-3 py-2 rounded-md border border-emerald-500/10">
                                <TrendingUp className="w-4 h-4 shrink-0" />
                                <span className="line-clamp-1">{rec.expectedImpact}</span>
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
