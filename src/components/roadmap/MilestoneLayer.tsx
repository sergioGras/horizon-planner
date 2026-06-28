import { useEffect, useRef, useState, type CSSProperties } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDateFnsLocale, useShellCopy } from "@/lib/app-locale";
import type { Milestone } from "@/lib/roadmap-store";
import { groupMilestones } from "@/lib/roadmap-view";
import type { SectionColor } from "@/lib/section-colors";
import { dateOffsetPct, type TimeWindow } from "@/lib/timeline";

type Props = {
  window: TimeWindow;
  items: Milestone[];
  sectionColor: SectionColor;
  onOpen: (milestone: Milestone) => void;
};

export function MilestoneLayer({ window, items, sectionColor, onOpen }: Props) {
  const copy = useShellCopy();
  const dateLocale = useDateFnsLocale();
  const layerRef = useRef<HTMLDivElement>(null);
  const [layerHeight, setLayerHeight] = useState(0);
  const groups = groupMilestones(items, window);
  const stackCapacity = getStackCapacity(layerHeight);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const observer = new ResizeObserver(([entry]) => {
      setLayerHeight(entry.contentRect.height);
    });

    observer.observe(layer);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center px-1 py-2">
      <div ref={layerRef} className="relative h-full w-full">
        {groups.map((group, index) => {
          if (group.items.length > stackCapacity) {
            return (
              <ClusterChip
                key={`cluster-${index}`}
                items={group.items}
                offsetPct={group.offsetPct}
                sectionColor={sectionColor}
                copy={copy}
                onOpen={onOpen}
              />
            );
          }

          return group.items.map((milestone, stackIndex) => (
            <MilestoneChip
              key={milestone.id}
              milestone={milestone}
              offsetPct={dateOffsetPct(parseISO(milestone.date), window)}
              stackIndex={stackIndex}
              stackCount={group.items.length}
              compact={window.scale === "year"}
              sectionColor={sectionColor}
              copy={copy}
              dateLocale={dateLocale}
              onClick={() => onOpen(milestone)}
            />
          ));
        })}
      </div>
    </div>
  );
}

function MilestoneChip({
  milestone,
  offsetPct,
  stackIndex,
  stackCount,
  compact,
  sectionColor,
  copy,
  dateLocale,
  onClick,
}: {
  milestone: Milestone;
  offsetPct: number;
  stackIndex: number;
  stackCount: number;
  compact: boolean;
  sectionColor: SectionColor;
  copy: ReturnType<typeof useShellCopy>;
  dateLocale: ReturnType<typeof useDateFnsLocale>;
  onClick: () => void;
}) {
  const date = parseISO(milestone.date);
  const isToday = isSameDay(date, new Date());
  const isIntention = milestone.type === "intention";

  return (
    <button
      onClick={onClick}
      className={cn(
        "pointer-events-auto absolute -translate-x-2 -translate-y-1/2",
        "inline-flex items-center gap-2 rounded-md text-left",
        "transition-transform hover:scale-[1.01]",
        compact ? "max-w-[124px] py-1 pl-1.5 pr-2" : "max-w-[236px] py-1.5 pl-2 pr-3",
        isIntention
          ? "border border-dashed shadow-none"
          : "border bg-card text-primary shadow-sm hover:shadow-md",
      )}
      style={
        {
          left: `${offsetPct}%`,
          top: `${getStackTop(stackIndex, stackCount)}%`,
          backgroundColor: isIntention ? "var(--card)" : undefined,
          backgroundImage: isIntention
            ? `repeating-linear-gradient(
                135deg,
                transparent 0 5px,
                color-mix(in oklch, ${sectionColor.border} 34%, transparent) 5px 6px
              )`
            : undefined,
          borderColor: sectionColor.border,
          color: isIntention ? sectionColor.ink : undefined,
          "--section-color": sectionColor.swatch,
          "--section-color-soft": sectionColor.soft,
          "--section-color-border": sectionColor.border,
          "--section-color-ink": sectionColor.ink,
        } as CSSProperties
      }
      title={`${milestone.title} - ${format(date, "PPP", { locale: dateLocale })}`}
    >
      <span
        className={cn(compact ? "h-1.5 w-1.5" : "h-1.5 w-1.5", "shrink-0 rounded-full")}
        style={{
          backgroundColor: isToday
            ? "var(--highlight)"
            : isIntention
              ? sectionColor.border
              : sectionColor.swatch,
        }}
      />
      <span className="min-w-0">
        {!compact && (
          <Badge
            variant="outline"
            className={cn(
              "mb-1 h-4 border px-1.5 py-0 text-[9px] font-medium uppercase tracking-[0.14em]",
              isIntention
                ? "border-dashed bg-transparent"
                : "bg-white/70 text-primary/80 dark:bg-background/60",
            )}
            style={{
              borderColor: isIntention ? sectionColor.border : sectionColor.soft,
              color: sectionColor.ink,
              backgroundColor: isIntention
                ? "color-mix(in oklch, var(--card) 88%, transparent)"
                : undefined,
            }}
          >
            {isIntention ? copy.timeline.intentionLabel : copy.timeline.commitmentLabel}
          </Badge>
        )}
        <span
          className={cn(
            "block truncate font-medium",
            compact ? "text-[10.5px] md:text-[11px]" : "text-[12px] md:text-[12.5px]",
          )}
        >
          {milestone.title}
        </span>
        {compact && (
          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.14em] opacity-70">
            {isIntention ? copy.timeline.intentionShort : copy.timeline.commitmentShort}
          </span>
        )}
      </span>
    </button>
  );
}

function getStackCapacity(height: number) {
  if (height >= 176) return 4;
  if (height >= 132) return 3;
  if (height >= 88) return 2;
  return 1;
}

function getStackTop(index: number, count: number) {
  if (count <= 1) return 50;
  const spread = count === 2 ? 26 : count === 4 ? 21 : 24;
  const start = 50 - ((count - 1) * spread) / 2;
  return start + index * spread;
}

function ClusterChip({
  items,
  offsetPct,
  sectionColor,
  copy,
  onOpen,
}: {
  items: Milestone[];
  offsetPct: number;
  sectionColor: SectionColor;
  copy: ReturnType<typeof useShellCopy>;
  onOpen: (milestone: Milestone) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "pointer-events-auto absolute top-1/2 -translate-x-2 -translate-y-1/2",
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 shadow-sm",
            "transition-transform hover:scale-[1.01] hover:shadow-md",
          )}
          style={{
            left: `${offsetPct}%`,
            backgroundColor: sectionColor.ink,
            borderColor: sectionColor.border,
            color: "var(--primary-foreground)",
          }}
        >
          <span className="text-[12px] font-medium">
            {copy.timeline.clusterItems(items.length)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {copy.timeline.clusterTitle(items.length)}
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
