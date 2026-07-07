import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Brain, CheckCircle, ListChecks, Presentation, Clock, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useGetDashboardSummary, useListProjects } from "@workspace/api-client-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06 } }),
};

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") return <Badge className="bg-green-400/15 text-green-400 border-green-400/20 text-xs">Complete</Badge>;
  if (status === "running") return <Badge className="bg-purple-400/15 text-purple-400 border-purple-400/20 text-xs">Running</Badge>;
  if (status === "error") return <Badge className="bg-red-400/15 text-red-400 border-red-400/20 text-xs">Error</Badge>;
  return <Badge className="bg-yellow-400/15 text-yellow-400 border-yellow-400/20 text-xs">Pending</Badge>;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const statCards = [
    { label: "Total Projects", value: summary?.totalProjects ?? 0, icon: FolderOpen, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { label: "Research Insights", value: summary?.totalInsights ?? 0, icon: Brain, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Pending Approvals", value: summary?.pendingApprovals ?? 0, icon: CheckCircle, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Total Tasks", value: summary?.totalTasks ?? 0, icon: ListChecks, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Presentations", value: summary?.totalPresentations ?? 0, icon: Presentation, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Time Saved (hrs)", value: summary?.estimatedTimeSavedHours?.toFixed(1) ?? "0", icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Overview of your UX projects and AI activity</p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
              <Plus className="w-4 h-4 mr-2" />New Project
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial="hidden" animate="visible" custom={i + 1} variants={fadeUp}>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  {summaryLoading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{card.value}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Projects */}
        <motion.div initial="hidden" animate="visible" custom={8} variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Projects</h2>
          </div>

          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card className="border-dashed border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs">Create your first project and let 12 AI agents transform your UX inputs into structured product outputs.</p>
                <Link href="/projects/new">
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                    <Plus className="w-4 h-4 mr-2" />Create First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <motion.div key={project.id} initial="hidden" animate="visible" custom={i} variants={fadeUp}>
                  <Card
                    className="border-border bg-card hover:border-cyan-400/30 transition-colors cursor-pointer group"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-foreground group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {project.name}
                        </CardTitle>
                        <StatusBadge status={project.analysisStatus ?? "pending"} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {project.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {project.industry && <Badge variant="outline" className="text-xs border-border">{project.industry}</Badge>}
                        {project.productType && <Badge variant="outline" className="text-xs border-border">{project.productType}</Badge>}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* New project card */}
              <motion.div initial="hidden" animate="visible" custom={projects.length} variants={fadeUp}>
                <Link href="/projects/new">
                  <Card className="border-dashed border-border bg-card/30 hover:border-cyan-400/30 hover:bg-card/60 transition-colors cursor-pointer group h-full">
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[160px] text-center py-8">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-3 group-hover:bg-cyan-400/20 transition-colors">
                        <Plus className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">New Project</div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
