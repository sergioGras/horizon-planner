import { cn } from "@/lib/utils";
import { dateOffsetPct, isInWindow, type TimeWindow } from "@/lib/timeline";

type Props = {
  window: TimeWindow;
};

export function TimelineAxis({ window }: Props) {
  const today = new Date();
  const todayInside = isInWindow(today, window);

  return (
    <div className="relative h-full w-full">
      {window.ticks.map((tick, index) => (
        <div
          key={`${tick.label}-${index}`}
          className="absolute bottom-0 top-0 flex items-end border-l border-border/60 pb-2 pl-2 first:border-l-0 md:pl-3"
          style={{ left: `${tick.offsetPct}%`, width: `${tick.widthPct}%` }}
        >
          <span
            className={cn(
              "truncate text-[10px] uppercase tracking-[0.12em] md:text-[11px]",
              tick.isLookahead
                ? "text-muted-foreground/55"
                : tick.isMajor
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
            )}
          >
            {tick.isMajor ? tick.label : `Wk ${tick.label}`}
          </span>
        </div>
      ))}

      {todayInside && (
        <div
          className="absolute bottom-0 top-1 w-px bg-[var(--highlight)]"
          style={{ left: `${dateOffsetPct(today, window)}%` }}
        >
          <span className="absolute -top-0.5 -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--highlight)]">
            Today
          </span>
        </div>
      )}
    </div>
  );
}
