import type { CSSProperties } from "react";
import { useShellCopy } from "@/lib/app-locale";
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
  onOpenMilestone: (milestone: Milestone) => void;
};

export function ReadOnlySectionLane({ section, window, milestones, onOpenMilestone }: Props) {
  const copy = useShellCopy();
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
      className="grid min-h-0 flex-1 grid-cols-[184px_minmax(0,1fr)] border-b border-border/60 last:border-b-0 md:grid-cols-[232px_minmax(0,1fr)]"
    >
      <div className="relative flex min-h-0 flex-col justify-center gap-1 border-r border-border/60 bg-card px-3 py-2 md:px-5">
        <div
          className="absolute bottom-0 left-0 top-0 w-1"
          style={{ backgroundColor: sectionColor.swatch }}
        />
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/5"
            style={{ backgroundColor: sectionColor.swatch }}
          />
          <div className="truncate font-display text-[12px] font-medium text-primary md:text-[15px]">
            {section.title}
          </div>
        </div>
        <div className="truncate pl-[18px] text-[11px] text-muted-foreground">
          {copy.sectionLane.milestonesCount(totalCount)}
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center">
            <div className="rounded-md border border-dashed border-border bg-card/80 px-3 py-1 text-[11px] text-muted-foreground">
              {copy.sectionLane.noMilestones}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
