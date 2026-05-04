import {
  Check,
  ChevronDown,
  FolderPlus,
  LogIn,
  LogOut,
  Pencil,
  Share2,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetAppLocale, useShellCopy, useAppLocale } from "@/lib/app-locale";
import type { Project } from "@/lib/roadmap-store";
import { cn } from "@/lib/utils";

type Props = {
  user: User | null;
  projects: Project[];
  activeProjectId: string | null;
  compact?: boolean;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onShareProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onLeaveProject: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function ProjectSwitcher({
  user,
  projects,
  activeProjectId,
  compact = false,
  onSelectProject,
  onNewProject,
  onShareProject,
  onRenameProject,
  onDeleteProject,
  onLeaveProject,
  onSignIn,
  onSignOut,
}: Props) {
  const copy = useShellCopy();
  const locale = useAppLocale();
  const setLocale = useSetAppLocale();
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const profileLabel = getProfileLabel(user);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const canManageActiveProject = !!user && !!activeProject && activeProject.ownerId === user.id;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1 px-2", compact ? "max-w-[176px]" : "max-w-[220px]")}
          >
            {!compact && (
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {copy.header.timelineLabel}
              </span>
            )}
            <span className="truncate font-medium">
              {activeProject?.title ?? copy.header.localProject}
            </span>
            {activeProject?.isShared && (
              <span className="rounded-full border border-border bg-secondary/70 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Shared
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn("w-64", compact && "w-56")}>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {copy.header.timelineProjects}
          </DropdownMenuLabel>
          {projects.map((project) => (
            <DropdownMenuItem key={project.id} onClick={() => onSelectProject(project.id)}>
              <Check
                className={`mr-2 h-4 w-4 ${project.id === activeProjectId ? "opacity-100" : "opacity-0"}`}
              />
              <span className="truncate">{project.title}</span>
            </DropdownMenuItem>
          ))}
          {projects.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={onNewProject} disabled={!user}>
            <FolderPlus className="mr-2 h-4 w-4" />
            {copy.header.newProject}
          </DropdownMenuItem>
          {activeProject && (
            <DropdownMenuItem onClick={onShareProject} disabled={!user}>
              <Users className="mr-2 h-4 w-4" />
              {canManageActiveProject ? copy.header.shareProject : copy.header.projectMembers}
            </DropdownMenuItem>
          )}
          {canManageActiveProject ? (
            <>
              <DropdownMenuItem onClick={onRenameProject} disabled={!activeProjectId || !user}>
                <Pencil className="mr-2 h-4 w-4" />
                {copy.header.renameProject}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDeleteProject} disabled={!activeProjectId || !user}>
                <Trash2 className="mr-2 h-4 w-4" />
                {copy.header.deleteProject}
              </DropdownMenuItem>
            </>
          ) : activeProject ? (
            <DropdownMenuItem onClick={onLeaveProject} disabled={!user}>
              <Share2 className="mr-2 h-4 w-4" />
              {copy.header.leaveProject}
            </DropdownMenuItem>
          ) : null}
          {!user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                {copy.header.signInToSave}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 overflow-hidden rounded-full border border-border bg-card"
            aria-label={user ? copy.header.profileMenu : copy.header.signIn}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={cn("w-64", compact && "w-56")}>
          <DropdownMenuLabel>
            <div className="truncate text-sm font-medium text-primary">{profileLabel}</div>
            <div className="truncate text-xs font-normal text-muted-foreground">
              {user?.email ?? copy.header.localOnlyWorkspace}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {copy.header.language}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => setLocale(value as "en" | "es")}
          >
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="es">Español</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          {user ? (
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {copy.header.signOut}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              {copy.header.signInWithGoogle}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getProfileLabel(user: User | null) {
  if (!user) return "Guest";
  return (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Profile"
  );
}
