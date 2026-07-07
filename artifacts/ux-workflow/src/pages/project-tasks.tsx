import { useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { ListChecks, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListTasks, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const columns = [
  { id: "todo", label: "To Do", color: "border-t-yellow-400" },
  { id: "in-progress", label: "In Progress", color: "border-t-purple-400" },
  { id: "done", label: "Done", color: "border-t-green-400" },
];

const categoryColors: Record<string, string> = {
  design: "bg-blue-400/15 text-blue-400 border-blue-400/20",
  development: "bg-purple-400/15 text-purple-400 border-purple-400/20",
  content: "bg-teal-400/15 text-teal-400 border-teal-400/20",
  research: "bg-indigo-400/15 text-indigo-400 border-indigo-400/20",
  qa: "bg-orange-400/15 text-orange-400 border-orange-400/20",
  marketing: "bg-pink-400/15 text-pink-400 border-pink-400/20",
};

const priorityColors: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-muted-foreground",
};

const effortLabels: Record<string, string> = { xs: "XS", s: "S", m: "M", l: "L", xl: "XL" };

export default function ProjectTasksPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useListTasks(projectId);
  const updateTask = useUpdateTask();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredTasks = tasks?.filter(t => categoryFilter === "all" || t.category === categoryFilter) ?? [];

  const moveTask = (taskId: number, newStatus: string) => {
    updateTask.mutate(
      { projectId, taskId, data: { status: newStatus } },
      {
        onSuccess: () => void qc.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) }),
      }
    );
  };

  const categories = tasks ? [...new Set(tasks.map(t => t.category ?? "design"))] : [];

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Task Board</h1>
            <p className="text-muted-foreground text-sm mt-1">Team-ready tasks with user stories and acceptance criteria. Drag to update status.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-36 bg-input border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c ?? "design"} className="capitalize">{c?.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {columns.map(col => (
              <div key={col.id}>
                <Skeleton className="h-6 w-24 mb-3" />
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
              </div>
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-400/10 flex items-center justify-center mb-4">
                <ListChecks className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No tasks yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Run the Task Orchestration agent to generate team-ready tasks with user stories and acceptance criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => (t.status ?? "todo") === col.id);
              return (
                <div key={col.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-foreground">{col.label}</h2>
                    <Badge variant="outline" className="border-border text-muted-foreground text-xs">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((task, i) => (
                      <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Card className={`border-t-2 ${col.color} border-x-border border-b-border bg-card hover:border-t-2 transition-colors`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-medium text-foreground text-sm leading-snug flex-1">{task.title}</h3>
                              {task.effort && (
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground flex-shrink-0">
                                  {effortLabels[task.effort] ?? task.effort}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {task.category && (
                                <Badge className={`${categoryColors[task.category] ?? "bg-muted text-muted-foreground border-border"} text-xs capitalize`}>
                                  {task.category}
                                </Badge>
                              )}
                              {task.priority && (
                                <span className={`text-xs font-medium ${priorityColors[task.priority] ?? ""} capitalize`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>

                            {task.userStory && (
                              <p className="text-muted-foreground text-xs mb-2 italic line-clamp-2">{task.userStory}</p>
                            )}

                            {task.owner && (
                              <div className="text-xs text-muted-foreground mb-3">Owner: <span className="text-foreground">{task.owner}</span></div>
                            )}

                            {/* Status controls */}
                            <div className="flex gap-1.5 flex-wrap">
                              {columns.filter(c => c.id !== col.id).map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => moveTask(task.id, c.id)}
                                  className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 hover:bg-muted/50 transition-colors"
                                >
                                  → {c.label}
                                </button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                        No tasks
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
