import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock3, MessageSquare, Send, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListProjectCommentsQueryKey,
  getListApprovalHistoryQueryKey,
  useCreateProjectComment,
  useListApprovalHistory,
  useListProjectComments,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ReviewThreadProps {
  projectId: number;
  itemType: "insight" | "problem" | "recommendation" | "presentation";
  itemId: number;
  label?: string;
}

function initials(value?: string | null) {
  return (value || "Member").split(/[\s@]+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
}

export function ReviewThread({ projectId, itemType, itemId, label = "Discuss" }: ReviewThreadProps) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const commentsKey = getListProjectCommentsQueryKey(projectId, itemType, itemId);
  const historyKey = getListApprovalHistoryQueryKey(projectId, itemType, itemId);
  const comments = useListProjectComments(projectId, itemType, itemId, {
    query: { queryKey: commentsKey, refetchInterval: 15_000, refetchOnWindowFocus: true },
  });
  const history = useListApprovalHistory(projectId, itemType, itemId, {
    query: { queryKey: historyKey, refetchInterval: 15_000, refetchOnWindowFocus: true },
  });
  const createComment = useCreateProjectComment();

  useEffect(() => {
    if (open) {
      void comments.refetch();
      void history.refetch();
    }
  }, [open]);

  const submit = () => {
    const message = body.trim();
    if (!message) return;
    createComment.mutate(
      { id: projectId, itemType, itemId, data: { body: message } },
      {
        onSuccess: () => {
          setBody("");
          void qc.invalidateQueries({ queryKey: getListProjectCommentsQueryKey(projectId, itemType, itemId) });
        },
        onError: () => toast({ title: "Comment not saved", variant: "destructive" }),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 rounded-xl text-muted-foreground hover:text-foreground">
          <MessageSquare className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Team review</SheetTitle>
          <SheetDescription>Discuss this {itemType} and see its full decision history.</SheetDescription>
        </SheetHeader>

        <div className="mt-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-widest font-mono">Comments</h3>
            <Badge variant="secondary">{comments.data?.length ?? 0}</Badge>
          </div>
          <div className="space-y-3">
            {comments.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading discussion…</p>
            ) : comments.data?.length ? comments.data.map(comment => (
              <div key={comment.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">{initials(comment.authorName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold">{comment.authorName || "Project member"}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            )) : (
              <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No comments yet. Start the review conversation.</p>
            )}
          </div>
          <div className="space-y-2">
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share feedback or ask a question…" className="min-h-24 rounded-xl" />
            <Button onClick={submit} disabled={!body.trim() || createComment.isPending} className="w-full rounded-xl">
              <Send className="w-4 h-4 mr-2" /> Add comment
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-widest font-mono">Approval history</h3>
            <Badge variant="outline">{history.data?.length ?? 0}</Badge>
          </div>
          {history.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : history.data?.length ? (
            <div className="space-y-3">
              {history.data.map(event => {
                const approved = event.status === "approved";
                return (
                  <div key={event.id} className="relative pl-8 pb-4 border-l border-border ml-3 last:pb-0">
                    <div className={`absolute -left-3 top-0 h-6 w-6 rounded-full flex items-center justify-center ${approved ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"}`}>
                      {approved ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-bold">{event.actorName || "Project member"} {approved ? "approved" : "rejected"} this item</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Clock3 className="h-3 w-3" />
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                    {event.comment && <p className="mt-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{event.comment}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No approval decisions have been recorded yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}