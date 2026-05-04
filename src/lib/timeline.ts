import {
  addDays,
  addMonths,
  addQuarters,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { enUS, type Locale as DateFnsLocale } from "date-fns/locale";
import type { TimeScale } from "./roadmap-store";

export type TimeWindow = {
  start: Date;
  end: Date;
  activeEnd: Date;
  scale: TimeScale;
  label: string;
  /** number of days in window */
  days: number;
  /** secondary unit ticks (e.g. months in quarter, weeks in month) */
  ticks: {
    label: string;
    offsetPct: number;
    widthPct: number;
    isMajor?: boolean;
    isLookahead?: boolean;
  }[];
};

export function getWindow(
  anchor: Date,
  scale: TimeScale,
  locale: DateFnsLocale = enUS,
): TimeWindow {
  if (scale === "year") {
    const start = startOfYear(anchor);
    const activeEnd = endOfYear(anchor);
    const end = endOfMonth(addMonths(activeEnd, 1));
    const days = differenceInCalendarDays(end, start) + 1;
    const ticks = Array.from({ length: 13 }, (_, i) => {
      const monthStart = addMonths(start, i);
      const monthEnd = endOfMonth(monthStart);
      const offset = differenceInCalendarDays(monthStart, start);
      const width = differenceInCalendarDays(monthEnd, monthStart) + 1;
      return {
        label: format(monthStart, "MMM", { locale }),
        offsetPct: (offset / days) * 100,
        widthPct: (width / days) * 100,
        isMajor: true,
        isLookahead: i === 12,
      };
    });

    return {
      start,
      end,
      activeEnd,
      scale,
      days,
      label: format(start, "yyyy", { locale }),
      ticks,
    };
  }

  if (scale === "quarter") {
    const start = startOfQuarter(anchor);
    const activeEnd = endOfQuarter(anchor);
    const end = endOfMonth(addMonths(activeEnd, 1));
    const days = differenceInCalendarDays(end, start) + 1;
    const ticks = [0, 1, 2, 3].map((i) => {
      const monthStart = addMonths(start, i);
      const monthEnd = endOfMonth(monthStart);
      const offset = differenceInCalendarDays(monthStart, start);
      const width = differenceInCalendarDays(monthEnd, monthStart) + 1;
      return {
        label: format(monthStart, "MMMM", { locale }),
        offsetPct: (offset / days) * 100,
        widthPct: (width / days) * 100,
        isMajor: true,
        isLookahead: i === 3,
      };
    });
    return {
      start,
      end,
      activeEnd,
      scale,
      days,
      label: `Q${Math.floor(start.getMonth() / 3) + 1} ${format(start, "yyyy", { locale })}`,
      ticks,
    };
  }

  const start = startOfMonth(anchor);
  const activeEnd = endOfMonth(anchor);
  const end = addDays(activeEnd, 7);
  const days = differenceInCalendarDays(end, start) + 1;
  const ticks: TimeWindow["ticks"] = [];
  let cursor = start;

  while (cursor <= end) {
    const weekEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const offset = differenceInCalendarDays(cursor, start);
    const width = differenceInCalendarDays(weekEnd, cursor) + 1;
    ticks.push({
      label: format(cursor, "d", { locale }),
      offsetPct: (offset / days) * 100,
      widthPct: (width / days) * 100,
      isLookahead: cursor > activeEnd,
    });
    cursor = addDays(cursor, 7);
  }

  return {
    start,
    end,
    activeEnd,
    scale,
    days,
    label: format(start, "MMMM yyyy", { locale }),
    ticks,
  };
}

export function shiftAnchor(anchor: Date, scale: TimeScale, dir: -1 | 1) {
  if (scale === "year") return addYears(anchor, dir);
  return scale === "quarter" ? addQuarters(anchor, dir) : addMonths(anchor, dir);
}

export function dateOffsetPct(date: Date, w: TimeWindow): number {
  const off = differenceInCalendarDays(date, w.start);
  return (off / w.days) * 100;
}

export function isInWindow(date: Date, w: TimeWindow) {
  return date >= w.start && date <= w.end;
}
