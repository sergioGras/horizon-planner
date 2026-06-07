import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDateFnsLocale, useShellCopy } from "@/lib/app-locale";
import { fromLocalISODate, todayISO, toLocalISODate } from "@/lib/date-utils";
import { fetchDisplayRoadmap, type DisplayRoadmap } from "@/lib/display-roadmap";
import type { Milestone, TimeScale } from "@/lib/roadmap-store";
import { orderSections } from "@/lib/roadmap-view";
import { getWindow, shiftAnchor } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import { ReadOnlySectionLane } from "./ReadOnlySectionLane";
import { TimelineAxis } from "./TimelineAxis";

const DATA_REFRESH_MS = 5 * 60 * 1000;
const CLOCK_REFRESH_MS = 60 * 1000;
const WHEEL_NAV_THRESHOLD = 36;
const WHEEL_NAV_COOLDOWN_MS = 650;

export function DisplayBoard({ token }: { token: string }) {
  const copy = useShellCopy();
  const dateLocale = useDateFnsLocale();
  const [roadmap, setRoadmap] = useState<DisplayRoadmap | null>(null);
  const [scale, setScale] = useState<TimeScale>("quarter");
  const [anchor, setAnchor] = useState(todayISO());
  const [clock, setClock] = useState(() => new Date());
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const viewportRef = useRef<HTMLElement>(null);
  const lastWheelNavigationAt = useRef(0);

  const anchorDate = useMemo(() => fromLocalISODate(anchor), [anchor]);
  const timeWindow = useMemo(
    () => getWindow(anchorDate, scale, dateLocale),
    [anchorDate, dateLocale, scale],
  );
  const orderedSections = useMemo(
    () => orderSections(roadmap?.sections ?? []),
    [roadmap?.sections],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadRoadmap(showLoading = false) {
      if (showLoading) setIsLoading(true);
      try {
        const nextRoadmap = await fetchDisplayRoadmap(token);
        if (!isMounted) return;
        setRoadmap(nextRoadmap);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load display roadmap.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadRoadmap(true);
    const dataTimer = window.setInterval(() => void loadRoadmap(), DATA_REFRESH_MS);
    const clockTimer = window.setInterval(() => setClock(new Date()), CLOCK_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(dataTimer);
      window.clearInterval(clockTimer);
    };
  }, [token]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const handleWheel = (event: WheelEvent) => {
      const horizontalDelta = Math.abs(event.deltaX);
      const verticalDelta = Math.abs(event.deltaY);
      const horizontalIntent =
        horizontalDelta > verticalDelta * 1.2 ||
        (event.shiftKey && verticalDelta > horizontalDelta);
      const movement = horizontalDelta || verticalDelta;
      if (!horizontalIntent || movement < WHEEL_NAV_THRESHOLD) return;

      event.preventDefault();
      const now = Date.now();
      if (now - lastWheelNavigationAt.current < WHEEL_NAV_COOLDOWN_MS) return;

      lastWheelNavigationAt.current = now;
      setAnchor(toLocalISODate(shiftAnchor(anchorDate, scale, event.deltaX > 0 ? 1 : -1)));
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [anchorDate, scale]);

  function navigateWindow(direction: -1 | 1) {
    setAnchor(toLocalISODate(shiftAnchor(anchorDate, scale, direction)));
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        {copy.board.loadingRoadmap}
      </div>
    );
  }

  if (!roadmap || error) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <div className="font-display text-lg font-medium text-primary">
            {copy.display.unavailableTitle}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? copy.display.invalidDescription}
          </p>
          <Button className="mt-5" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            {copy.display.retry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border/70 bg-background/95 px-3 py-2 backdrop-blur-sm md:px-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-medium text-primary md:text-base">
              {roadmap.project.title}
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {copy.display.readOnly} · {format(clock, "p", { locale: dateLocale })}
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigateWindow(-1)}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{copy.display.previousWindow}</span>
            </Button>
            <div className="min-w-[104px] text-center font-display text-sm font-medium text-primary md:min-w-[160px]">
              {timeWindow.label}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateWindow(1)}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{copy.display.nextWindow}</span>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              {(["month", "quarter", "year"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={scale === option}
                  onClick={() => setScale(option)}
                  className={cn(
                    "h-7 rounded-[5px] px-2 text-[11px] font-medium transition-colors",
                    scale === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  {option === "month"
                    ? copy.header.scaleMonth
                    : option === "quarter"
                      ? copy.header.scaleQuarter
                      : copy.header.scaleYear}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAnchor(todayISO())}>
              {copy.header.today}
            </Button>
          </div>
        </div>
      </header>

      <main ref={viewportRef} className="flex min-h-0 flex-1 overflow-x-auto p-2 md:p-3">
        <div className="flex min-h-0 min-w-[760px] flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm md:min-w-0">
          <div className="grid h-11 shrink-0 grid-cols-[184px_minmax(0,1fr)] border-b border-border/70 bg-secondary/35 md:grid-cols-[232px_minmax(0,1fr)]">
            <div className="border-r border-border/60 px-3 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:px-5">
              {copy.timeline.sectionsLabel}
            </div>
            <div className="relative min-w-0 overflow-hidden">
              <TimelineAxis window={timeWindow} />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {orderedSections.map((section) => (
              <ReadOnlySectionLane
                key={section.id}
                section={section}
                window={timeWindow}
                milestones={roadmap.milestones}
                onOpenMilestone={setSelectedMilestone}
              />
            ))}
          </div>
        </div>
      </main>

      <Dialog
        open={!!selectedMilestone}
        onOpenChange={(open) => !open && setSelectedMilestone(null)}
      >
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedMilestone?.title}</DialogTitle>
            <DialogDescription>
              {selectedMilestone
                ? format(fromLocalISODate(selectedMilestone.date), "PPP", { locale: dateLocale })
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedMilestone?.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {selectedMilestone.description}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
