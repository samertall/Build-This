import { useParams, Link } from "wouter";
import { motion, type Variants } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, Presentation, Database, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useGetProject, useGetProjectStats, useListInsights, useListProblems, useListRecommendations } from "@workspace/api-client-react";
import { ProjectMembersDialog } from "@/components/project-members-dialog";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 28, delay: i * 0.05 } }),
};

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    complete: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    running: "bg-primary/15 text-primary border-primary/20 animate-pulse",
    error: "bg-destructive/15 text-destructive border-destructive/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  const s = status ?? "pending";
  return <Badge className={`${map[s] ?? map.pending} capitalize font-mono font-black text-[10px] tracking-wider shadow-sm px-3 py-1`}>{s}</Badge>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden shadow-inner">
      <div className="h-full bg-primary transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(24,147,247,0.5)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");

  const { data: project, isLoading: pLoading } = useGetProject(projectId);
  const { data: stats, isLoading: sLoading } = useGetProjectStats(projectId);
  const { data: insights } = useListInsights(projectId);
  const { data: problems } = useListProblems(projectId);
  const { data: recommendations } = useListRecommendations(projectId);

  const sections = [
    { label: "Sources", href: `/projects/${projectId}/sources`, icon: Database, count: stats?.sourceCount ?? 0, desc: "Research materials, URLs, and notes", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { label: "Insights", href: `/projects/${projectId}/insights`, icon: FlaskConical, count: stats?.insightCount ?? 0, approved: stats?.approvedInsights, desc: "AI-synthesized research insights", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
    { label: "Problems", href: `/projects/${projectId}/problems`, icon: Target, count: stats?.problemCount ?? 0, approved: stats?.approvedProblems, desc: "Framed problem statements with HMWs", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    { label: "Recommendations", href: `/projects/${projectId}/recommendations`, icon: Lightbulb, count: stats?.recommendationCount ?? 0, approved: stats?.approvedRecommendations, desc: "Evidence-linked UX recommendations", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { label: "Journeys", href: `/projects/${projectId}/journeys`, icon: Route, count: 0, desc: "Current and future state user journeys", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
    { label: "Features", href: `/projects/${projectId}/features`, icon: Star, count: stats?.featureCount ?? 0, desc: "RICE-scored feature prioritization", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Tasks", href: `/projects/${projectId}/tasks`, icon: ListChecks, count: stats?.taskCount ?? 0, desc: "Team-ready tasks with user stories", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
    { label: "Presentations", href: `/projects/${projectId}/presentations`, icon: Presentation, count: stats?.presentationCount ?? 0, desc: "AI-generated stakeholder slide decks", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  ];

  if (pLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 w-full">
          <Skeleton className="h-14 w-96 rounded-2xl" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="animate-shimmer bg-card rounded-3xl h-56 border border-border/50" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-8 flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-4 text-destructive p-8 bg-destructive/5 rounded-3xl border-2 border-destructive/20 max-w-sm text-center shadow-lg">
            <AlertTriangle className="w-12 h-12" />
            <span className="text-xl font-bold">Project not found</span>
            <Link href="/dashboard" className="text-sm font-bold hover:underline text-destructive/80">Return to Dashboard</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const insightsApproved = stats?.approvedInsights ?? 0;
  const insightsTotal = stats?.insightCount ?? 0;
  const problemsApproved = stats?.approvedProblems ?? 0;
  const problemsTotal = stats?.problemCount ?? 0;
  const recsApproved = stats?.approvedRecommendations ?? 0;
  const recsTotal = stats?.recommendationCount ?? 0;

  const pendingInsights = (insights ?? []).filter(i => i.approvalStatus === "pending").slice(0, 2);
  const pendingProblems = (problems ?? []).filter(p => p.approvalStatus === "pending").slice(0, 2);
  const pendingRecs = (recommendations ?? []).filter(r => r.approvalStatus === "pending").slice(0, 2);

  let nextStep = {
    title: "Add Sources",
    desc: "Upload research materials, URLs, and notes to begin.",
    href: `/projects/${projectId}/sources`,
    icon: Database,
    color: "bg-blue-500 text-white",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]"
  };

  if ((stats?.sourceCount ?? 0) > 0) {
    if (project.analysisStatus === "pending") {
      nextStep = {
        title: "Initialize Agents",
        desc: `You have ${stats?.sourceCount} sources ready. Run the AI swarm.`,
        href: `/projects/${projectId}/analyze`,
        icon: Brain,
        color: "bg-primary text-primary-foreground",
        glow: "shadow-[0_0_30px_rgba(24,147,247,0.3)]"
      };
    } else if (insightsTotal > 0 && insightsApproved < insightsTotal) {
      nextStep = {
        title: "Review Insights",
        desc: `You have ${insightsTotal - insightsApproved} insights pending approval.`,
        href: `/projects/${projectId}/insights`,
        icon: FlaskConical,
        color: "bg-violet-500 text-white",
        glow: "shadow-[0_0_30px_rgba(139,92,246,0.3)]"
      };
    } else if (problemsTotal > 0 && problemsApproved < problemsTotal) {
      nextStep = {
        title: "Review Problems",
        desc: `You have ${problemsTotal - problemsApproved} problems pending approval.`,
        href: `/projects/${projectId}/problems`,
        icon: Target,
        color: "bg-rose-500 text-white",
        glow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]"
      };
    } else if (recsTotal > 0 && recsApproved < recsTotal) {
      nextStep = {
        title: "Review Recommendations",
        desc: `You have ${recsTotal - recsApproved} recommendations pending approval.`,
        href: `/projects/${projectId}/recommendations`,
        icon: Lightbulb,
        color: "bg-amber-500 text-white",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]"
      };
    } else if (recsTotal > 0 && recsApproved === recsTotal) {
      nextStep = {
        title: "Generate Presentation",
        desc: "All outputs approved. Generate your stakeholder deck.",
        href: `/projects/${projectId}/presentations`,
        icon: Presentation,
        color: "bg-sky-500 text-white",
        glow: "shadow-[0_0_30px_rgba(14,165,233,0.3)]"
      };
    }
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
        {/* Header Section */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-10 relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">{project.name}</h1>
              {project.description && <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed font-semibold">{project.description}</p>}
              
              <div className="flex flex-wrap gap-2 mt-6">
                {project.industry && <Badge variant="secondary" className="font-mono font-black uppercase tracking-widest text-[10px] px-3 py-1.5 shadow-sm">{project.industry}</Badge>}
                {project.productType && <Badge variant="secondary" className="font-mono font-black uppercase tracking-widest text-[10px] px-3 py-1.5 shadow-sm">{project.productType}</Badge>}
                {project.stage && <Badge variant="secondary" className="font-mono font-black uppercase tracking-widest text-[10px] px-3 py-1.5 shadow-sm">{project.stage}</Badge>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ProjectMembersDialog projectId={projectId} accessRole={project.accessRole} />
              <StatusBadge status={project.analysisStatus} />
            </div>
          </div>
        </motion.div>

        {/* Decision Readiness */}
        {((stats?.sourceCount ?? 0) > 0 || (stats?.insightCount ?? 0) > 0) && (
          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="mb-12">
            <div className="flex flex-col xl:flex-row gap-6">
              <Card className="flex-1 glass-card border-border/50 rounded-3xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-primary" /> Decision Readiness
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Insights Progress */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2 font-bold">
                          <span className="text-foreground">Insights</span>
                          <span className="text-muted-foreground">{insightsApproved} / {insightsTotal}</span>
                        </div>
                        <ProgressBar value={insightsTotal ? (insightsApproved / insightsTotal) * 100 : 0} />
                      </div>
                      {pendingInsights.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">Needs Review</p>
                          {pendingInsights.map(i => (
                            <div key={i.id} className="text-xs font-semibold text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/50 line-clamp-2 leading-snug">"{i.insight}"</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Problems Progress */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2 font-bold">
                          <span className="text-foreground">Problems</span>
                          <span className="text-muted-foreground">{problemsApproved} / {problemsTotal}</span>
                        </div>
                        <ProgressBar value={problemsTotal ? (problemsApproved / problemsTotal) * 100 : 0} />
                      </div>
                      {pendingProblems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">Needs Review</p>
                          {pendingProblems.map(p => (
                            <div key={p.id} className="text-xs font-semibold text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/50 line-clamp-2 leading-snug">"{p.statement}"</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recommendations Progress */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2 font-bold">
                          <span className="text-foreground">Recommendations</span>
                          <span className="text-muted-foreground">{recsApproved} / {recsTotal}</span>
                        </div>
                        <ProgressBar value={recsTotal ? (recsApproved / recsTotal) * 100 : 0} />
                      </div>
                      {pendingRecs.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">Needs Review</p>
                          {pendingRecs.map(r => (
                            <div key={r.id} className="text-xs font-semibold text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/50 line-clamp-2 leading-snug">"{r.title}"</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full xl:w-[380px] shrink-0 border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm flex flex-col group relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                <CardContent className="p-8 flex flex-col h-full items-start justify-center relative z-10">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Next Best Step
                  </p>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${nextStep.color} ${nextStep.glow} transform transition-transform group-hover:scale-105 group-hover:rotate-3`}>
                    <nextStep.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight mb-3">{nextStep.title}</h3>
                  <p className="text-sm font-semibold text-muted-foreground mb-8 leading-relaxed">{nextStep.desc}</p>
                  <Link href={nextStep.href} className="w-full mt-auto block">
                    <button className={`w-full h-12 rounded-xl font-black text-base transition-all hover:-translate-y-1 hover:shadow-lg ${nextStep.color} ${nextStep.glow}`}>
                      Continue <ChevronRight className="w-5 h-5 ml-1 inline-block" />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Section pipeline grid */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Route className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Project Pipeline</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((sec, i) => (
              <motion.div key={sec.label} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp} className="h-full">
                <Link href={sec.href}>
                  <Card className="glass-card border-border/50 cursor-pointer group h-full flex flex-col relative overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardContent className="p-6 flex flex-col flex-1 relative z-10">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-14 h-14 rounded-2xl border ${sec.color} flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                          <sec.icon className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-black text-foreground font-mono tracking-tighter">{sLoading ? "—" : sec.count}</div>
                      </div>
                      <div className="font-black text-foreground text-xl group-hover:text-primary transition-colors mb-2 tracking-tight">{sec.label}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 font-semibold">{sec.desc}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-5 border-t border-border/60">
                        {sec.approved !== undefined ? (
                          <div className="text-[11px] font-black text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg uppercase tracking-wider font-mono">
                            <span className="text-emerald-500">{sec.approved}</span> approved
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          Open <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Project Context */}
        {(project.businessGoals || project.targetUsers) && (
          <motion.div initial="hidden" animate="visible" custom={12} variants={fadeUp}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Strategic Context</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {project.businessGoals && (
                <Card className="glass-card h-full rounded-3xl">
                  <CardHeader className="pb-4 border-b border-border/50 px-8 pt-8">
                    <CardTitle className="text-xs font-black text-primary uppercase tracking-widest font-mono">Business Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap font-semibold">{project.businessGoals}</p>
                  </CardContent>
                </Card>
              )}
              {project.targetUsers && (
                <Card className="glass-card h-full rounded-3xl">
                  <CardHeader className="pb-4 border-b border-border/50 px-8 pt-8">
                    <CardTitle className="text-xs font-black text-primary uppercase tracking-widest font-mono">Target Users</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap font-semibold">{project.targetUsers}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
