import { useMemo, useRef, useState, type WheelEvent } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardHeader } from "./BoardHeader";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyBoard } from "./EmptyBoard";
import { MilestoneDialog } from "./MilestoneDialog";
import { SectionDialog } from "./SectionDialog";
import { SectionLane } from "./SectionLane";
import { TimelineAxis } from "./TimelineAxis";
import { useRoadmap, type Milestone, type Section } from "@/lib/roadmap-store";
import { orderSections } from "@/lib/roadmap-view";
import { getWindow, shiftAnchor } from "@/lib/timeline";
import { fromLocalISODate, toLocalISODate, todayISO } from "@/lib/date-utils";

const WHEEL_NAV_THRESHOLD = 36;
const WHEEL_NAV_COOLDOWN_MS = 650;

export function Board() {
  const sections = useRoadmap((state) => state.sections);
  const milestones = useRoadmap((state) => state.milestones);
  const scale = useRoadmap((state) => state.scale);
  const anchor = useRoadmap((state) => state.anchor);
  const setScale = useRoadmap((state) => state.setScale);
  const setAnchor = useRoadmap((state) => state.setAnchor);
  const addSection = useRoadmap((state) => state.addSection);
  const renameSection = useRoadmap((state) => state.renameSection);
  const deleteSection = useRoadmap((state) => state.deleteSection);
  const moveSection = useRoadmap((state) => state.moveSection);

  const orderedSections = useMemo(() => orderSections(sections), [sections]);
  const anchorDate = useMemo(() => fromLocalISODate(anchor), [anchor]);
  const window = useMemo(() => getWindow(anchorDate, scale), [anchorDate, scale]);
  const lastWheelNavigationAt = useRef(0);
  const laneDensity =
    orderedSections.length > 12 ? "dense" : orderedSections.length > 8 ? "compact" : "comfortable";

  const [milestoneDialog, setMilestoneDialog] = useState<{
    open: boolean;
    milestone?: Milestone;
    defaultSectionId?: string;
  }>({ open: false });
  const [sectionAddOpen, setSectionAddOpen] = useState(false);
  const [sectionRename, setSectionRename] = useState<Section | null>(null);
  const [sectionDelete, setSectionDelete] = useState<Section | null>(null);

  const windowRange = `${format(window.start, "MMM d, yyyy")} - ${format(window.end, "MMM d, yyyy")}`;

  function navigateWindow(direction: -1 | 1) {
    setAnchor(toLocalISODate(shiftAnchor(anchorDate, scale, direction)));
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.2;
    if (!horizontalIntent || Math.abs(event.deltaX) < WHEEL_NAV_THRESHOLD) return;

    event.preventDefault();

    const now = Date.now();
    if (now - lastWheelNavigationAt.current < WHEEL_NAV_COOLDOWN_MS) return;

    lastWheelNavigationAt.current = now;
    navigateWindow(event.deltaX > 0 ? 1 : -1);
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 w-full flex-col">
        <BoardHeader
          windowLabel={window.label}
          windowRange={windowRange}
          scale={scale}
          canCreateMilestone={orderedSections.length > 0}
          onScaleChange={setScale}
          onPrevious={() => navigateWindow(-1)}
          onNext={() => navigateWindow(1)}
          onToday={() => setAnchor(todayISO())}
          onAddMilestone={() => setMilestoneDialog({ open: true })}
        />

        <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 p-3 lg:p-4">
          {orderedSections.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyBoard onAddSection={() => setSectionAddOpen(true)} />
            </div>
          ) : (
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm"
              onWheel={handleWheel}
            >
              <div className="grid h-11 shrink-0 grid-cols-[184px_minmax(0,1fr)] border-b border-border/70 bg-secondary/35 md:grid-cols-[232px_minmax(0,1fr)]">
                <div className="border-r border-border/60 px-3 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:px-5">
                  Sections
                </div>
                <div className="relative min-w-0 overflow-hidden">
                  <TimelineAxis window={window} />
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col">
                  {orderedSections.map((section, index) => (
                    <SectionLane
                      key={section.id}
                      section={section}
                      window={window}
                      milestones={milestones}
                      density={laneDensity}
                      sectionIndex={index}
                      sectionCount={orderedSections.length}
                      onAddMilestone={(sectionId) =>
                        setMilestoneDialog({ open: true, defaultSectionId: sectionId })
                      }
                      onOpenMilestone={(milestone) => setMilestoneDialog({ open: true, milestone })}
                      onRenameSection={setSectionRename}
                      onMoveSection={moveSection}
                      onDeleteSection={setSectionDelete}
                    />
                  ))}
                </div>

                <div className="grid h-11 shrink-0 grid-cols-[184px_minmax(0,1fr)] md:grid-cols-[232px_minmax(0,1fr)]">
                  <div className="border-r border-border/60 bg-card px-3 py-2 md:px-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full justify-start text-muted-foreground hover:text-primary"
                      onClick={() => setSectionAddOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add section
                    </Button>
                  </div>
                  <div className="bg-card" />
                </div>
              </div>
            </div>
          )}
        </main>

        <MilestoneDialog
          open={milestoneDialog.open}
          onOpenChange={(open) => setMilestoneDialog((state) => ({ ...state, open }))}
          milestone={milestoneDialog.milestone}
          defaultSectionId={milestoneDialog.defaultSectionId}
        />
        <SectionDialog
          open={sectionAddOpen}
          onOpenChange={setSectionAddOpen}
          title="New section"
          confirmLabel="Create section"
          onSubmit={(name) => addSection(name)}
        />
        <SectionDialog
          open={!!sectionRename}
          onOpenChange={(open) => !open && setSectionRename(null)}
          title="Rename section"
          confirmLabel="Save"
          initialName={sectionRename?.title ?? ""}
          onSubmit={(name) => sectionRename && renameSection(sectionRename.id, name)}
        />
        <ConfirmDialog
          open={!!sectionDelete}
          onOpenChange={(open) => !open && setSectionDelete(null)}
          title={`Delete "${sectionDelete?.title}"?`}
          description="All milestones in this section will also be deleted. This cannot be undone."
          confirmLabel="Delete section"
          destructive
          onConfirm={() => {
            if (sectionDelete) deleteSection(sectionDelete.id);
            setSectionDelete(null);
          }}
        />
      </div>
    </div>
  );
}
