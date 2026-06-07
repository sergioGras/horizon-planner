import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Upload } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShellCopy } from "@/lib/app-locale";
import { useIsCompactLayout } from "@/hooks/use-compact-layout";
import { cn } from "@/lib/utils";
import type { Project, TimeScale } from "@/lib/roadmap-store";
import { ProjectSwitcher } from "./ProjectSwitcher";

const BRAND_LOGO_SRC = "/logo.png";

type Props = {
  projects: Project[];
  activeProjectId: string | null;
  user: User | null;
  windowLabel: string;
  windowRange: string;
  scale: TimeScale;
  canCreateMilestone: boolean;
  isSaving: boolean;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onShareProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
  onLeaveProject: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onScaleChange: (scale: TimeScale) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onImportRoadmap: () => void;
  onAddMilestone: () => void;
};

export function BoardHeader({
  projects,
  activeProjectId,
  user,
  windowLabel,
  windowRange,
  scale,
  canCreateMilestone,
  isSaving,
  onSelectProject,
  onNewProject,
  onShareProject,
  onRenameProject,
  onDeleteProject,
  onLeaveProject,
  onSignIn,
  onSignOut,
  onScaleChange,
  onPrevious,
  onNext,
  onToday,
  onImportRoadmap,
  onAddMilestone,
}: Props) {
  const isCompactLayout = useIsCompactLayout();
  const copy = useShellCopy();

  return (
    <header className="shrink-0 border-b border-border/70 bg-background/90 backdrop-blur-sm">
      <div
        className={cn(
          "w-full px-3 py-2 lg:px-4 xl:px-6 2xl:px-8",
          isCompactLayout ? "flex flex-col gap-2" : "flex h-14 items-center justify-between gap-3",
        )}
      >
        <div className={cn("flex min-w-0 items-center", isCompactLayout ? "gap-2" : "gap-3")}>
          <img
            src={BRAND_LOGO_SRC}
            alt={copy.brand}
            className="h-7 w-auto shrink-0 select-none object-contain"
            draggable={false}
          />
          <div
            className={cn("h-5 w-px bg-border/80", isCompactLayout ? "hidden" : "hidden sm:block")}
          />
          <ProjectSwitcher
            user={user}
            projects={projects}
            activeProjectId={activeProjectId}
            compact={isCompactLayout}
            onSelectProject={onSelectProject}
            onNewProject={onNewProject}
            onShareProject={onShareProject}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
            onLeaveProject={onLeaveProject}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        </div>

        <div
          className={cn(
            "flex min-w-0 items-center",
            isCompactLayout ? "justify-between gap-2" : "gap-3",
          )}
        >
          <div className="flex min-w-0 items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Previous window" onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div
              className={cn(
                "px-1 text-center font-display text-sm font-medium text-primary md:text-base",
                isCompactLayout
                  ? "min-w-[102px] sm:min-w-[128px]"
                  : "min-w-[116px] sm:min-w-[136px] md:min-w-[170px]",
              )}
            >
              {windowLabel}
            </div>
            <Button variant="ghost" size="icon" aria-label="Next window" onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCompactLayout && (
              <div className="hidden text-xs text-muted-foreground md:block">{windowRange}</div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isSaving && !isCompactLayout && (
              <div className="hidden text-xs uppercase tracking-[0.14em] text-muted-foreground lg:block">
                {copy.header.saving}
              </div>
            )}
            <ScaleToggle
              scale={scale}
              onChange={onScaleChange}
              compact={isCompactLayout}
              labels={copy.header}
            />
            {isCompactLayout ? (
              <HeaderOverflowMenu
                copy={copy}
                canCreateMilestone={canCreateMilestone}
                onToday={onToday}
                onImportRoadmap={onImportRoadmap}
                onAddMilestone={onAddMilestone}
              />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={onToday}
                >
                  {copy.header.today}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={onImportRoadmap}
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">{copy.header.importRoadmap}</span>
                </Button>
                <Button
                  onClick={onAddMilestone}
                  className="rounded-md"
                  disabled={!canCreateMilestone}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{copy.header.newMilestone}</span>
                  <span className="sm:hidden">{copy.header.newMilestone}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderOverflowMenu({
  copy,
  canCreateMilestone,
  onToday,
  onImportRoadmap,
  onAddMilestone,
}: {
  copy: ReturnType<typeof useShellCopy>;
  canCreateMilestone: boolean;
  onToday: () => void;
  onImportRoadmap: () => void;
  onAddMilestone: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onToday}>{copy.header.today}</DropdownMenuItem>
        <DropdownMenuItem onClick={onImportRoadmap}>
          <Upload className="mr-2 h-4 w-4" />
          {copy.header.importRoadmap}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddMilestone} disabled={!canCreateMilestone}>
          <Plus className="mr-2 h-4 w-4" />
          {copy.header.newMilestone}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ScaleToggle({
  scale,
  onChange,
  labels,
  compact = false,
}: {
  scale: TimeScale;
  onChange: (s: TimeScale) => void;
  labels: Pick<
    ReturnType<typeof useShellCopy>["header"],
    "scaleMonth" | "scaleQuarter" | "scaleYear"
  >;
  compact?: boolean;
}) {
  const scaleLabels = {
    month: labels.scaleMonth,
    quarter: labels.scaleQuarter,
    year: labels.scaleYear,
  } as const;

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {(["month", "quarter", "year"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={scale === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-[5px] px-3 text-xs font-medium capitalize transition-colors",
            compact ? "h-7 px-2 text-[11px]" : "h-8 px-3",
            scale === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          {scaleLabels[option]}
        </button>
      ))}
    </div>
  );
}
