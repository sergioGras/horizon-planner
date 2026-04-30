import { parseISO } from "date-fns";
import type { Milestone, Section } from "./roadmap-store";
import { dateOffsetPct, isInWindow, type TimeWindow } from "./timeline";

export function orderSections(sections: Section[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function milestonesForSection(
  sectionId: string,
  milestones: Milestone[],
  window: TimeWindow,
) {
  return milestones
    .filter((milestone) => milestone.sectionId === sectionId)
    .filter((milestone) => isInWindow(parseISO(milestone.date), window))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function groupMilestones(items: Milestone[], window: TimeWindow, thresholdPct = 4.5) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { offsetPct: number; items: Milestone[] }[] = [];

  for (const milestone of sorted) {
    const offsetPct = dateOffsetPct(parseISO(milestone.date), window);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && offsetPct - lastGroup.offsetPct < thresholdPct) {
      lastGroup.items.push(milestone);
      lastGroup.offsetPct =
        (lastGroup.offsetPct * (lastGroup.items.length - 1) + offsetPct) / lastGroup.items.length;
      continue;
    }

    groups.push({ offsetPct, items: [milestone] });
  }

  return groups;
}
