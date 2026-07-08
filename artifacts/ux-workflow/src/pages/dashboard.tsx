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
  if (status === "complete") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-mono font-medium">Complete</Badge>;
  if (status === "running") return <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-mono font-medium">Running</Badge>;
  if (status === "error") return <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs font-mono font-medium">Error</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-mono font-medium">Pending</Badge>;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const statCards = [
    { label: "Total Projects", value: summary?.totalProjects ?? 0, icon: FolderOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Research Insights", value: summary?.totalInsights ?? 0, icon: Brain, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Pending Approvals", value: summary?.pendingApprovals ?? 0, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Total Tasks", value: summary?.totalTasks ?? 0, icon: ListChecks, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Presentations", value: summary?.totalPresentations ?? 0, icon: Presentation, color: "text-sky-600", bg: "bg-sky-100" },
    { label: "Time Saved (hrs)", value: summary?.estimatedTimeSavedHours?.toFixed(1) ?? "0", icon: Clock, color: "text-rose-600", bg: "bg-rose-100" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Overview of your UX projects and AI activity</p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover-elevate">
              <Plus className="w-4 h-4 mr-2" />New Project
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial="hidden" animate="visible" custom={i + 1} variants={fadeUp}>
              <Card className="border-border bg-card shadow-sm hover-elevate transition-all duration-200">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  {summaryLoading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground font-mono">{card.value}</div>
                  )}
                  <div className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{card.label}</div>
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
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card className="border-dashed border-2 border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">Create your first project and let 12 AI agents transform your UX inputs into structured product outputs.</p>
                <Link href="/projects/new">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    <Plus className="w-4 h-4 mr-2" />Create First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project, i) => (
                <motion.div key={project.id} initial="hidden" animate="visible" custom={i} variants={fadeUp} className="h-full">
                  <Card
                    className="border-border bg-card hover:border-primary/40 shadow-sm transition-all duration-200 cursor-pointer group h-full flex flex-col hover-elevate"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {project.name}
                        </CardTitle>
                        <StatusBadge status={project.analysisStatus ?? "pending"} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      {project.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-auto">
                        {project.industry && <Badge variant="secondary" className="text-xs font-mono font-normal">{project.industry}</Badge>}
                        {project.productType && <Badge variant="secondary" className="text-xs font-mono font-normal">{project.productType}</Badge>}
                      </div>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(project.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          View details <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* New project card */}
              <motion.div initial="hidden" animate="visible" custom={projects.length} variants={fadeUp}>
                <Link href="/projects/new">
                  <Card className="border-dashed border-2 border-border bg-transparent hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer group h-full min-h-[200px]">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground transition-colors shadow-sm">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">New Project</div>
                      <p className="text-xs text-muted-foreground mt-1">Start a new pipeline</p>
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
