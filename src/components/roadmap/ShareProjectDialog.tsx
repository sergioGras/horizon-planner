import { useEffect, useState } from "react";
import { Copy, Loader2, MailPlus, Trash2, UserMinus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import {
  useRoadmap,
  type Project,
  type ProjectInvite,
  type ProjectMember,
} from "@/lib/roadmap-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
};

export function ShareProjectDialog({ open, onOpenChange, project }: Props) {
  const { user } = useAuth();
  const listProjectMembers = useRoadmap((state) => state.listProjectMembers);
  const listProjectInvites = useRoadmap((state) => state.listProjectInvites);
  const createProjectInvite = useRoadmap((state) => state.createProjectInvite);
  const revokeProjectInvite = useRoadmap((state) => state.revokeProjectInvite);
  const removeProjectMember = useRoadmap((state) => state.removeProjectMember);
  const leaveProject = useRoadmap((state) => state.leaveProject);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !!user && !!project && project.ownerId === user.id;

  useEffect(() => {
    if (!open || !project) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([listProjectMembers(project.id), listProjectInvites(project.id)])
      .then(([nextMembers, nextInvites]) => {
        if (!isMounted) return;
        setMembers(nextMembers);
        setInvites(nextInvites);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load sharing data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listProjectInvites, listProjectMembers, open, project]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCopiedLink(null);
      setError(null);
    }
  }, [open]);

  async function refreshLists() {
    if (!project) return;
    const [nextMembers, nextInvites] = await Promise.all([
      listProjectMembers(project.id),
      listProjectInvites(project.id),
    ]);
    setMembers(nextMembers);
    setInvites(nextInvites);
  }

  async function handleCreateInvite() {
    if (!project || !email.trim()) return;
    setSharing(true);
    setError(null);

    try {
      const result = await createProjectInvite(project.id, email.trim());
      if (!result) return;

      const url = new URL(window.location.href);
      url.searchParams.set("invite", result.token);
      setCopiedLink(url.toString());
      await refreshLists();
      setEmail("");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to create invite.");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyLink() {
    if (!copiedLink) return;
    await navigator.clipboard.writeText(copiedLink);
  }

  async function handleRemoveMember(member: ProjectMember) {
    if (!project) return;
    setSharing(true);
    setError(null);
    try {
      await removeProjectMember(project.id, member.userId);
      await refreshLists();
    } catch (memberError) {
      setError(memberError instanceof Error ? memberError.message : "Failed to remove member.");
    } finally {
      setSharing(false);
    }
  }

  async function handleRevokeInvite(invite: ProjectInvite) {
    setSharing(true);
    setError(null);
    try {
      await revokeProjectInvite(invite.id);
      await refreshLists();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to revoke invite.");
    } finally {
      setSharing(false);
    }
  }

  async function handleLeaveProject() {
    if (!project) return;
    setSharing(true);
    setError(null);
    try {
      await leaveProject(project.id);
      onOpenChange(false);
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : "Failed to leave project.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[84svh] overflow-hidden border-border bg-card sm:max-w-[680px] lg:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">Share project</DialogTitle>
          <DialogDescription>
            Invite collaborators, review who has access, and manage pending access requests.
          </DialogDescription>
        </DialogHeader>

        {!project ? (
          <div className="py-4 text-sm text-muted-foreground">No project selected.</div>
        ) : (
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Project
              </div>
              <div className="mt-1 font-display text-lg text-primary">{project.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {isOwner
                  ? "Invite collaborators by email. They can join and edit this roadmap."
                  : "You can view members and leave this project. Only the owner can invite or revoke access."}
              </div>
            </div>

            {isOwner && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div>
                  <div className="font-medium text-primary">Invite by email</div>
                  <div className="text-sm text-muted-foreground">
                    An invite link is created for the address you enter.
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email address</Label>
                    <Input
                      id="invite-email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="teammate@company.com"
                      autoComplete="email"
                      disabled={sharing}
                    />
                  </div>
                  <div className="flex items-end md:pb-[1px]">
                    <Button onClick={handleCreateInvite} disabled={!email.trim() || sharing}>
                      {sharing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MailPlus className="mr-2 h-4 w-4" />
                      )}
                      Create invite
                    </Button>
                  </div>
                </div>

                {copiedLink && (
                  <div className="rounded-md border border-dashed border-border bg-background px-3 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Invite link
                        </div>
                        <div className="break-all text-sm text-primary">{copiedLink}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:shrink-0"
                        onClick={handleCopyLink}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-primary">Members</div>
                  <div className="text-sm text-muted-foreground">
                    People with access to this timeline project.
                  </div>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>

              <Separator />

              {loading ? (
                <div className="py-3 text-sm text-muted-foreground">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="py-3 text-sm text-muted-foreground">No collaborators yet.</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col gap-2 rounded-md border border-border/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-medium text-primary">
                            {member.displayName?.trim() || member.email}
                          </div>
                          {member.userId === user?.id ? (
                            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                              You
                            </div>
                          ) : null}
                        </div>
                        <div className="truncate text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {member.email} · {member.role}
                        </div>
                      </div>
                      {isOwner && member.userId !== user?.id ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleRemoveMember(member)}
                          disabled={sharing}
                          aria-label={`Remove ${member.email}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      ) : !isOwner ? (
                        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          Member
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isOwner && invites.length > 0 && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div>
                  <div className="font-medium text-primary">Pending invites</div>
                  <div className="text-sm text-muted-foreground">
                    Copy or revoke pending access.
                  </div>
                </div>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-2 rounded-md border border-border/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-primary">
                          {invite.email}
                        </div>
                        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleRevokeInvite(invite)}
                        disabled={sharing}
                        aria-label={`Revoke invite for ${invite.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!isOwner && project && (
            <Button variant="outline" onClick={handleLeaveProject} disabled={sharing}>
              Leave project
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
