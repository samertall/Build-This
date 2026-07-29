import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, Presentation, Database, ArrowRight, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useGetProject, useGetProjectStats } from "@workspace/api-client-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30, delay: i * 0.06 } }),
};

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
    running: "bg-primary/15 text-primary border-primary/20 animate-pulse",
    error: "bg-destructive/15 text-destructive border-destructive/20",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const s = status ?? "pending";
  return <Badge className={`${map[s] ?? map.pending} capitalize font-mono font-bold text-xs shadow-none px-3 py-1`}>{s}</Badge>;
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");

  const { data: project, isLoading: pLoading } = useGetProject(projectId);
  const { data: stats, isLoading: sLoading } = useGetProjectStats(projectId);

  const sections = [
    { label: "Sources", href: `/projects/${projectId}/sources`, icon: Database, count: stats?.sourceCount ?? 0, desc: "Research materials, URLs, and notes", color: "text-blue-600 bg-blue-100 border-blue-200" },
    { label: "Insights", href: `/projects/${projectId}/insights`, icon: FlaskConical, count: stats?.insightCount ?? 0, approved: stats?.approvedInsights, desc: "AI-synthesized research insights", color: "text-violet-600 bg-violet-100 border-violet-200" },
    { label: "Problems", href: `/projects/${projectId}/problems`, icon: Target, count: stats?.problemCount ?? 0, approved: stats?.approvedProblems, desc: "Framed problem statements with HMWs", color: "text-rose-600 bg-rose-100 border-rose-200" },
    { label: "Recommendations", href: `/projects/${projectId}/recommendations`, icon: Lightbulb, count: stats?.recommendationCount ?? 0, approved: stats?.approvedRecommendations, desc: "Evidence-linked UX recommendations", color: "text-amber-600 bg-amber-100 border-amber-200" },
    { label: "Journeys", href: `/projects/${projectId}/journeys`, icon: Route, count: 0, desc: "Current and future state user journeys", color: "text-indigo-600 bg-indigo-100 border-indigo-200" },
    { label: "Features", href: `/projects/${projectId}/features`, icon: Star, count: stats?.featureCount ?? 0, desc: "RICE-scored feature prioritization", color: "text-emerald-600 bg-emerald-100 border-emerald-200" },
    { label: "Tasks", href: `/projects/${projectId}/tasks`, icon: ListChecks, count: stats?.taskCount ?? 0, desc: "Team-ready tasks with user stories", color: "text-teal-600 bg-teal-100 border-teal-200" },
    { label: "Presentations", href: `/projects/${projectId}/presentations`, icon: Presentation, count: stats?.presentationCount ?? 0, desc: "AI-generated stakeholder slide decks", color: "text-sky-600 bg-sky-100 border-sky-200" },
  ];

  if (pLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 w-full">
          <Skeleton className="h-12 w-96 rounded-xl" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="animate-shimmer bg-card rounded-2xl h-56 border border-border/50" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-8 flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-4 text-destructive p-8 bg-destructive/5 rounded-3xl border-2 border-destructive/20 max-w-sm text-center">
            <AlertTriangle className="w-12 h-12" />
            <span className="text-xl font-bold">Project not found</span>
            <Link href="/dashboard" className="text-sm font-medium hover:underline text-destructive/80">Return to Dashboard</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
        {/* Header Section */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-8 relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">{project.name}</h1>
              {project.description && <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed font-medium">{project.description}</p>}
              
              <div className="flex flex-wrap gap-2 mt-6">
                {project.industry && <Badge variant="secondary" className="font-mono font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 shadow-sm">{project.industry}</Badge>}
                {project.productType && <Badge variant="secondary" className="font-mono font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 shadow-sm">{project.productType}</Badge>}
                {project.stage && <Badge variant="secondary" className="font-mono font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 shadow-sm">{project.stage}</Badge>}
              </div>
            </div>
            <div className="flex shrink-0">
              <StatusBadge status={project.analysisStatus} />
            </div>
          </div>
        </motion.div>

        {/* Analyze CTA Banner */}
        {(stats?.sourceCount ?? 0) > 0 && project.analysisStatus === "pending" && (
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="mb-12">
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-primary/5 p-8 shadow-sm group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute top-0 right-0 p-12 -mt-8 -mr-8 opacity-[0.03] pointer-events-none transition-transform duration-1000 group-hover:scale-110 group-hover:-rotate-12">
                <Brain className="w-64 h-64 text-primary" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">Pipeline Ready for Analysis</h3>
                  </div>
                  <p className="text-muted-foreground text-base font-medium">You have {stats?.sourceCount} source{stats?.sourceCount !== 1 ? "s" : ""} ready. Run the AI agent swarm to synthesize insights, frame problems, and generate recommendations.</p>
                </div>
                <Link href={`/projects/${projectId}/analyze`} className="shrink-0">
                  <button className="flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(24,147,247,0.3)] hover:shadow-[0_0_50px_rgba(24,147,247,0.5)] hover:-translate-y-1 w-full md:w-auto">
                    <Brain className="w-6 h-6" /> Initialize Agents
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section pipeline grid */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Project Pipeline</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((sec, i) => (
              <motion.div key={sec.label} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp} className="h-full">
                <Link href={sec.href}>
                  <Card className="glass-card border-border/50 cursor-pointer group h-full flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-6 flex flex-col flex-1 relative z-10">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-14 h-14 rounded-2xl border ${sec.color} flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                          <sec.icon className="w-7 h-7" />
                        </div>
                        <div className="text-3xl font-black text-foreground font-mono tracking-tighter">{sLoading ? "—" : sec.count}</div>
                      </div>
                      <div className="font-bold text-foreground text-lg group-hover:text-primary transition-colors mb-2 tracking-tight">{sec.label}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 font-medium">{sec.desc}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-5 border-t border-border/60">
                        {sec.approved !== undefined ? (
                          <div className="text-[11px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                            <span className="text-emerald-600">{sec.approved}</span> approved
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Strategic Context</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {project.businessGoals && (
                <Card className="glass-card h-full">
                  <CardHeader className="pb-4 border-b border-border/50 px-6 pt-6">
                    <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest font-mono">Business Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap font-medium">{project.businessGoals}</p>
                  </CardContent>
                </Card>
              )}
              {project.targetUsers && (
                <Card className="glass-card h-full">
                  <CardHeader className="pb-4 border-b border-border/50 px-6 pt-6">
                    <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest font-mono">Target Users</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap font-medium">{project.targetUsers}</p>
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
