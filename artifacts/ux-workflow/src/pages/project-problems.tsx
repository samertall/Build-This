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
  if (status === "approved") return <Badge className="bg-green-400/15 text-green-400 border-green-400/20 text-xs">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-400/15 text-red-400 border-red-400/20 text-xs">Rejected</Badge>;
  return <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/20 text-xs">Pending</Badge>;
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
      { projectId, problemId, data: { status } },
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
            <div className="flex gap-2 text-sm">
              <span className="text-green-400 font-medium">{problems.filter(p => p.approvalStatus === "approved").length} approved</span>
              <span className="text-muted-foreground">/ {problems.length}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : !problems || problems.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-400/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No problem statements yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Problem Framing agent to convert research insights into structured problem statements.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {problems.map((problem, i) => (
              <motion.div key={problem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className={`border transition-colors ${
                  problem.approvalStatus === "approved" ? "border-green-400/20 bg-green-400/3" :
                  problem.approvalStatus === "rejected" ? "border-red-400/15 opacity-60 bg-card" :
                  "border-border bg-card"
                }`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <ApprovalBadge status={problem.approvalStatus} />
                          {problem.userSegment && (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              <Users className="w-3 h-3 mr-1 inline" />{problem.userSegment}
                            </Badge>
                          )}
                        </div>

                        <div className="mb-3">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Target className="w-3 h-3" />Problem Statement
                          </div>
                          <p className="text-foreground text-sm font-medium leading-relaxed">{problem.statement}</p>
                        </div>

                        {problem.howMightWe && (
                          <div className="mb-3 pl-3 border-l-2 border-purple-400/30">
                            <div className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />How Might We
                            </div>
                            <p className="text-muted-foreground text-sm italic">{problem.howMightWe}</p>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-3 mt-3">
                          {problem.rootCause && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Root Cause</div>
                              <p className="text-foreground text-xs">{problem.rootCause}</p>
                            </div>
                          )}
                          {problem.businessImpact && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />Business Impact
                              </div>
                              <p className="text-foreground text-xs">{problem.businessImpact}</p>
                            </div>
                          )}
                        </div>

                        {problem.successMetric && (
                          <div className="mt-3 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Success metric:</span> {problem.successMetric}
                          </div>
                        )}
                      </div>

                      {problem.approvalStatus === "pending" && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="icon" variant="ghost"
                            className="h-8 w-8 text-green-400 hover:bg-green-400/10"
                            onClick={() => handleApprove(problem.id, "approved")}
                            disabled={approve.isPending}
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-8 w-8 text-red-400 hover:bg-red-400/10"
                            onClick={() => handleApprove(problem.id, "rejected")}
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
        )}
      </div>
    </DashboardLayout>
  );
}
