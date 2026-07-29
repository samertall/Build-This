import { useState } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListTasks, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const columns = [
  { id: "todo", label: "To Do", color: "border-t-muted-foreground/30", bg: "bg-muted/10", glow: "hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]" },
  { id: "in-progress", label: "In Progress", color: "border-t-primary", bg: "bg-primary/5", glow: "hover:shadow-[0_8px_30px_rgba(24,147,247,0.1)] hover:border-primary/30" },
  { id: "done", label: "Done", color: "border-t-emerald-500", bg: "bg-emerald-500/5", glow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:border-emerald-500/30" },
];

const categoryColors: Record<string, string> = {
  design: "bg-primary/10 text-primary border-primary/20",
  development: "bg-secondary text-secondary-foreground border-border/50",
  content: "bg-sidebar-accent/10 text-sidebar-accent border-sidebar-accent/20",
  research: "bg-muted text-muted-foreground border-border/50",
  qa: "bg-accent/10 text-accent-foreground border-accent/20",
  marketing: "bg-primary/5 text-primary border-primary/10",
};

const priorityColors: Record<string, string> = {
  critical: "text-destructive font-black",
  high: "text-amber-600 font-black",
  medium: "text-primary font-black",
  low: "text-muted-foreground font-bold",
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

  const moveTask = (taskId: number, newStatus: string) => {
    updateTask.mutate(
      { id: projectId, taskId, data: { status: newStatus } },
      {
        onSuccess: () => void qc.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) }),
      }
    );
  };

  const categories = tasks ? [...new Set(tasks.map(t => t.category ?? "design"))] : [];

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full h-[calc(100dvh-4rem)] flex flex-col relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 shrink-0 relative z-10 border-b border-border/50 pb-6">
          <div className="relative">
            <div className="absolute -left-4 top-2 w-1 h-12 bg-teal-500 rounded-r-full" />
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Task Orchestration</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-medium">
              Team-ready tasks with user stories and acceptance criteria. Update status to track progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-card border border-border/60 rounded-xl px-4 py-2 flex items-center shadow-sm glass-card">
              <Filter className="w-4 h-4 text-primary mr-3" />
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
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 flex-1 relative z-10">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col space-y-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-28 rounded-lg" />
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
              </div>
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center relative z-10">
            <Card className="border-dashed border-2 border-border bg-card/30 shadow-none w-full max-w-2xl">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 shadow-sm border border-teal-500/20">
                  <ListChecks className="w-8 h-8 text-teal-500" />
                </div>
                <h3 className="font-black text-2xl text-foreground mb-3 tracking-tight">No tasks orchestrated</h3>
                <p className="text-muted-foreground text-base max-w-md font-medium">
                  Run the Task Orchestration agent to generate team-ready tasks with user stories and acceptance criteria.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 flex-1 items-start relative z-10 h-full overflow-hidden pb-4">
            {columns.map((col, colIndex) => {
              const colTasks = filteredTasks.filter(t => (t.status ?? "todo") === col.id);
              return (
                <div key={col.id} className={`rounded-3xl border border-border/60 ${col.bg} p-5 h-full flex flex-col glass-card relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
                  
                  <div className="flex items-center justify-between mb-5 px-1 shrink-0">
                    <h2 className="text-sm font-black tracking-widest text-foreground uppercase flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.id === 'done' ? 'bg-emerald-500' : col.id === 'in-progress' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      {col.label}
                    </h2>
                    <Badge variant="secondary" className="font-mono bg-background shadow-sm border border-border/60 text-xs font-black">
                      {colTasks.length}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">
                    <AnimatePresence mode="popLayout">
                      {colTasks.map((task, i) => (
                        <motion.div 
                          key={task.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                          animate={{ opacity: 1, scale: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <Card className={`border-t-4 ${col.color} border-x-border/60 border-b-border/60 bg-card transition-all duration-300 group overflow-hidden ${col.glow}`}>
                            <CardContent className="p-5 relative z-10">
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <h3 className="font-black text-foreground text-base leading-snug tracking-tight flex-1 group-hover:text-primary transition-colors">{task.title}</h3>
                                {task.effort && (
                                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest font-mono border-border/50 text-muted-foreground flex-shrink-0 bg-secondary/30 shadow-none px-2 py-0.5">
                                    {effortLabels[task.effort] ?? task.effort} EFF
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mb-5">
                                {task.category && (
                                  <Badge className={`${categoryColors[task.category] ?? "bg-muted text-muted-foreground border-border/50"} text-[10px] font-black font-mono uppercase tracking-widest shadow-none px-2 py-0.5`}>
                                    {task.category}
                                  </Badge>
                                )}
                                {task.priority && (
                                  <span className={`text-[10px] uppercase font-mono tracking-widest ${priorityColors[task.priority] ?? ""}`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>

                              {task.userStory && (
                                <div className="mb-5 bg-secondary/30 rounded-xl p-3.5 border border-border/50">
                                  <p className="text-muted-foreground text-sm font-medium italic line-clamp-3 leading-relaxed">"{task.userStory}"</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                                {task.owner ? (
                                  <div className="text-[10px] font-black uppercase tracking-widest font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                                    <span className="text-foreground">{task.owner}</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold font-mono text-muted-foreground italic bg-muted/30 px-2 py-1 rounded-md">Unassigned</div>
                                )}

                                {/* Status controls */}
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-background border border-border/50 p-1 rounded-lg shadow-sm">
                                  {columns.filter(c => c.id !== col.id).map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => moveTask(task.id, c.id)}
                                      className="h-7 px-2.5 text-[10px] font-black uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors flex items-center"
                                      title={`Move to ${c.label}`}
                                    >
                                      {c.id === 'todo' ? '← Todo' : c.id === 'done' ? 'Done →' : 'Prog →'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {colTasks.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-32 border-2 border-dashed border-border/50 rounded-2xl flex items-center justify-center text-muted-foreground/50 text-sm font-black uppercase tracking-widest font-mono mt-4">
                        Drop items here
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
