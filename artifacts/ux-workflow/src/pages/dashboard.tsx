import { Link, useLocation } from "wouter";
import { motion, useMotionValue, animate, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { Plus, FolderOpen, Brain, CheckCircle, ListChecks, Presentation, Clock, ArrowRight, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useGetDashboardSummary, useListProjects } from "@workspace/api-client-react";

const springIn = (i: number) => ({
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring" as const, stiffness: 280, damping: 26, delay: i * 0.05 },
});

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  useEffect(() => {
    const ctrl = animate(count, value, { duration: 1.6, ease: "easeOut" });
    return ctrl.stop;
  }, [value, count]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    complete: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    running: "bg-primary/15 text-primary border-primary/20 animate-pulse",
    error: "bg-destructive/15 text-destructive border-destructive/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  const s = status in map ? status : "pending";
  return <Badge className={`${map[s]} capitalize font-mono font-black tracking-wider text-[10px] shadow-sm px-2.5 py-0.5`}>{s}</Badge>;
}

export default function DashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || [p.name, p.description, p.industry, p.productType].some(v => v?.toLowerCase().includes(q));
      const s = p.analysisStatus || "pending";
      const matchesStatus = statusFilter === "all" || s === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const statCards = [
    { label: "Projects", value: summary?.totalProjects ?? 0, icon: FolderOpen, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", glow: "rgba(24,147,247,0.15)" },
    { label: "Insights", value: summary?.totalInsights ?? 0, icon: Brain, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "rgba(139,92,246,0.12)" },
    { label: "Approvals", value: summary?.pendingApprovals ?? 0, icon: CheckCircle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "rgba(245,158,11,0.12)" },
    { label: "Tasks", value: summary?.totalTasks ?? 0, icon: ListChecks, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "rgba(16,185,129,0.12)" },
    { label: "Decks", value: summary?.totalPresentations ?? 0, icon: Presentation, color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20", glow: "rgba(14,165,233,0.12)" },
    { label: "Hrs Saved", value: summary?.estimatedTimeSavedHours ?? 0, icon: Clock, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "rgba(244,63,94,0.12)" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">

        {/* Header */}
        <motion.div {...springIn(0)} className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">Dashboard</h1>
            <p className="text-muted-foreground text-base mt-1 font-semibold">Your AI-powered UX pipeline overview</p>
          </div>
          <Link href="/projects/new">
            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_4px_20px_rgba(24,147,247,0.3)] hover:shadow-[0_6px_28px_rgba(24,147,247,0.45)] transition-all rounded-full px-6 h-11">
                <Plus className="w-4 h-4 mr-2" />New Project
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {statCards.map((card, i) => (
            <motion.div key={card.label} {...springIn(i + 1)}>
              <motion.div
                whileHover={{ y: -5, boxShadow: `0 16px 40px ${card.glow}` }}
                className={`relative overflow-hidden rounded-2xl border ${card.border} bg-card p-5 cursor-default group transition-all duration-300`}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                <div className={`w-10 h-10 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-10 mb-1 rounded-lg" />
                ) : (
                  <div className={`text-3xl font-black font-mono tracking-tighter mb-1 ${card.color}`}>
                    <AnimatedCounter value={typeof card.value === 'number' ? Math.round(card.value) : 0} />
                  </div>
                )}
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{card.label}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Projects Section */}
        <motion.div {...springIn(8)}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-foreground tracking-tight">Project Repository</h2>
              <Badge variant="secondary" className="font-mono text-sm px-3 py-1 shadow-sm">{filteredProjects?.length ?? 0}</Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, industry..."
                  aria-label="Search projects"
                  className="pl-10 pr-10 h-12 w-full bg-card rounded-xl font-semibold border-border/60 focus:border-primary transition-colors"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear project search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 w-full sm:w-[160px] bg-card rounded-xl font-semibold border-border/60 focus:border-primary transition-colors">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  <SelectItem value="all" className="font-semibold">All Statuses</SelectItem>
                  <SelectItem value="pending" className="font-semibold">Pending</SelectItem>
                  <SelectItem value="running" className="font-semibold">Running</SelectItem>
                  <SelectItem value="complete" className="font-semibold">Complete</SelectItem>
                  <SelectItem value="error" className="font-semibold">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projectsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-56 rounded-3xl bg-card border border-border animate-pulse overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-slide" />
                </div>
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <Card className="border-dashed border-2 border-border/60 bg-card/40 hover:border-primary/30 transition-colors duration-300 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-breathe" />
                  </div>
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
                    transition={shouldReduceMotion ? undefined : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(24,147,247,0.15)]"
                  >
                    <Brain className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h3 className="text-foreground font-black text-2xl mb-2 tracking-tight">No projects yet</h3>
                  <p className="text-muted-foreground text-sm mb-8 max-w-sm font-semibold leading-relaxed">
                    Create your first project and let 12 AI agents transform your UX inputs into structured product outputs.
                  </p>
                  <Link href="/projects/new">
                    <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_4px_20px_rgba(24,147,247,0.3)] hover:shadow-[0_6px_28px_rgba(24,147,247,0.45)] h-12 px-8 rounded-full">
                        <Plus className="w-5 h-5 mr-2" />Create First Project
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : filteredProjects?.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-dashed border-2 border-border/60 bg-card/20 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-2">No matching projects</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm font-semibold">We couldn't find any projects matching your current search and filters.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className="rounded-xl h-11 font-bold">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, i) => (
                <motion.div key={project.id} {...springIn(i)} className="h-full">
                  <motion.div
                    whileHover={{ y: -6, boxShadow: "0 24px 50px rgba(24,147,247,0.12)" }}
                    className="cursor-pointer h-full"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    <Card className="border border-border/60 bg-card hover:border-primary/40 shadow-sm transition-all duration-300 h-full flex flex-col group relative overflow-hidden rounded-3xl">
                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                      {/* Top accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <CardContent className="p-6 flex flex-col flex-1 relative z-10">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <h3 className="font-black text-foreground text-lg leading-tight group-hover:text-primary transition-colors duration-200 tracking-tight line-clamp-2">
                            {project.name}
                          </h3>
                          <StatusBadge status={project.analysisStatus ?? "pending"} />
                        </div>

                        {project.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1 font-medium">{project.description}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap mt-5">
                          {project.industry && (
                            <Badge variant="secondary" className="text-[10px] font-black font-mono uppercase tracking-wider px-2.5 py-1">{project.industry}</Badge>
                          )}
                          {project.productType && (
                            <Badge variant="secondary" className="text-[10px] font-black font-mono uppercase tracking-wider px-2.5 py-1">{project.productType}</Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/50">
                          <span className="text-[11px] font-mono font-bold text-muted-foreground/70">
                            {new Date(project.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                            Open
                            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}

              {/* New project card */}
              <motion.div {...springIn(filteredProjects.length)}>
                <Link href="/projects/new">
                  <motion.div whileHover={{ y: -6 }} className="h-full min-h-[220px]">
                    <Card className="border-dashed border-2 border-border/60 bg-card/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer group h-full rounded-3xl">
                      <CardContent className="flex flex-col items-center justify-center h-full text-center py-8">
                        <motion.div
                          className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(24,147,247,0.3)] transition-all duration-300"
                          whileHover={{ rotate: 90 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Plus className="w-7 h-7" />
                        </motion.div>
                        <div className="text-base font-black text-foreground group-hover:text-primary transition-colors tracking-tight">New Project</div>
                        <p className="text-xs text-muted-foreground mt-1 font-semibold">Start a new pipeline</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
