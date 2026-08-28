import { useState } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, Filter, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageHeader, EmptyState } from "@/components/page-header";
import { useListTasks, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const columns = [
  { id: "todo",        label: "To Do",       accent: "bg-muted-foreground/30", dot: "bg-muted-foreground/50",  glow: "" },
  { id: "in-progress", label: "In Progress",  accent: "bg-primary",             dot: "bg-primary",              glow: "rgba(24,147,247,0.1)" },
  { id: "done",        label: "Done",         accent: "bg-emerald-500",          dot: "bg-emerald-500",          glow: "rgba(16,185,129,0.1)" },
];

const categoryColors: Record<string, string> = {
  design:      "bg-primary/10 text-primary border-primary/20",
  development: "bg-secondary text-secondary-foreground border-border/50",
  content:     "bg-violet-500/10 text-violet-600 border-violet-500/20",
  research:    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  qa:          "bg-teal-500/10 text-teal-600 border-teal-500/20",
  marketing:   "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const priorityColors: Record<string, string> = {
  critical: "text-destructive",
  high:     "text-amber-600",
  medium:   "text-primary",
  low:      "text-muted-foreground",
};

const effortLabels: Record<string, string> = { xs: "XS", s: "S", m: "M", l: "L", xl: "XL" };

export default function ProjectTasksPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();

  const { data: tasks, isLoading } = useListTasks(projectId);
  const updateTask = useUpdateTask();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredTasks = tasks?.filter(t => categoryFilter === "all" || t.category === categoryFilter) ?? [];
  const categories = tasks ? [...new Set(tasks.map(t => t.category ?? "design"))] : [];

  const moveTask = (taskId: number, newStatus: string) => {
    updateTask.mutate(
      { id: projectId, taskId, data: { status: newStatus } },
      { onSuccess: () => void qc.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) }) }
    );
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full h-[calc(100dvh-4rem)] flex flex-col relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[700px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

        <PageHeader
          icon={ListChecks}
          iconColor="text-teal-500"
          iconBg="bg-teal-500/10 border-teal-500/20"
          accentColor="bg-teal-500"
          label="Task Orchestration"
          title="Tasks"
          description="Team-ready tasks with user stories and acceptance criteria."
          count={tasks?.length}
          right={
            <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-4 py-2 shadow-sm glass-card">
              <Filter className="w-4 h-4 text-primary flex-shrink-0" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-[160px] border-0 bg-transparent p-0 focus:ring-0 text-sm font-bold shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c ?? "design"} className="capitalize font-medium">{c?.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 flex-1 relative z-10">
            {columns.map(col => (
              <div key={col.id} className="space-y-4">
                <Skeleton className="h-8 w-32 rounded-lg" />
                {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
              </div>
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={ListChecks} title="No tasks orchestrated" description="Run the Task Orchestration agent to generate team-ready tasks with user stories and acceptance criteria." />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 flex-1 items-start relative z-10 overflow-hidden pb-4">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter(t => (t.status ?? "todo") === col.id);
              return (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: columns.indexOf(col) * 0.07, type: "spring", stiffness: 260, damping: 28 }}
                  className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 h-full flex flex-col glass-card relative overflow-hidden"
                >
                  {/* Column accent top */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] ${col.accent} rounded-t-3xl`} />

                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4 px-1 pt-2 shrink-0">
                    <h2 className="text-xs font-black tracking-widest text-foreground uppercase flex items-center gap-2 font-mono">
                      <span className={`w-2 h-2 rounded-full ${col.dot} flex-shrink-0`} />
                      {col.label}
                    </h2>
                    <Badge variant="secondary" className="font-mono bg-background shadow-sm border border-border/60 text-xs font-black px-2.5">{colTasks.length}</Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2">
                    <AnimatePresence mode="popLayout">
                      {colTasks.map((task, i) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                          transition={{ type: "spring", stiffness: 320, damping: 30, delay: i * 0.04 }}
                        >
                          <motion.div
                            whileHover={col.glow ? { y: -2, boxShadow: `0 10px 30px ${col.glow}` } : { y: -2 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          >
                            <Card className={`border border-border/60 bg-card transition-all duration-200 group overflow-hidden hover:border-${col.id === 'done' ? 'emerald-500' : col.id === 'in-progress' ? 'primary' : 'border'}/30`}>
                              {/* Left accent bar */}
                              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${col.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
                              <CardContent className="p-4 pl-5 relative">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <h3 className="font-black text-foreground text-sm leading-snug tracking-tight flex-1 group-hover:text-primary transition-colors">{task.title}</h3>
                                  {task.effort && (
                                    <Badge variant="outline" className="text-[10px] font-black font-mono border-border/50 text-muted-foreground flex-shrink-0 bg-secondary/30 shadow-none px-2 py-0.5">
                                      {effortLabels[task.effort] ?? task.effort}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                  {task.category && (
                                    <Badge className={`${categoryColors[task.category] ?? "bg-muted text-muted-foreground border-border/50"} text-[10px] font-black font-mono uppercase tracking-widest shadow-none px-2 py-0.5`}>
                                      {task.category}
                                    </Badge>
                                  )}
                                  {task.priority && (
                                    <span className={`text-[10px] uppercase font-black font-mono tracking-widest ${priorityColors[task.priority] ?? ""}`}>
                                      {task.priority}
                                    </span>
                                  )}
                                </div>

                                {task.userStory && (
                                  <div className="mb-3 bg-secondary/25 rounded-lg p-3 border border-border/40">
                                    <p className="text-muted-foreground text-xs font-medium italic line-clamp-2 leading-relaxed">"{task.userStory}"</p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                                  <span className="text-[10px] font-black font-mono text-muted-foreground/60 uppercase tracking-wider">
                                    {task.owner ?? "Unassigned"}
                                  </span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                                    {columns.filter(c => c.id !== col.id).map(c => (
                                      <motion.button
                                        key={c.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => moveTask(task.id, c.id)}
                                        className="h-6 px-2 text-[9px] font-black uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors flex items-center gap-0.5 border border-border/50"
                                        title={`Move to ${c.label}`}
                                      >
                                        {c.id === "done" ? "Done" : c.id === "in-progress" ? "Progress" : "Todo"}
                                        <ChevronRight className="w-2.5 h-2.5" />
                                      </motion.button>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {colTasks.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-28 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest font-mono"
                      >
                        Empty
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
