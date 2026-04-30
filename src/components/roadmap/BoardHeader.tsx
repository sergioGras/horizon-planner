import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  windowLabel: string;
  windowRange: string;
  scale: "month" | "quarter";
  canCreateMilestone: boolean;
  onScaleChange: (scale: "month" | "quarter") => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddMilestone: () => void;
};

export function BoardHeader({
  windowLabel,
  windowRange,
  scale,
  canCreateMilestone,
  onScaleChange,
  onPrevious,
  onNext,
  onToday,
  onAddMilestone,
}: Props) {
  return (
    <header className="h-14 shrink-0 border-b border-border/70 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="font-display text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Roadmap
          </div>
          <div className="hidden h-5 w-px bg-border/80 sm:block" />
          <div className="flex min-w-0 items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Previous window" onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[136px] px-1 text-center font-display text-sm font-medium text-primary md:min-w-[170px] md:text-base">
              {windowLabel}
            </div>
            <Button variant="ghost" size="icon" aria-label="Next window" onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="hidden text-xs text-muted-foreground md:block">{windowRange}</div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onToday}>
            Today
          </Button>
          <ScaleToggle scale={scale} onChange={onScaleChange} />
          <Button onClick={onAddMilestone} className="rounded-md" disabled={!canCreateMilestone}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New milestone</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function ScaleToggle({
  scale,
  onChange,
}: {
  scale: "month" | "quarter";
  onChange: (s: "month" | "quarter") => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {(["month", "quarter"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={scale === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-8 rounded-[5px] px-3 text-xs font-medium capitalize transition-colors",
            scale === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
