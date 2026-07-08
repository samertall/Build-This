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
  { id: "todo", label: "To Do", color: "border-t-muted-foreground/30", bg: "bg-muted/10" },
  { id: "in-progress", label: "In Progress", color: "border-t-primary", bg: "bg-primary/5" },
  { id: "done", label: "Done", color: "border-t-sidebar-accent", bg: "bg-sidebar-accent/5" },
];

const categoryColors: Record<string, string> = {
  design: "bg-primary/10 text-primary border-primary/20",
  development: "bg-secondary text-secondary-foreground border-border",
  content: "bg-sidebar-accent/10 text-sidebar-accent border-sidebar-accent/20",
  research: "bg-muted text-muted-foreground border-border",
  qa: "bg-accent/10 text-accent-foreground border-accent/20",
  marketing: "bg-primary/5 text-primary border-primary/10",
};

const priorityColors: Record<string, string> = {
  critical: "text-destructive font-bold",
  high: "text-primary font-bold",
  medium: "text-secondary-foreground font-semibold",
  low: "text-muted-foreground font-medium",
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
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Task Board</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl leading-relaxed">
              Team-ready tasks with user stories and acceptance criteria. Update status to track progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-background border border-border rounded-md px-3 py-1.5 flex items-center shadow-sm">
              <Filter className="w-3.5 h-3.5 text-muted-foreground mr-2" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-7 w-[140px] border-0 bg-transparent p-0 focus:ring-0 text-sm font-medium shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c ?? "design"} className="capitalize">{c?.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 flex-1">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
              </div>
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center">
            <Card className="border-dashed border-border bg-muted/30 shadow-none w-full max-w-2xl">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
                  <ListChecks className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Run the Task Orchestration agent to generate team-ready tasks with user stories and acceptance criteria.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 flex-1 items-start">
            {columns.map((col, colIndex) => {
              const colTasks = filteredTasks.filter(t => (t.status ?? "todo") === col.id);
              return (
                <div key={col.id} className={`rounded-xl border border-border/50 ${col.bg} p-4 min-h-[500px] flex flex-col`}>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">{col.label}</h2>
                    <Badge variant="secondary" className="font-mono bg-background shadow-sm border border-border text-xs">
                      {colTasks.length}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <AnimatePresence mode="popLayout">
                      {colTasks.map((task, i) => (
                        <motion.div 
                          key={task.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }} 
                          animate={{ opacity: 1, scale: 1 }} 
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.05 }}
                        >
                          <Card className={`border-t-4 ${col.color} border-x-border border-b-border bg-card shadow-sm hover:shadow-md transition-shadow group overflow-hidden`}>
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="font-semibold text-foreground text-sm leading-tight flex-1">{task.title}</h3>
                                {task.effort && (
                                  <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground flex-shrink-0 bg-muted/30">
                                    {effortLabels[task.effort] ?? task.effort}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mb-4">
                                {task.category && (
                                  <Badge className={`${categoryColors[task.category] ?? "bg-muted text-muted-foreground border-border"} text-[10px] font-mono capitalize tracking-wide shadow-none`}>
                                    {task.category}
                                  </Badge>
                                )}
                                {task.priority && (
                                  <span className={`text-[10px] uppercase font-mono tracking-wider ${priorityColors[task.priority] ?? ""}`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>

                              {task.userStory && (
                                <div className="mb-4 bg-muted/40 rounded-md p-3 border border-border/50">
                                  <p className="text-muted-foreground text-xs italic line-clamp-3 leading-relaxed">"{task.userStory}"</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                {task.owner ? (
                                  <div className="text-[10px] font-mono text-muted-foreground">
                                    <span className="text-foreground font-medium">{task.owner}</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-mono text-muted-foreground italic">Unassigned</div>
                                )}

                                {/* Status controls */}
                                <div className="flex gap-1">
                                  {columns.filter(c => c.id !== col.id).map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => moveTask(task.id, c.id)}
                                      className="h-6 px-2 text-[10px] font-mono font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors flex items-center"
                                      title={`Move to ${c.label}`}
                                    >
                                      {c.id === 'todo' ? '← Todo' : c.id === 'done' ? 'Done →' : 'Move'}
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
                      <div className="h-32 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center text-muted-foreground/60 text-sm font-medium">
                        Drop items here
                      </div>
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
