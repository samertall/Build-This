import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, Presentation, Database, ArrowRight, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useGetProject, useGetProjectStats } from "@workspace/api-client-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06 } }),
};

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
    running: "bg-primary/15 text-primary border-primary/20",
    error: "bg-destructive/15 text-destructive border-destructive/20",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const s = status ?? "pending";
  return <Badge className={`${map[s] ?? map.pending} capitalize font-mono font-medium text-xs`}>{s}</Badge>;
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");

  const { data: project, isLoading: pLoading } = useGetProject(projectId);
  const { data: stats, isLoading: sLoading } = useGetProjectStats(projectId);

  const sections = [
    { label: "Sources", href: `/projects/${projectId}/sources`, icon: Database, count: stats?.sourceCount ?? 0, desc: "Research materials, URLs, and notes", color: "text-blue-600 bg-blue-100" },
    { label: "Insights", href: `/projects/${projectId}/insights`, icon: FlaskConical, count: stats?.insightCount ?? 0, approved: stats?.approvedInsights, desc: "AI-synthesized research insights", color: "text-violet-600 bg-violet-100" },
    { label: "Problems", href: `/projects/${projectId}/problems`, icon: Target, count: stats?.problemCount ?? 0, approved: stats?.approvedProblems, desc: "Framed problem statements with HMWs", color: "text-rose-600 bg-rose-100" },
    { label: "Recommendations", href: `/projects/${projectId}/recommendations`, icon: Lightbulb, count: stats?.recommendationCount ?? 0, approved: stats?.approvedRecommendations, desc: "Evidence-linked UX recommendations", color: "text-amber-600 bg-amber-100" },
    { label: "Journeys", href: `/projects/${projectId}/journeys`, icon: Route, count: 0, desc: "Current and future state user journeys", color: "text-indigo-600 bg-indigo-100" },
    { label: "Features", href: `/projects/${projectId}/features`, icon: Star, count: stats?.featureCount ?? 0, desc: "RICE-scored feature prioritization", color: "text-emerald-600 bg-emerald-100" },
    { label: "Tasks", href: `/projects/${projectId}/tasks`, icon: ListChecks, count: stats?.taskCount ?? 0, desc: "Team-ready tasks with user stories", color: "text-teal-600 bg-teal-100" },
    { label: "Presentations", href: `/projects/${projectId}/presentations`, icon: Presentation, count: stats?.presentationCount ?? 0, desc: "AI-generated stakeholder slide decks", color: "text-sky-600 bg-sky-100" },
  ];

  if (pLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 w-full">
          <Skeleton className="h-10 w-80 rounded-xl" />
          <Skeleton className="h-5 w-[500px] max-w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-8 flex items-center justify-center h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-destructive p-6 bg-destructive/5 rounded-xl border border-destructive/20">
            <AlertTriangle className="w-8 h-8" />
            <span className="font-semibold">Project not found</span>
            <Link href="/dashboard" className="text-sm underline mt-2">Return to Dashboard</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{project.name}</h1>
              {project.description && <p className="text-muted-foreground text-base mt-2 max-w-2xl leading-relaxed">{project.description}</p>}
            </div>
            <div className="flex shrink-0">
              <StatusBadge status={project.analysisStatus} />
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="flex flex-wrap gap-2 mb-10">
          {project.industry && <Badge variant="secondary" className="font-mono font-normal text-xs px-2.5 py-1">{project.industry}</Badge>}
          {project.productType && <Badge variant="secondary" className="font-mono font-normal text-xs px-2.5 py-1">{project.productType}</Badge>}
          {project.stage && <Badge variant="secondary" className="font-mono font-normal text-xs px-2.5 py-1">{project.stage}</Badge>}
        </motion.div>

        {/* Analyze CTA Banner */}
        {(stats?.sourceCount ?? 0) > 0 && project.analysisStatus === "pending" && (
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="mb-10">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 shadow-sm group">
              <div className="absolute top-0 right-0 p-12 -mt-8 -mr-8 opacity-10 pointer-events-none">
                <Brain className="w-48 h-48 text-primary transform -rotate-12 group-hover:scale-110 transition-transform duration-700 ease-out" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h3 className="text-lg font-bold text-foreground">Pipeline Ready for Analysis</h3>
                  </div>
                  <p className="text-muted-foreground text-base">You have {stats?.sourceCount} source{stats?.sourceCount !== 1 ? "s" : ""} ready. Run the AI agents to synthesize insights, frame problems, and generate recommendations.</p>
                </div>
                <Link href={`/projects/${projectId}/analyze`}>
                  <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-6 py-3 rounded-xl transition-all shadow-md hover-elevate whitespace-nowrap">
                    <Brain className="w-5 h-5" /> Initialize Agents
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section pipeline grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Project Pipeline
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sections.map((sec, i) => (
              <motion.div key={sec.label} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp} className="h-full">
                <Link href={sec.href}>
                  <Card className="border-border bg-card hover:border-primary/40 shadow-sm transition-all duration-200 cursor-pointer group h-full flex flex-col hover-elevate">
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${sec.color} flex items-center justify-center shadow-sm`}>
                          <sec.icon className="w-6 h-6" />
                        </div>
                        <div className="text-2xl font-bold text-foreground font-mono">{sLoading ? "—" : sec.count}</div>
                      </div>
                      <div className="font-bold text-foreground text-base group-hover:text-primary transition-colors mb-2">{sec.label}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">{sec.desc}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                        {sec.approved !== undefined ? (
                          <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            <span className="text-emerald-600 font-bold">{sec.approved}</span> approved
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-1 text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                          Open <ChevronRight className="w-4 h-4 ml-0.5 transform group-hover:translate-x-1 transition-transform" />
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
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Strategic Context
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {project.businessGoals && (
                <Card className="border-border bg-card shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Business Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">{project.businessGoals}</p>
                  </CardContent>
                </Card>
              )}
              {project.targetUsers && (
                <Card className="border-border bg-card shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Users</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">{project.targetUsers}</p>
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
