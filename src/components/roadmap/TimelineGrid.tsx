import { cn } from "@/lib/utils";
import { dateOffsetPct, isInWindow, type TimeWindow } from "@/lib/timeline";

type Props = {
  window: TimeWindow;
};

export function TimelineGrid({ window }: Props) {
  const today = new Date();

  return (
    <div className="pointer-events-none absolute inset-0">
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
