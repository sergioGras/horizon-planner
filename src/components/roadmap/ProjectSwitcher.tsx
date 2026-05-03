import {
  Check,
  ChevronDown,
  FolderPlus,
  LogIn,
  LogOut,
  Pencil,
  Trash2,
  UserCircle,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/roadmap-store";
import { cn } from "@/lib/utils";

type Props = {
  user: User | null;
  projects: Project[];
  activeProjectId: string | null;
  compact?: boolean;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
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
  onRenameProject,
  onDeleteProject,
  onSignIn,
  onSignOut,
}: Props) {
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const profileLabel = getProfileLabel(user);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

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
                Timeline
              </span>
            )}
            <span className="truncate font-medium">{activeProject?.title ?? "Local Roadmap"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn("w-64", compact && "w-56")}>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Timeline projects
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
            New project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRenameProject} disabled={!activeProjectId || !user}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeleteProject} disabled={!activeProjectId || !user}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete project
          </DropdownMenuItem>
          {!user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to save cloud projects
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
            aria-label={user ? "Profile menu" : "Sign in"}
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
              {user?.email ?? "Local-only workspace"}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user ? (
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
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
