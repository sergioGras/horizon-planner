import {
  addDays,
  addMonths,
  addQuarters,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  format,
  startOfMonth,
  startOfQuarter,
} from "date-fns";
import type { TimeScale } from "./roadmap-store";

export type TimeWindow = {
  start: Date;
  end: Date;
  label: string;
  /** number of days in window */
  days: number;
  /** secondary unit ticks (e.g. months in quarter, weeks in month) */
  ticks: { label: string; offsetPct: number; widthPct: number; isMajor?: boolean }[];
};

export function getWindow(anchor: Date, scale: TimeScale): TimeWindow {
  if (scale === "quarter") {
    const start = startOfQuarter(anchor);
    const end = endOfQuarter(anchor);
    const days = differenceInCalendarDays(end, start) + 1;
    const ticks = [0, 1, 2].map((i) => {
      const monthStart = addMonths(start, i);
      const monthEnd = endOfMonth(monthStart);
      const offset = differenceInCalendarDays(monthStart, start);
      const width = differenceInCalendarDays(monthEnd, monthStart) + 1;
      return {
        label: format(monthStart, "MMMM"),
        offsetPct: (offset / days) * 100,
        widthPct: (width / days) * 100,
        isMajor: true,
      };
    });
    return {
      start,
      end,
      days,
      label: `Q${Math.floor(start.getMonth() / 3) + 1} ${format(start, "yyyy")}`,
      ticks,
    };
  }
  // month scale — show a single month
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  const days = differenceInCalendarDays(end, start) + 1;
  // weekly ticks
  const ticks: TimeWindow["ticks"] = [];
  let cursor = start;
  while (cursor <= end) {
    const weekEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const offset = differenceInCalendarDays(cursor, start);
    const width = differenceInCalendarDays(weekEnd, cursor) + 1;
    ticks.push({
      label: format(cursor, "d"),
      offsetPct: (offset / days) * 100,
      widthPct: (width / days) * 100,
    });
    cursor = addDays(cursor, 7);
  }
  return {
    start,
    end,
    days,
    label: format(start, "MMMM yyyy"),
    ticks,
  };
}

export function shiftAnchor(anchor: Date, scale: TimeScale, dir: -1 | 1) {
  return scale === "quarter" ? addQuarters(anchor, dir) : addMonths(anchor, dir);
}

export function dateOffsetPct(date: Date, w: TimeWindow): number {
  const off = differenceInCalendarDays(date, w.start);
  return (off / w.days) * 100;
}

export function isInWindow(date: Date, w: TimeWindow) {
  return date >= w.start && date <= w.end;
}