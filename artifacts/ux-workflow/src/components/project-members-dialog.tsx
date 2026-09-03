import { useEffect, useState } from "react";
import { MailPlus, MoreHorizontal, ShieldCheck, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListProjectMembersQueryKey,
  useInviteProjectMember,
  useListProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMember,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ProjectMembersDialogProps {
  projectId: number;
  accessRole?: string | null;
}

export function ProjectMembersDialog({ projectId, accessRole }: ProjectMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reviewer");
  const qc = useQueryClient();
  const { toast } = useToast();
  const membersKey = getListProjectMembersQueryKey(projectId);
  const members = useListProjectMembers(projectId, {
    query: { queryKey: membersKey, refetchInterval: 15_000, refetchOnWindowFocus: true },
  });
  const invite = useInviteProjectMember();
  const updateMember = useUpdateProjectMember();
  const removeMember = useRemoveProjectMember();
  const canManage = accessRole === "owner";

  useEffect(() => {
    if (open) void members.refetch();
  }, [open]);

  const refresh = () => qc.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });

  const sendInvite = () => {
    invite.mutate(
      { id: projectId, data: { email: email.trim(), role } },
      {
        onSuccess: () => {
          setEmail("");
          setRole("reviewer");
          void refresh();
          toast({ title: "Invitation added", description: "They will gain access when they sign in with this email." });
        },
        onError: () => toast({ title: "Invitation not sent", description: "They may already have access.", variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl font-bold">
          <Users className="w-4 h-4 mr-2" /> Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Project team</DialogTitle>
          <DialogDescription>Editors can configure the project. Reviewers can read, comment, and approve decisions.</DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold"><MailPlus className="w-4 h-4 text-primary" /> Invite someone</div>
            <div className="grid sm:grid-cols-[1fr_140px_auto] gap-2">
              <div>
                <Label htmlFor="invite-email" className="sr-only">Email</Label>
                <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" className="rounded-xl" />
              </div>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={sendInvite} disabled={!email.includes("@") || invite.isPending} className="rounded-xl">Invite</Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
            <Avatar><AvatarFallback className="bg-primary/10 text-primary"><ShieldCheck className="w-4 h-4" /></AvatarFallback></Avatar>
            <div className="flex-1">
              <p className="font-bold">Project owner</p>
              <p className="text-xs text-muted-foreground">Full access</p>
            </div>
            <Badge>Owner</Badge>
          </div>
          {members.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading team…</p>
          ) : members.data?.map(member => (
            <div key={member.id} data-testid="project-member-row" className="flex items-center gap-3 rounded-2xl border border-border p-4">
              <Avatar><AvatarFallback className="font-black">{member.email[0]?.toUpperCase()}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{member.name || member.email}</p>
                <p className="truncate text-xs text-muted-foreground">{member.name ? member.email : member.status === "invited" ? "Invitation pending" : "Active member"}</p>
              </div>
              <Badge variant={member.status === "active" ? "secondary" : "outline"} className="capitalize">{member.role}</Badge>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Member actions"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateMember.mutate({ id: projectId, memberId: member.id, data: { role: member.role === "editor" ? "reviewer" : "editor" } }, { onSuccess: () => void refresh() })}>
                      Make {member.role === "editor" ? "reviewer" : "editor"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => removeMember.mutate({ id: projectId, memberId: member.id }, { onSuccess: () => void refresh() })}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}