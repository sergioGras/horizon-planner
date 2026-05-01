import type { CSSProperties } from "react";
import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Milestone, Section } from "@/lib/roadmap-store";
import { milestonesForSection } from "@/lib/roadmap-view";
import { getSectionColor } from "@/lib/section-colors";
import type { TimeWindow } from "@/lib/timeline";
import { MilestoneLayer } from "./MilestoneLayer";
import { TimelineGrid } from "./TimelineGrid";

type Props = {
  section: Section;
  window: TimeWindow;
  milestones: Milestone[];
  density: "comfortable" | "compact" | "dense";
  sectionIndex: number;
  sectionCount: number;
  onAddMilestone: (sectionId: string) => void;
  onOpenMilestone: (milestone: Milestone) => void;
  onRenameSection: (section: Section) => void;
  onMoveSection: (sectionId: string, dir: -1 | 1) => void;
  onDeleteSection: (section: Section) => void;
};

export function SectionLane({
  section,
  window,
  milestones,
  density,
  sectionIndex,
  sectionCount,
  onAddMilestone,
  onOpenMilestone,
  onRenameSection,
  onMoveSection,
  onDeleteSection,
}: Props) {
  const inWindow = milestonesForSection(section.id, milestones, window);
  const totalCount = milestones.filter((milestone) => milestone.sectionId === section.id).length;
  const sectionColor = getSectionColor(section.color);
  const colorStyle = {
    "--section-color": sectionColor.swatch,
    "--section-color-soft": sectionColor.soft,
    "--section-color-border": sectionColor.border,
    "--section-color-ink": sectionColor.ink,
  } as CSSProperties;

  return (
    <div
      style={colorStyle}
      className={cn(
        "group grid min-h-0 flex-1 grid-cols-[184px_minmax(0,1fr)] border-b border-border/60 transition-colors last:border-b-0 hover:bg-secondary/20 md:grid-cols-[232px_minmax(0,1fr)]",
      )}
    >
      <div
        className={cn(
          "relative flex min-h-0 border-r border-border/60 bg-card px-3 md:px-5",
          density === "comfortable" && "flex-col justify-between gap-2 py-3",
          density === "compact" && "flex-col justify-between gap-1 py-2",
          density === "dense" && "flex-row items-center justify-between gap-2 py-1",
        )}
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-1"
          style={{ backgroundColor: sectionColor.swatch }}
        />
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/5"
              style={{ backgroundColor: sectionColor.swatch }}
            />
            <div className="truncate font-display text-[13px] font-medium text-primary md:text-[15px]">
              {section.title}
            </div>
          </div>
          {density !== "dense" && (
            <div className="truncate text-[11px] text-muted-foreground">
              {totalCount} milestones
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-1 md:gap-2">
          <Button
            variant="ghost"
            size={density === "dense" ? "icon" : "sm"}
            className={cn(
              "h-7 text-muted-foreground hover:text-primary",
              density === "dense" ? "w-7" : "px-2",
            )}
            onClick={() => onAddMilestone(section.id)}
            aria-label={`Add milestone to ${section.title}`}
          >
            <Plus className="h-4 w-4" />
            {density !== "dense" && "Add"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                aria-label={`Section actions for ${section.title}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onRenameSection(section)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit section
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMoveSection(section.id, -1)}
                disabled={sectionIndex === 0}
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMoveSection(section.id, 1)}
                disabled={sectionIndex === sectionCount - 1}
              >
                <ArrowDown className="mr-2 h-4 w-4" />
                Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteSection(section)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative min-w-0">
        <TimelineGrid window={window} />
        <MilestoneLayer
          window={window}
          items={inWindow}
          sectionColor={sectionColor}
          onOpen={onOpenMilestone}
        />
        {inWindow.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <div className="rounded-md border border-dashed border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
              No milestones
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
