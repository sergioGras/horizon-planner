import { format, isSameDay, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/lib/roadmap-store";
import { groupMilestones, type TimeWindow } from "@/lib/roadmap-view";

type Props = {
  window: TimeWindow;
  items: Milestone[];
  onOpen: (milestone: Milestone) => void;
};

export function MilestoneLayer({ window, items, onOpen }: Props) {
  const groups = groupMilestones(items, window);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center px-1 py-2">
      <div className="relative h-full w-full">
        {groups.map((group, index) =>
          group.items.length === 1 ? (
            <MilestoneChip
              key={group.items[0].id}
              milestone={group.items[0]}
              offsetPct={group.offsetPct}
              onClick={() => onOpen(group.items[0])}
            />
          ) : (
            <ClusterChip
              key={`cluster-${index}`}
              items={group.items}
              offsetPct={group.offsetPct}
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
  const isIntention = milestone.type === "intention";

  return (
    <button
      onClick={onClick}
      className={cn(
        "pointer-events-auto absolute top-1/2 max-w-[220px] -translate-x-2 -translate-y-1/2",
        "inline-flex items-center gap-2 rounded-md py-1.5 pl-2 pr-3 text-left",
        "transition-transform hover:scale-[1.01]",
        isIntention
          ? "border border-dashed border-border/80 bg-secondary/30 text-muted-foreground shadow-none hover:bg-secondary/45"
          : "border border-border/80 bg-card text-primary shadow-sm hover:shadow-md",
      )}
      style={{ left: `${offsetPct}%` }}
      title={`${milestone.title} - ${format(date, "PPP")}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          isToday ? "bg-[var(--highlight)]" : isIntention ? "bg-muted-foreground/50" : "bg-primary",
        )}
      />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium md:text-[12.5px]">
          {milestone.title}
        </span>
        <span className="block text-[9px] uppercase tracking-[0.14em] opacity-70 md:text-[10px]">
          {milestone.type === "intention" ? "Intention" : "Commitment"}
        </span>
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
  onOpen: (milestone: Milestone) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "pointer-events-auto absolute top-1/2 -translate-x-2 -translate-y-1/2",
            "inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-primary-foreground shadow-sm",
            "transition-transform hover:scale-[1.01] hover:shadow-md",
          )}
          style={{ left: `${offsetPct}%` }}
        >
          <span className="text-[12px] font-medium">{items.length} milestones</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Cluster - {items.length} items
        </div>
        <div className="flex flex-col">
          {items.map((milestone) => (
            <button
              key={milestone.id}
              onClick={() => onOpen(milestone)}
              className="rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/60"
            >
              <div className="truncate text-sm font-medium text-primary">{milestone.title}</div>
              <div className="text-xs text-muted-foreground">
                {format(parseISO(milestone.date), "PPP")}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
