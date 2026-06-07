import { useEffect, useState } from "react";
import { Copy, Loader2, MailPlus, Monitor, Trash2, UserMinus, Users } from "lucide-react";
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
import { useShellCopy } from "@/lib/app-locale";
import {
  createProjectDisplayLink,
  listProjectDisplayLinks,
  revokeProjectDisplayLink,
  type ProjectDisplayLink,
} from "@/lib/display-roadmap";
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
  const copy = useShellCopy();
  const { user } = useAuth();
  const listProjectMembers = useRoadmap((state) => state.listProjectMembers);
  const listProjectInvites = useRoadmap((state) => state.listProjectInvites);
  const createProjectInvite = useRoadmap((state) => state.createProjectInvite);
  const revokeProjectInvite = useRoadmap((state) => state.revokeProjectInvite);
  const removeProjectMember = useRoadmap((state) => state.removeProjectMember);
  const leaveProject = useRoadmap((state) => state.leaveProject);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [displayLinks, setDisplayLinks] = useState<ProjectDisplayLink[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [displayLinkCopied, setDisplayLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = !!user && !!project && project.ownerId === user.id;

  useEffect(() => {
    if (!open || !project) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listProjectMembers(project.id),
      listProjectInvites(project.id),
      isOwner ? listProjectDisplayLinks(project.id) : Promise.resolve([]),
    ])
      .then(([nextMembers, nextInvites, nextDisplayLinks]) => {
        if (!isMounted) return;
        setMembers(nextMembers);
        setInvites(nextInvites);
        setDisplayLinks(nextDisplayLinks);
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
  }, [isOwner, listProjectInvites, listProjectMembers, open, project]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCopiedLink(null);
      setInviteLinkCopied(false);
      setDisplayUrl(null);
      setDisplayLinkCopied(false);
      setError(null);
    }
  }, [open]);

  async function refreshLists() {
    if (!project) return;
    const [nextMembers, nextInvites, nextDisplayLinks] = await Promise.all([
      listProjectMembers(project.id),
      listProjectInvites(project.id),
      isOwner ? listProjectDisplayLinks(project.id) : Promise.resolve([]),
    ]);
    setMembers(nextMembers);
    setInvites(nextInvites);
    setDisplayLinks(nextDisplayLinks);
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
    setInviteLinkCopied(true);
    window.setTimeout(() => setInviteLinkCopied(false), 1400);
  }

  async function handleCreateDisplayLink() {
    if (!project) return;
    setSharing(true);
    setError(null);
    try {
      const result = await createProjectDisplayLink(project.id);
      setDisplayUrl(new URL(`/display/${result.token}`, window.location.origin).toString());
      await refreshLists();
    } catch (displayError) {
      setError(
        displayError instanceof Error ? displayError.message : "Failed to create display link.",
      );
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyDisplayLink() {
    if (!displayUrl) return;
    await navigator.clipboard.writeText(displayUrl);
    setDisplayLinkCopied(true);
    window.setTimeout(() => setDisplayLinkCopied(false), 1400);
  }

  async function handleRevokeDisplayLink() {
    const displayLink = displayLinks[0];
    if (!displayLink) return;
    setSharing(true);
    setError(null);
    try {
      await revokeProjectDisplayLink(displayLink.id);
      setDisplayUrl(null);
      await refreshLists();
    } catch (displayError) {
      setError(
        displayError instanceof Error ? displayError.message : "Failed to revoke display link.",
      );
    } finally {
      setSharing(false);
    }
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
      <DialogContent className="flex max-h-[84svh] flex-col overflow-hidden border-border bg-card sm:max-w-[680px] lg:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {copy.shareProject.title}
          </DialogTitle>
          <DialogDescription>
            {isOwner ? copy.shareProject.descriptionOwner : copy.shareProject.descriptionMember}
          </DialogDescription>
        </DialogHeader>

        {!project ? (
          <div className="py-4 text-sm text-muted-foreground">
            {copy.shareProject.noProjectSelected}
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {copy.shareProject.projectLabel}
              </div>
              <div className="mt-1 font-display text-lg text-primary">{project.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {isOwner ? copy.shareProject.descriptionOwner : copy.shareProject.descriptionMember}
              </div>
            </div>

            {isOwner && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div>
                  <div className="font-medium text-primary">{copy.shareProject.inviteByEmail}</div>
                  <div className="text-sm text-muted-foreground">
                    {copy.shareProject.inviteDescription}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">{copy.shareProject.emailLabel}</Label>
                    <Input
                      id="invite-email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={copy.shareProject.emailPlaceholder}
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
                      {copy.shareProject.createInvite}
                    </Button>
                  </div>
                </div>

                {copiedLink && (
                  <div className="rounded-md border border-dashed border-border bg-background px-3 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {copy.shareProject.inviteLink}
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
                        {inviteLinkCopied
                          ? copy.shareProject.linkCopied
                          : copy.shareProject.copyLink}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwner && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-primary">{copy.shareProject.displayTitle}</div>
                    <div className="text-sm text-muted-foreground">
                      {copy.shareProject.displayDescription}
                    </div>
                  </div>
                  <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>

                {displayUrl && (
                  <div className="rounded-md border border-dashed border-border bg-background px-3 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {copy.shareProject.displayLink}
                        </div>
                        <div className="break-all text-sm text-primary">{displayUrl}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleCopyDisplayLink}>
                        <Copy className="mr-2 h-4 w-4" />
                        {displayLinkCopied
                          ? copy.shareProject.linkCopied
                          : copy.shareProject.copyLink}
                      </Button>
                    </div>
                  </div>
                )}

                {displayLinks.length > 0 && !displayUrl && (
                  <div className="text-sm text-muted-foreground">
                    {copy.shareProject.activeDisplayLink}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCreateDisplayLink} disabled={sharing}>
                    {sharing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Monitor className="mr-2 h-4 w-4" />
                    )}
                    {displayLinks.length > 0
                      ? copy.shareProject.replaceDisplayLink
                      : copy.shareProject.createDisplayLink}
                  </Button>
                  {displayLinks.length > 0 && (
                    <Button variant="outline" onClick={handleRevokeDisplayLink} disabled={sharing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {copy.shareProject.revokeDisplayLink}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-primary">{copy.shareProject.membersTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {copy.shareProject.membersDescription}
                  </div>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>

              <Separator />

              {loading ? (
                <div className="py-3 text-sm text-muted-foreground">
                  {copy.shareProject.loadingMembers}
                </div>
              ) : members.length === 0 ? (
                <div className="py-3 text-sm text-muted-foreground">
                  {copy.shareProject.noCollaborators}
                </div>
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
                              {copy.shareProject.you}
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
                          aria-label={`${copy.shareProject.member} ${member.email}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      ) : !isOwner ? (
                        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {copy.shareProject.member}
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
                  <div className="font-medium text-primary">{copy.shareProject.pendingTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {copy.shareProject.pendingDescription}
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
                          {copy.shareProject.expiresOn}{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleRevokeInvite(invite)}
                        disabled={sharing}
                        aria-label={`${copy.shareProject.invited} ${invite.email}`}
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
              {copy.shareProject.leaveProject}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {copy.shareProject.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
