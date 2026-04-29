import { useMemo, useState } from "react";
import { parseISO, format, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRoadmap, type Milestone, type Section } from "@/lib/roadmap-store";
import {
  dateOffsetPct,
  getWindow,
  isInWindow,
  shiftAnchor,
  type TimeWindow,
} from "@/lib/timeline";
import { MilestoneDialog } from "./MilestoneDialog";
import { SectionDialog } from "./SectionDialog";
import { ConfirmDialog } from "./ConfirmDialog";

const RAIL_WIDTH = 232; // px
const ROW_MIN_HEIGHT = 92;
const ROW_DENSE_HEIGHT = 64;

export function Board() {
  const sections = useRoadmap((s) => s.sections);
  const milestones = useRoadmap((s) => s.milestones);
  const scale = useRoadmap((s) => s.scale);
  const anchor = useRoadmap((s) => s.anchor);
  const setScale = useRoadmap((s) => s.setScale);
  const setAnchor = useRoadmap((s) => s.setAnchor);
  const addSection = useRoadmap((s) => s.addSection);
  const renameSection = useRoadmap((s) => s.renameSection);
  const deleteSection = useRoadmap((s) => s.deleteSection);
  const moveSection = useRoadmap((s) => s.moveSection);

  const anchorDate = useMemo(() => parseISO(anchor), [anchor]);
  const win = useMemo(() => getWindow(anchorDate, scale), [anchorDate, scale]);
  const today = new Date();

  // Dialog state
  const [milestoneDialog, setMilestoneDialog] = useState<{
    open: boolean;
    milestone?: Milestone;
    defaultSectionId?: string;
  }>({ open: false });
  const [sectionAddOpen, setSectionAddOpen] = useState(false);
  const [sectionRename, setSectionRename] = useState<Section | null>(null);
  const [sectionDelete, setSectionDelete] = useState<Section | null>(null);

  const rowHeight = sections.length > 6 ? ROW_DENSE_HEIGHT : ROW_MIN_HEIGHT;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-7 flex flex-col gap-5">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Roadmap
              </div>
              <h1 className="font-display text-3xl md:text-4xl tracking-tight text-primary">
                Strategic Timeline
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ScaleToggle scale={scale} onChange={setScale} />
              <Button
                onClick={() => setMilestoneDialog({ open: true })}
                className="rounded-md"
                disabled={sections.length === 0}
              >
                <Plus className="h-4 w-4" />
                New milestone
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous"
                onClick={() => setAnchor(shiftAnchor(anchorDate, scale, -1).toISOString().slice(0, 10))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-display text-base md:text-lg tracking-tight px-2 min-w-[160px] text-center">
                {win.label}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next"
                onClick={() => setAnchor(shiftAnchor(anchorDate, scale, 1).toISOString().slice(0, 10))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-muted-foreground"
                onClick={() => setAnchor(new Date().toISOString().slice(0, 10))}
              >
                Today
              </Button>
            </div>
            <div className="text-xs text-muted-foreground hidden md:block">
              {format(win.start, "MMM d, yyyy")} — {format(win.end, "MMM d, yyyy")}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-[1400px] px-6 lg:px-10 py-8">
        {sections.length === 0 ? (
          <EmptyBoard onAdd={() => setSectionAddOpen(true)} />
        ) : (
          <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
            {/* Axis */}
            <div className="flex border-b border-border/70 bg-secondary/40">
              <div
                className="shrink-0 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                style={{ width: RAIL_WIDTH }}
              >
                Sections
              </div>
              <div className="flex-1 relative overflow-hidden">
                <Axis win={win} />
              </div>
            </div>

            {/* Rows */}
            <div>
              {sections.map((section, idx) => {
                const inWindow = milestones
                  .filter((m) => m.sectionId === section.id)
                  .filter((m) => isInWindow(parseISO(m.date), win))
                  .sort((a, b) => a.date.localeCompare(b.date));
                return (
                  <div
                    key={section.id}
                    className={cn(
                      "flex border-b border-border/60 last:border-b-0 group",
                      "hover:bg-secondary/20 transition-colors",
                    )}
                    style={{ minHeight: rowHeight }}
                  >
                    <div
                      className="shrink-0 px-5 py-4 flex items-start justify-between gap-2 border-r border-border/60"
                      style={{ width: RAIL_WIDTH }}
                    >
                      <div>
                        <div className="font-display text-[15px] tracking-tight text-primary">
                          {section.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {milestones.filter((m) => m.sectionId === section.id).length} milestones
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setSectionRename(section)}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => moveSection(section.id, -1)}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="mr-2 h-4 w-4" /> Move up
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => moveSection(section.id, 1)}
                            disabled={idx === sections.length - 1}
                          >
                            <ArrowDown className="mr-2 h-4 w-4" /> Move down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setSectionDelete(section)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex-1 relative">
                      <RowGrid win={win} />
                      <RowMilestones
                        win={win}
                        items={inWindow}
                        onOpen={(m) => setMilestoneDialog({ open: true, milestone: m })}
                      />
                      {inWindow.length === 0 && (
                        <button
                          onClick={() =>
                            setMilestoneDialog({ open: true, defaultSectionId: section.id })
                          }
                          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-muted-foreground"
                        >
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-border bg-card">
                            <Plus className="h-3.5 w-3.5" /> Add milestone
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add section row */}
              <div className="flex">
                <div
                  className="shrink-0 px-3 py-3 border-r border-border/60"
                  style={{ width: RAIL_WIDTH }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-primary"
                    onClick={() => setSectionAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Add section
                  </Button>
                </div>
                <div className="flex-1" />
              </div>
            </div>
          </div>
        )}

        {/* Today line marker (info text) */}
        {sections.length > 0 && isInWindow(today, win) && (
          <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--highlight)]" />
            Today — {format(today, "PPP")}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <MilestoneDialog
        open={milestoneDialog.open}
        onOpenChange={(o) => setMilestoneDialog((s) => ({ ...s, open: o }))}
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
        onOpenChange={(o) => !o && setSectionRename(null)}
        title="Rename section"
        confirmLabel="Save"
        initialName={sectionRename?.name ?? ""}
        onSubmit={(name) => sectionRename && renameSection(sectionRename.id, name)}
      />
      <ConfirmDialog
        open={!!sectionDelete}
        onOpenChange={(o) => !o && setSectionDelete(null)}
        title={`Delete "${sectionDelete?.name}"?`}
        description="All milestones in this section will also be deleted. This cannot be undone."
        confirmLabel="Delete section"
        destructive
        onConfirm={() => {
          if (sectionDelete) deleteSection(sectionDelete.id);
          setSectionDelete(null);
        }}
      />
    </div>
  );
}

/* ---------------- subcomponents ---------------- */

function ScaleToggle({
  scale,
  onChange,
}: {
  scale: "month" | "quarter";
  onChange: (s: "month" | "quarter") => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {(["month", "quarter"] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "px-3 h-8 text-xs font-medium rounded-[5px] transition-colors capitalize",
            scale === s
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function Axis({ win }: { win: TimeWindow }) {
  const today = new Date();
  const todayInside = isInWindow(today, win);
  return (
    <div className="relative h-12">
      {win.ticks.map((t, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 flex items-end pb-2 pl-3 border-l border-border/60 first:border-l-0"
          style={{ left: `${t.offsetPct}%`, width: `${t.widthPct}%` }}
        >
          <span
            className={cn(
              "text-[11px] uppercase tracking-[0.14em]",
              t.isMajor ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            {t.isMajor ? t.label : `Wk · ${t.label}`}
          </span>
        </div>
      ))}
      {todayInside && (
        <div
          className="absolute top-1 bottom-0 w-px bg-[var(--highlight)]"
          style={{ left: `${dateOffsetPct(today, win)}%` }}
        >
          <span className="absolute -top-0.5 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] text-[var(--highlight)] font-medium">
            Today
          </span>
        </div>
      )}
    </div>
  );
}

function RowGrid({ win }: { win: TimeWindow }) {
  const today = new Date();
  return (
    <div className="absolute inset-0 pointer-events-none">
      {win.ticks.map((t, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-border/40 first:border-l-0"
          style={{ left: `${t.offsetPct}%` }}
        />
      ))}
      {isInWindow(today, win) && (
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--highlight)]/50"
          style={{ left: `${dateOffsetPct(today, win)}%` }}
        />
      )}
    </div>
  );
}

/** Cluster threshold in % of row width. Items closer than this collapse. */
const CLUSTER_THRESHOLD_PCT = 4.5;

function clusterMilestones(items: Milestone[], win: TimeWindow) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { offsetPct: number; items: Milestone[] }[] = [];
  for (const m of sorted) {
    const off = dateOffsetPct(parseISO(m.date), win);
    const last = groups[groups.length - 1];
    if (last && off - last.offsetPct < CLUSTER_THRESHOLD_PCT) {
      last.items.push(m);
      // average the offset so the chip sits over the cluster
      last.offsetPct = (last.offsetPct * (last.items.length - 1) + off) / last.items.length;
    } else {
      groups.push({ offsetPct: off, items: [m] });
    }
  }
  return groups;
}

function RowMilestones({
  win,
  items,
  onOpen,
}: {
  win: TimeWindow;
  items: Milestone[];
  onOpen: (m: Milestone) => void;
}) {
  const groups = useMemo(() => clusterMilestones(items, win), [items, win]);
  return (
    <div className="absolute inset-0 px-1 py-3 flex items-center">
      <div className="relative w-full h-full">
        {groups.map((g, i) =>
          g.items.length === 1 ? (
            <MilestoneChip
              key={g.items[0].id}
              milestone={g.items[0]}
              offsetPct={g.offsetPct}
              onClick={() => onOpen(g.items[0])}
            />
          ) : (
            <ClusterChip
              key={`cluster-${i}`}
              items={g.items}
              offsetPct={g.offsetPct}
              onOpen={onOpen}
            />
          ),
        )}
      </div>
    </div>
  );
}

function MilestoneChip({
  milestone,
  offsetPct,
  onClick,
}: {
  milestone: Milestone;
  offsetPct: number;
  onClick: () => void;
}) {
  const date = parseISO(milestone.date);
  const isToday = isSameDay(date, new Date());
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 -translate-x-2 max-w-[180px]",
        "inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md",
        "bg-card border border-border/80 shadow-sm hover:shadow-md hover:-translate-y-[calc(50%+1px)]",
        "transition-all text-left",
      )}
      style={{ left: `${offsetPct}%` }}
      title={`${milestone.title} · ${format(date, "PPP")}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          isToday ? "bg-[var(--highlight)]" : "bg-primary",
        )}
      />
      <span className="text-[12.5px] font-medium text-primary truncate">
        {milestone.title}
      </span>
    </button>
  );
}

function ClusterChip({
  items,
  offsetPct,
  onOpen,
}: {
  items: Milestone[];
  offsetPct: number;
  onOpen: (m: Milestone) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute top-1/2 -translate-y-1/2 -translate-x-2 inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-md bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all"
          style={{ left: `${offsetPct}%` }}
        >
          <span className="text-[12.5px] font-medium">{items.length} milestones</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground px-2 pt-1 pb-2">
          Cluster · {items.length} items
        </div>
        <div className="flex flex-col">
          {items.map((m) => (
            <button
              key={m.id}
              onClick={() => onOpen(m)}
              className="text-left px-2 py-2 rounded-md hover:bg-secondary/60 transition-colors"
            >
              <div className="text-sm font-medium text-primary truncate">{m.title}</div>
              <div className="text-xs text-muted-foreground">
                {format(parseISO(m.date), "PPP")}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmptyBoard({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-dashed border-border/70 rounded-lg py-24 px-8 text-center bg-card">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Empty roadmap
      </div>
      <h2 className="font-display text-2xl tracking-tight text-primary">
        Start with your first section
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
        Sections are the swimlanes of your roadmap — workstreams, projects, or themes you want to plan against.
      </p>
      <Button onClick={onAdd} className="mt-6">
        <Plus className="h-4 w-4" />
        Create first section
      </Button>
    </div>
  );
}