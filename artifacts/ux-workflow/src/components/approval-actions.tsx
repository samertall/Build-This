import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ApprovalStatus = "approved" | "rejected";

interface ApprovalActionsProps {
  onDecision: (status: ApprovalStatus, comment?: string) => void;
  pending?: boolean;
  size?: "compact" | "large";
}

export function ApprovalActions({ onDecision, pending, size = "compact" }: ApprovalActionsProps) {
  const [status, setStatus] = useState<ApprovalStatus | null>(null);
  const [comment, setComment] = useState("");

  const close = () => {
    setStatus(null);
    setComment("");
  };

  const submit = () => {
    if (!status) return;
    onDecision(status, comment.trim() || undefined);
    close();
  };

  const buttonClass = size === "large" ? "h-11 px-4 rounded-xl" : "h-8 w-8 rounded-full";

  return (
    <>
      <div className="flex gap-2">
        <Button
          size={size === "large" ? "sm" : "icon"}
          variant="outline"
          className={`${buttonClass} text-emerald-600 border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15`}
          onClick={() => setStatus("approved")}
          disabled={pending}
          title="Approve"
        >
          <CheckCircle className="w-4 h-4" />
          {size === "large" && <span className="ml-2 font-bold">Approve</span>}
        </Button>
        <Button
          size={size === "large" ? "sm" : "icon"}
          variant="outline"
          className={`${buttonClass} text-destructive border-destructive/25 bg-destructive/5 hover:bg-destructive/15`}
          onClick={() => setStatus("rejected")}
          disabled={pending}
          title="Reject"
        >
          <XCircle className="w-4 h-4" />
          {size === "large" && <span className="ml-2 font-bold">Reject</span>}
        </Button>
      </div>

      <Dialog open={status !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{status === "approved" ? "Approve this decision?" : "Send this back?"}</DialogTitle>
            <DialogDescription>
              Your decision, identity, time, and optional rationale will be added to the permanent approval history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="approval-comment">Rationale (optional)</Label>
            <Textarea
              id="approval-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add context for the team…"
              className="min-h-28 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              onClick={submit}
              className={status === "rejected" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Record decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}