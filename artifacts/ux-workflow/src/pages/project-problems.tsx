import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Target, HelpCircle, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageHeader, EmptyState, listContainer, listItem } from "@/components/page-header";
import { useListProblems, useApproveProblem, getListProblemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function ApprovalBadge({ status }: { status?: string | null }) {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold">Rejected</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-mono shadow-none uppercase tracking-widest font-bold animate-border-flow">Review</Badge>;
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

  const approvedCount = problems?.filter(p => p.approvalStatus === "approved").length ?? 0;

  const CountPill = () => problems ? (
    <div className="flex items-center gap-2 bg-card border border-border/60 px-4 py-2 rounded-xl shadow-sm glass-card">
      <span className="text-emerald-600 font-black font-mono text-base">{approvedCount}</span>
      <span className="text-muted-foreground/40 font-mono">/</span>
      <span className="text-muted-foreground font-black font-mono text-base">{problems.length}</span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono ml-1">approved</span>
    </div>
  ) : null;

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full">
        <PageHeader
          icon={Target}
          iconColor="text-rose-500"
          iconBg="bg-rose-500/10 border-rose-500/20"
          accentColor="bg-rose-500"
          label="Problem Framing"
          title="Problems"
          description="Clear, actionable problem statements derived from insights."
          count={problems?.length}
          right={<CountPill />}
        />

        {isLoading ? (
          <div className="space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-card border border-border overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-slide" />
              </div>
            ))}
          </div>
        ) : !problems || problems.length === 0 ? (
          <EmptyState icon={Target} title="No problems framed" description="Run the Problem Framing agent to construct clear problem statements with How Might We questions." />
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {problems.map((problem) => (
              <motion.div key={problem.id} variants={listItem}>
                <motion.div
                  whileHover={{ y: -3, boxShadow: problem.approvalStatus === "approved" ? "0 16px 48px rgba(16,185,129,0.1)" : "0 16px 48px rgba(244,63,94,0.08)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <Card className={`border-2 transition-colors duration-300 relative overflow-hidden group ${
                    problem.approvalStatus === "approved" ? "border-emerald-500/30 bg-emerald-500/5" :
                    problem.approvalStatus === "rejected" ? "border-destructive/20 bg-destructive/5 opacity-60" :
                    "border-border/60 bg-card hover:border-rose-500/30 glass-card"
                  }`}>
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                      problem.approvalStatus === "approved" ? "bg-emerald-500" :
                      problem.approvalStatus === "rejected" ? "bg-destructive" :
                      "bg-gradient-to-r from-rose-500/60 to-transparent"
                    }`} />
                    <div className="absolute top-0 right-0 w-56 h-56 bg-rose-500/5 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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

                          {/* Core problem statement */}
                          <div className="mb-7 relative pl-2">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 to-transparent rounded-full" />
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2.5 font-mono flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5" /> Core Problem
                            </div>
                            <p className="text-foreground text-xl font-bold tracking-tight leading-snug">{problem.statement}</p>
                          </div>

                          {problem.howMightWe && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                              className="mb-7 bg-gradient-to-r from-primary/8 to-transparent p-5 rounded-2xl border-l-[3px] border-primary"
                            >
                              <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5" /> How Might We
                              </div>
                              <p className="text-foreground text-base font-medium italic leading-relaxed">{problem.howMightWe}</p>
                            </motion.div>
                          )}

                          <div className="grid sm:grid-cols-2 gap-4">
                            {problem.rootCause && (
                              <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 group-hover:border-border transition-colors">
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 font-mono">Root Cause</div>
                                <p className="text-muted-foreground font-medium text-sm leading-relaxed">{problem.rootCause}</p>
                              </div>
                            )}
                            {problem.businessImpact && (
                              <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/10 group-hover:border-rose-500/20 transition-colors">
                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
                                  <TrendingDown className="w-3 h-3" /> Business Impact
                                </div>
                                <p className="text-rose-800 dark:text-rose-300 font-medium text-sm leading-relaxed">{problem.businessImpact}</p>
                              </div>
                            )}
                          </div>

                          {problem.successMetric && (
                            <div className="mt-5 inline-flex items-center gap-3 text-sm bg-background border border-border/70 rounded-xl px-4 py-2.5 shadow-sm">
                              <span className="font-black text-muted-foreground text-[10px] uppercase tracking-widest font-mono">Success Metric</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-foreground font-bold text-sm">{problem.successMetric}</span>
                            </div>
                          )}
                        </div>

                        {problem.approvalStatus === "pending" && (
                          <div className="flex md:flex-col gap-3 flex-shrink-0 self-start opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button size="icon" variant="outline" className="h-12 w-12 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/50 hover:bg-emerald-100 rounded-full shadow-sm" onClick={() => handleApprove(problem.id, "approved")} disabled={approve.isPending} title="Approve">
                                <CheckCircle className="w-6 h-6" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button size="icon" variant="outline" className="h-12 w-12 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 rounded-full shadow-sm" onClick={() => handleApprove(problem.id, "rejected")} disabled={approve.isPending} title="Reject">
                                <XCircle className="w-6 h-6" />
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
