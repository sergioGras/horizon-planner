import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toLocalISODate, todayISO } from "./date-utils";

export type Section = {
  id: string;
  title: string;
  order: number;
};

export type MilestoneType = "commitment" | "intention";

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  sectionId: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  type?: MilestoneType;
};

export type TimeScale = "month" | "quarter";

type RoadmapState = {
  sections: Section[];
  milestones: Milestone[];
  scale: TimeScale;
  /** anchor date for the current viewing window (ISO) */
  anchor: string;

  setScale: (s: TimeScale) => void;
  setAnchor: (iso: string) => void;

  addSection: (title: string) => void;
  renameSection: (id: string, title: string) => void;
  deleteSection: (id: string) => void;
  moveSection: (id: string, dir: -1 | 1) => void;

  addMilestone: (m: Omit<Milestone, "id">) => void;
  updateMilestone: (id: string, patch: Partial<Omit<Milestone, "id">>) => void;
  deleteMilestone: (id: string) => void;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const iso = (d: Date) => toLocalISODate(d);

const sectionTitles = [
  "TreePlet Core",
  "Learning",
  "Personal Strategic",
  "Optional / Sandbox",
] as const;

const seedSections: Section[] = [
  { id: "s-core", title: sectionTitles[0], order: 0 },
  { id: "s-learning", title: sectionTitles[1], order: 1 },
  { id: "s-personal", title: sectionTitles[2], order: 2 },
  { id: "s-optional", title: sectionTitles[3], order: 3 },
];

const seedMilestones: Milestone[] = [
  {
    id: uid(),
    title: "Connectivity Stabilization",
    description:
      "MQTT communication, certificates, reliable ingestion pipeline, and device connectivity stability.",
    sectionId: "s-core",
    date: "2026-05-31",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Backend Integration Loop",
    description: "Complete device → cloud → storage → validation loop.",
    sectionId: "s-core",
    date: "2026-06-30",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Full Device Loop Implementation",
    description: "Sensor reading, transmission cycle, and recovery cycle functioning end to end.",
    sectionId: "s-core",
    date: "2026-07-31",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Autonomous Device Optimization",
    description:
      "Power optimization, deep sleep behavior, battery efficiency, and long-duration stability.",
    sectionId: "s-core",
    date: "2026-09-30",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Integrated Prototype Build",
    description: "Hardware, enclosure, firmware, and backend integrated into a cohesive prototype.",
    sectionId: "s-core",
    date: "2026-11-15",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Pilot Preparation",
    description: "Validation and operational hardening toward deploy-ready status.",
    sectionId: "s-core",
    date: "2026-12-20",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Karpathy AI (Transformers / GPT)",
    description: "Complete videos, reproduce implementations, and build transformer intuition.",
    sectionId: "s-learning",
    date: "2026-06-15",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Circuits Fundamentals (Light)",
    description: "Light but continuous exposure to electronics fundamentals.",
    sectionId: "s-learning",
    date: "2026-05-01",
    type: "intention",
  },
  {
    id: uid(),
    title: "AWS Data Engineering Path",
    description: "Skill Builder path, labs, and practical cloud data engineering exposure.",
    sectionId: "s-learning",
    date: "2026-09-30",
    type: "commitment",
  },
  {
    id: uid(),
    title: "Learning Flex Slot",
    description: "Adaptive learning allocation based on TreePlet bottlenecks or strategic gaps.",
    sectionId: "s-learning",
    date: "2026-10-01",
    type: "intention",
  },
  {
    id: uid(),
    title: "DSA Practice (KPI)",
    description: "Maintain algorithmic fluency through low-frequency but consistent practice.",
    sectionId: "s-learning",
    date: "2026-04-01",
    type: "intention",
  },
  {
    id: uid(),
    title: "Housing & Car Exploration",
    description: "Research options, define constraints, and clarify strategic preferences.",
    sectionId: "s-personal",
    date: "2026-06-30",
    type: "intention",
  },
  {
    id: uid(),
    title: "Decision Modeling System",
    description: "Build a lightweight scenario-analysis tool for strategic personal decisions.",
    sectionId: "s-personal",
    date: "2026-08-31",
    type: "intention",
  },
  {
    id: uid(),
    title: "Financial & Scenario Analysis",
    description: "Evaluate long-term affordability and strategic trade-offs across decisions.",
    sectionId: "s-personal",
    date: "2026-09-30",
    type: "intention",
  },
  {
    id: uid(),
    title: "Decision Convergence",
    description: "Converge toward a final strategic direction.",
    sectionId: "s-personal",
    date: "2026-12-31",
    type: "intention",
  },
];

function normalizeSections(sections: Section[]) {
  return [...sections]
    .map((section, index) => ({
      id: section.id,
      title: section.title?.trim() || "Untitled",
      order: Number.isFinite(section.order) ? section.order : index,
    }))
    .sort((a, b) => a.order - b.order)
    .map((section, order) => ({ ...section, order }));
}

function normalizeMilestone(milestone: Milestone): Milestone {
  return {
    ...milestone,
    title: milestone.title.trim() || "Untitled milestone",
    description: milestone.description?.trim() || undefined,
  };
}

function normalizeMilestones(milestones: Milestone[]) {
  return milestones.map(normalizeMilestone);
}

export const useRoadmap = create<RoadmapState>()(
  persist(
    (set) => ({
      sections: seedSections,
      milestones: seedMilestones,
      scale: "quarter",
      anchor: todayISO(),

      setScale: (s) => set({ scale: s }),
      setAnchor: (anchor) => set({ anchor }),

      addSection: (title) =>
        set((st) => ({
          sections: normalizeSections([
            ...st.sections,
            { id: uid(), title: title.trim() || "Untitled", order: st.sections.length },
          ]),
        })),
      renameSection: (id, title) =>
        set((st) => ({
          sections: st.sections.map((s) =>
            s.id === id ? { ...s, title: title.trim() || "Untitled" } : s,
          ),
        })),
      deleteSection: (id) =>
        set((st) => ({
          sections: normalizeSections(st.sections.filter((s) => s.id !== id)),
          milestones: st.milestones.filter((m) => m.sectionId !== id),
        })),
      moveSection: (id, dir) =>
        set((st) => {
          const i = st.sections.findIndex((s) => s.id === id);
          if (i < 0) return st;
          const j = i + dir;
          if (j < 0 || j >= st.sections.length) return st;
          const next = st.sections.slice();
          [next[i], next[j]] = [next[j], next[i]];
          return { sections: normalizeSections(next) };
        }),

      addMilestone: (m) =>
        set((st) => ({
          milestones: normalizeMilestones([...st.milestones, { ...m, id: uid() }]),
        })),
      updateMilestone: (id, patch) =>
        set((st) => ({
          milestones: normalizeMilestones(
            st.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          ),
        })),
      deleteMilestone: (id) =>
        set((st) => ({ milestones: st.milestones.filter((m) => m.id !== id) })),
    }),
    {
      name: "roadmap-v1",
      version: 2,
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return window.localStorage;
        const noop: Storage = {
          length: 0,
          clear: () => {},
          getItem: () => null,
          key: () => null,
          removeItem: () => {},
          setItem: () => {},
        };
        return noop;
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<RoadmapState> & {
          sections?: Array<{ id: string; name?: string; title?: string; order?: number }>;
          milestones?: Array<Partial<Milestone> & { id: string }>;
        };

        const sections = state.sections?.length
          ? normalizeSections(
              state.sections.map((section, index) => ({
                id: section.id,
                title: section.title ?? section.name ?? "Untitled",
                order: section.order ?? index,
              })),
            )
          : seedSections;

        const milestones = state.milestones?.length
          ? normalizeMilestones(
              state.milestones.map((milestone) => ({
                id: milestone.id,
                title: milestone.title ?? "Untitled milestone",
                description: milestone.description,
                sectionId: milestone.sectionId ?? sections[0]?.id ?? "s-core",
                date: milestone.date ?? iso(new Date()),
                type: milestone.type,
              })),
            )
          : seedMilestones;

        return {
          ...state,
          sections,
          milestones,
          scale: state.scale ?? "quarter",
          anchor: state.anchor ?? todayISO(),
        } as RoadmapState;
      },
      partialize: (state) => ({
        sections: state.sections,
        milestones: state.milestones,
        scale: state.scale,
        anchor: state.anchor,
      }),
    },
  ),
);
