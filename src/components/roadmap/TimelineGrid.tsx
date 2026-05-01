import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { dateOffsetPct, isInWindow, type TimeWindow } from "@/lib/timeline";

type Props = {
  window: TimeWindow;
};

export function TimelineGrid({ window }: Props) {
  const today = new Date();
  const tailStartPct = dateOffsetPct(addDays(window.activeEnd, 1), window);

  return (
    <div className="pointer-events-none absolute inset-0">
      {window.activeEnd < window.end && (
        <div
          className="absolute bottom-0 top-0 border-l border-dashed border-border/70 bg-secondary/20"
          style={{ left: `${tailStartPct}%`, right: 0 }}
        />
      )}

      {window.ticks.map((tick, index) => (
        <div
          key={`${tick.label}-${index}`}
          className={cn(
            "absolute bottom-0 top-0 border-l border-border/40",
            index === 0 && "border-l-0",
          )}
          style={{ left: `${tick.offsetPct}%` }}
        />
      ))}

      {isInWindow(today, window) && (
        <div
          className="absolute bottom-0 top-0 w-px bg-[var(--highlight)]/55"
          style={{ left: `${dateOffsetPct(today, window)}%` }}
        />
      )}
    </div>
  );
}
