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
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Review</Badge>;
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
      <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-border/50 pb-6">
          <div className="relative">
            <div className="absolute -left-4 top-2 w-1 h-12 bg-rose-500 rounded-r-full" />
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Problem Framing</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-medium">Clear, actionable problem statements derived from insights.</p>
          </div>
          {problems && (
            <div className="flex gap-2 text-sm bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
              <span className="text-emerald-600 font-bold font-mono text-base">{problems.filter(p => p.approvalStatus === "approved").length} <span className="text-xs uppercase tracking-widest text-emerald-600/70">app</span></span>
              <span className="text-muted-foreground/30 font-mono text-lg">/</span>
              <span className="text-muted-foreground font-bold font-mono text-base">{problems.length} <span className="text-xs uppercase tracking-widest text-muted-foreground/50">tot</span></span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">{[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : !problems || problems.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-2 border-border bg-card/30 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 shadow-sm border border-rose-500/20">
                  <Target className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="font-black text-2xl text-foreground mb-3 tracking-tight">No problems framed</h3>
                <p className="text-muted-foreground text-base max-w-md font-medium">Run the Problem Framing agent to construct clear problem statements.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {problems.map((problem, i) => (
              <motion.div key={problem.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 30 }}>
                <Card className={`border-2 transition-all duration-300 shadow-sm relative overflow-hidden group ${
                  problem.approvalStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]" :
                  problem.approvalStatus === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60 grayscale-[0.5]" :
                  "border-border/60 bg-card hover:border-rose-500/30 hover:shadow-[0_8px_30px_rgba(244,63,94,0.1)] glass-card"
                }`}>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-[50px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6 flex-wrap">
                          <ApprovalBadge status={problem.approvalStatus} />
                          {problem.userSegment && (
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-mono shadow-none uppercase tracking-wider px-2 py-0.5">
                              <Users className="w-3 h-3 mr-1.5 inline" />{problem.userSegment}
                            </Badge>
                          )}
                        </div>

                        <div className="mb-8 relative">
                          <div className="absolute -left-6 top-0 text-6xl text-rose-500/10 font-serif leading-none font-black">"</div>
                          <div className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" /> Core Problem
                          </div>
                          <p className="text-foreground text-2xl font-bold tracking-tight leading-snug">{problem.statement}</p>
                        </div>

                        {problem.howMightWe && (
                          <div className="mb-8 bg-gradient-to-r from-primary/10 to-transparent p-5 rounded-2xl border-l-4 border-primary">
                            <div className="text-[11px] font-black text-primary uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5" /> How Might We
                            </div>
                            <p className="text-foreground text-lg font-medium italic">{problem.howMightWe}</p>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-5 mt-6">
                          {problem.rootCause && (
                            <div className="bg-secondary/40 rounded-xl p-5 border border-border/50 group-hover:border-border transition-colors">
                              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 font-mono">Root Cause</div>
                              <p className="text-muted-foreground font-medium text-sm leading-relaxed">{problem.rootCause}</p>
                            </div>
                          )}
                          {problem.businessImpact && (
                            <div className="bg-rose-500/5 rounded-xl p-5 border border-rose-500/10 group-hover:border-rose-500/20 transition-colors">
                              <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
                                <TrendingDown className="w-3 h-3" /> Business Impact
                              </div>
                              <p className="text-rose-900 dark:text-rose-200 font-medium text-sm leading-relaxed">{problem.businessImpact}</p>
                            </div>
                          )}
                        </div>

                        {problem.successMetric && (
                          <div className="mt-6 flex items-center gap-3 text-sm bg-background border border-border/80 rounded-xl px-4 py-3 shadow-sm inline-flex">
                            <span className="font-black text-foreground text-[10px] uppercase tracking-widest font-mono">Success Metric</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-foreground font-bold">{problem.successMetric}</span>
                          </div>
                        )}
                      </div>

                      {problem.approvalStatus === "pending" && (
                        <div className="flex md:flex-col gap-3 flex-shrink-0 bg-background/50 md:bg-transparent p-2 md:p-0 rounded-full md:rounded-none border md:border-0 border-border/50 shadow-sm md:shadow-none self-start opacity-0 group-hover:opacity-100 transition-all focus-within:opacity-100 md:-translate-x-2 group-hover:translate-x-0">
                          <Button
                            size="icon" variant="outline"
                            className="h-12 w-12 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 rounded-full transition-all shadow-sm"
                            onClick={() => handleApprove(problem.id, "approved")}
                            disabled={approve.isPending}
                            title="Approve"
                          >
                            <CheckCircle className="w-6 h-6" />
                          </Button>
                          <Button
                            size="icon" variant="outline"
                            className="h-12 w-12 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 rounded-full transition-all shadow-sm"
                            onClick={() => handleApprove(problem.id, "rejected")}
                            disabled={approve.isPending}
                            title="Reject"
                          >
                            <XCircle className="w-6 h-6" />
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
