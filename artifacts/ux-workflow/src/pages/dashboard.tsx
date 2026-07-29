import { Link, useLocation } from "wouter";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Plus, FolderOpen, Brain, CheckCircle, ListChecks, Presentation, Clock, ArrowRight, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useGetDashboardSummary, useListProjects } from "@workspace/api-client-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: (i = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30, delay: i * 0.06 } }),
};

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-mono font-medium shadow-none">Complete</Badge>;
  if (status === "running") return <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-mono font-medium shadow-none animate-pulse">Running</Badge>;
  if (status === "error") return <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs font-mono font-medium shadow-none">Error</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-mono font-medium shadow-none">Pending</Badge>;
}

function Counter({ value }: { value: number | string }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  useEffect(() => {
    const animation = animate(count, numericValue, { duration: 1.5, ease: "easeOut" });
    return animation.stop;
  }, [numericValue]);

  return <motion.div ref={nodeRef}>{rounded}</motion.div>;
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
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60 pb-1 tracking-tight">Welcome to Mission Control</h1>
            <p className="text-muted-foreground text-sm mt-1">Overview of your UX projects and AI agent activity</p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-2" />New Project
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-12">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial="hidden" animate="visible" custom={i + 1} variants={fadeUp}>
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-[0_8px_30px_rgba(24,147,247,0.12)] hover:border-primary/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-5 relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  {summaryLoading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <div className="text-3xl font-bold text-foreground font-mono tracking-tight flex items-baseline gap-1">
                      <Counter value={card.value} />
                      {card.label.includes("hrs") && <span className="text-sm text-muted-foreground font-sans font-medium">h</span>}
                    </div>
                  )}
                  <div className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">{card.label.replace(" (hrs)", "")}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Projects */}
        <motion.div initial="hidden" animate="visible" custom={8} variants={fadeUp}>
          <div className="flex items-center gap-2 mb-6">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">Active Pipelines</h2>
          </div>

          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-shimmer bg-card rounded-2xl h-56 border border-border/50" />
              ))}
            </div>
          ) : !projects || projects.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-glow" />
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10 shadow-lg backdrop-blur-sm animate-float">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">No projects in orbit</h3>
                  <p className="text-muted-foreground text-base mb-8 max-w-md">Initialize your first UX pipeline and let the agent swarm transform your inputs into structured outputs.</p>
                  <Link href="/projects/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 shadow-lg shadow-primary/30 transition-all hover:scale-105">
                      <Plus className="w-5 h-5 mr-2" />Initialize Pipeline
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project, i) => (
                <motion.div key={project.id} initial="hidden" animate="visible" custom={i} variants={fadeUp} className="h-full">
                  <Card
                    className="glass-card cursor-pointer group h-full flex flex-col relative overflow-hidden"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    {project.analysisStatus === "running" && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-[shimmer_2s_infinite]" />
                    )}
                    <CardHeader className="pb-4 pt-6 px-6">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {project.name}
                        </CardTitle>
                        <StatusBadge status={project.analysisStatus ?? "pending"} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 px-6 pb-6">
                      {project.description && (
                        <p className="text-muted-foreground text-sm mb-5 line-clamp-2 flex-1 leading-relaxed group-hover:text-muted-foreground/80 transition-colors">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-auto mb-5">
                        {project.industry && <Badge variant="secondary" className="text-[10px] font-mono font-medium uppercase tracking-wider bg-secondary/50">{project.industry}</Badge>}
                        {project.productType && <Badge variant="secondary" className="text-[10px] font-mono font-medium uppercase tracking-wider bg-secondary/50">{project.productType}</Badge>}
                      </div>
                      <div className="flex items-center justify-between pt-5 border-t border-border/60">
                        <span className="text-[11px] font-mono font-medium text-muted-foreground/70 uppercase tracking-widest">
                          {new Date(project.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <div className="flex items-center text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          Enter <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* New project card */}
              <motion.div initial="hidden" animate="visible" custom={projects.length} variants={fadeUp}>
                <Link href="/projects/new" className="block h-full">
                  <Card className="border-dashed border-2 border-border/60 bg-transparent hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group h-full min-h-[240px]">
                    <CardContent className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground transition-all duration-300 shadow-sm group-hover:shadow-[0_0_20px_rgba(24,147,247,0.4)] group-hover:scale-110">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Initialize Pipeline</div>
                      <p className="text-sm text-muted-foreground mt-2 font-medium">Add a new project</p>
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
