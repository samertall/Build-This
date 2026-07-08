import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Target, HelpCircle, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListProblems, useApproveProblem, getListProblemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-mono shadow-none">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs font-mono shadow-none">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-mono shadow-none">Pending</Badge>;
}

export default function ProjectProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: problems, isLoading } = useListProblems(projectId);
  const approve = useApproveProblem();

  const handleApprove = (problemId: number, status: "approved" | "rejected") => {
    approve.mutate(
      { id: projectId, problemId, data: { status } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListProblemsQueryKey(projectId) });
          toast({ title: status === "approved" ? "Problem approved" : "Problem rejected" });
        },
      }
    );
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Problem Statements</h1>
            <p className="text-muted-foreground text-sm mt-1">Framed problems with How Might We questions. Approve the ones that resonate.</p>
          </div>
          {problems && (
            <div className="flex gap-2 text-sm font-mono">
              <span className="text-emerald-600 font-medium">{problems.filter(p => p.approvalStatus === "approved").length} approved</span>
              <span className="text-muted-foreground">/ {problems.length} total</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : !problems || problems.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No problem statements yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Problem Framing agent to convert research insights into structured problem statements.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {problems.map((problem, i) => (
              <motion.div key={problem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className={`border transition-all duration-200 shadow-sm hover:shadow-md ${
                  problem.approvalStatus === "approved" ? "border-emerald-500/20 bg-emerald-500/5" :
                  problem.approvalStatus === "rejected" ? "border-destructive/15 opacity-70 bg-destructive/5" :
                  "border-border bg-card hover:border-primary/30"
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <ApprovalBadge status={problem.approvalStatus} />
                          {problem.userSegment && (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground font-mono shadow-none">
                              <Users className="w-3 h-3 mr-1 inline" />{problem.userSegment}
                            </Badge>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                            <Target className="w-3 h-3 text-primary" />Problem Statement
                          </div>
                          <p className="text-foreground text-base font-medium leading-relaxed">{problem.statement}</p>
                        </div>

                        {problem.howMightWe && (
                          <div className="mb-4 pl-3 border-l-2 border-primary/30 py-1">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                              <HelpCircle className="w-3 h-3" />How Might We
                            </div>
                            <p className="text-muted-foreground text-sm italic">{problem.howMightWe}</p>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4 mt-5">
                          {problem.rootCause && (
                            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 font-mono">Root Cause</div>
                              <p className="text-foreground text-sm leading-relaxed">{problem.rootCause}</p>
                            </div>
                          )}
                          {problem.businessImpact && (
                            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1 font-mono">
                                <TrendingDown className="w-3 h-3 text-destructive" />Business Impact
                              </div>
                              <p className="text-foreground text-sm leading-relaxed">{problem.businessImpact}</p>
                            </div>
                          )}
                        </div>

                        {problem.successMetric && (
                          <div className="mt-5 text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border inline-flex items-center gap-2">
                            <span className="font-bold text-foreground text-[10px] uppercase tracking-widest font-mono">Success metric</span>
                            <span className="text-foreground font-medium">{problem.successMetric}</span>
                          </div>
                        )}
                      </div>

                      {problem.approvalStatus === "pending" && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="icon" variant="ghost"
                            className="h-10 w-10 text-emerald-600 hover:bg-emerald-500/10 rounded-full"
                            onClick={() => handleApprove(problem.id, "approved")}
                            disabled={approve.isPending}
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => handleApprove(problem.id, "rejected")}
                            disabled={approve.isPending}
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
