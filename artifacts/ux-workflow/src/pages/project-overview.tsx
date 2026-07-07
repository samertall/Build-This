import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, Presentation, Database, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
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
    complete: "bg-green-400/15 text-green-400 border-green-400/20",
    running: "bg-purple-400/15 text-purple-400 border-purple-400/20",
    error: "bg-red-400/15 text-red-400 border-red-400/20",
    pending: "bg-yellow-400/15 text-yellow-400 border-yellow-400/20",
  };
  const s = status ?? "pending";
  return <Badge className={`${map[s] ?? map.pending} capitalize`}>{s}</Badge>;
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");

  const { data: project, isLoading: pLoading } = useGetProject(projectId);
  const { data: stats, isLoading: sLoading } = useGetProjectStats(projectId);

  const sections = [
    { label: "Sources", href: `/projects/${projectId}/sources`, icon: Database, count: stats?.sourceCount ?? 0, desc: "Research materials, URLs, and notes", color: "text-sky-400 bg-sky-400/10" },
    { label: "Insights", href: `/projects/${projectId}/insights`, icon: FlaskConical, count: stats?.insightCount ?? 0, approved: stats?.approvedInsights, desc: "AI-synthesized research insights", color: "text-blue-400 bg-blue-400/10" },
    { label: "Problems", href: `/projects/${projectId}/problems`, icon: Target, count: stats?.problemCount ?? 0, approved: stats?.approvedProblems, desc: "Framed problem statements with HMWs", color: "text-purple-400 bg-purple-400/10" },
    { label: "Recommendations", href: `/projects/${projectId}/recommendations`, icon: Lightbulb, count: stats?.recommendationCount ?? 0, approved: stats?.approvedRecommendations, desc: "Evidence-linked UX recommendations", color: "text-teal-400 bg-teal-400/10" },
    { label: "Journeys", href: `/projects/${projectId}/journeys`, icon: Route, count: 0, desc: "Current and future state user journeys", color: "text-indigo-400 bg-indigo-400/10" },
    { label: "Features", href: `/projects/${projectId}/features`, icon: Star, count: stats?.featureCount ?? 0, desc: "RICE-scored feature prioritization", color: "text-orange-400 bg-orange-400/10" },
    { label: "Tasks", href: `/projects/${projectId}/tasks`, icon: ListChecks, count: stats?.taskCount ?? 0, desc: "Team-ready tasks with user stories", color: "text-green-400 bg-green-400/10" },
    { label: "Presentations", href: `/projects/${projectId}/presentations`, icon: Presentation, count: stats?.presentationCount ?? 0, desc: "AI-generated stakeholder slide decks", color: "text-pink-400 bg-pink-400/10" },
  ];

  if (pLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-8 flex items-center gap-3 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <span>Project not found.</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-2 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && <p className="text-muted-foreground text-sm mt-1">{project.description}</p>}
          </div>
          <StatusBadge status={project.analysisStatus} />
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="flex flex-wrap gap-2 mb-8 mt-3">
          {project.industry && <Badge variant="outline" className="border-border text-muted-foreground">{project.industry}</Badge>}
          {project.productType && <Badge variant="outline" className="border-border text-muted-foreground">{project.productType}</Badge>}
          {project.stage && <Badge variant="outline" className="border-border text-muted-foreground">{project.stage}</Badge>}
        </motion.div>

        {/* Quick stats */}
        {!sLoading && stats && (
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {[
              { label: "Insights", v: stats.insightCount },
              { label: "Problems", v: stats.problemCount },
              { label: "Recs", v: stats.recommendationCount },
              { label: "Features", v: stats.featureCount },
              { label: "Tasks", v: stats.taskCount },
              { label: "Sources", v: stats.sourceCount },
            ].map(item => (
              <div key={item.label} className="bg-muted/30 rounded-xl p-3 text-center border border-border">
                <div className="text-xl font-bold text-foreground">{item.v}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Section grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((sec, i) => (
            <motion.div key={sec.label} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp}>
              <Link href={sec.href}>
                <Card className="border-border bg-card hover:border-cyan-400/30 transition-colors cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className={`w-9 h-9 rounded-lg ${sec.color} flex items-center justify-center mb-4`}>
                      <sec.icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-foreground text-sm group-hover:text-cyan-400 transition-colors">{sec.label}</div>
                      <div className="text-xl font-bold text-foreground">{sLoading ? "—" : sec.count}</div>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-3">{sec.desc}</p>
                    {sec.approved !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        <span className="text-green-400 font-medium">{sec.approved}</span> approved
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-cyan-400 transition-colors">
                      View <ArrowRight className="w-3 h-3 ml-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Project details */}
        {(project.businessGoals || project.targetUsers) && (
          <motion.div initial="hidden" animate="visible" custom={12} variants={fadeUp} className="mt-8 grid md:grid-cols-2 gap-4">
            {project.businessGoals && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Business Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm leading-relaxed">{project.businessGoals}</p>
                </CardContent>
              </Card>
            )}
            {project.targetUsers && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Target Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm leading-relaxed">{project.targetUsers}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Analyze CTA */}
        {(stats?.sourceCount ?? 0) > 0 && project.analysisStatus === "pending" && (
          <motion.div initial="hidden" animate="visible" custom={14} variants={fadeUp} className="mt-6 p-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-foreground">Ready to analyze</div>
              <div className="text-sm text-muted-foreground">You have {stats?.sourceCount} source{stats?.sourceCount !== 1 ? "s" : ""} ready. Run the AI agents to generate insights.</div>
            </div>
            <Link href={`/projects/${projectId}/analyze`}>
              <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                <Brain className="w-4 h-4" /> Run Analysis
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
