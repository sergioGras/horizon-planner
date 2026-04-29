import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Section = {
  id: string;
  name: string;
};

export type Milestone = {
  id: string;
  title: string;
  description: string;
  sectionId: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
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

  addSection: (name: string) => void;
  renameSection: (id: string, name: string) => void;
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

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const offset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return iso(d);
};

const seedSections: Section[] = [
  { id: "s-core", name: "Core" },
  { id: "s-learning", name: "Learning" },
  { id: "s-personal", name: "Personal Strategic" },
  { id: "s-optional", name: "Optional / Sandbox" },
];

const seedMilestones: Milestone[] = [
  { id: uid(), title: "Quarterly planning kickoff", description: "Align on themes for the next quarter and lock the top three bets.", sectionId: "s-core", date: offset(-18) },
  { id: uid(), title: "Foundation refactor v1", description: "Ship the first slice of the platform refactor.", sectionId: "s-core", date: offset(-2) },
  { id: uid(), title: "Foundation refactor v2", description: "Second slice — covers data layer.", sectionId: "s-core", date: offset(0) },
  { id: uid(), title: "Foundation refactor v3", description: "Third slice — surface migrations.", sectionId: "s-core", date: offset(1) },
  { id: uid(), title: "Public release candidate", description: "Internal RC ready for stakeholder review.", sectionId: "s-core", date: offset(34) },
  { id: uid(), title: "Reading: Designing Data-Intensive Apps", description: "Finish chapters 7–10.", sectionId: "s-learning", date: offset(-10) },
  { id: uid(), title: "Workshop: type-driven design", description: "Half-day internal workshop.", sectionId: "s-learning", date: offset(20) },
  { id: uid(), title: "Year-end review notes", description: "Personal retrospective for the half.", sectionId: "s-personal", date: offset(-25) },
  { id: uid(), title: "Annual planning offsite", description: "Two days, focused planning offsite.", sectionId: "s-personal", date: offset(12) },
  { id: uid(), title: "Mentorship check-in", description: "Quarterly conversation.", sectionId: "s-personal", date: offset(45) },
  { id: uid(), title: "Prototype: ambient UI", description: "Explore an ambient information surface.", sectionId: "s-optional", date: offset(8) },
  { id: uid(), title: "Sketch: editorial templates", description: "Three templates for the design library.", sectionId: "s-optional", date: offset(28) },
];

export const useRoadmap = create<RoadmapState>()(
  persist(
    (set) => ({
      sections: seedSections,
      milestones: seedMilestones,
      scale: "quarter",
      anchor: iso(today),

      setScale: (s) => set({ scale: s }),
      setAnchor: (anchor) => set({ anchor }),

      addSection: (name) =>
        set((st) => ({ sections: [...st.sections, { id: uid(), name: name.trim() || "Untitled" }] })),
      renameSection: (id, name) =>
        set((st) => ({ sections: st.sections.map((s) => (s.id === id ? { ...s, name } : s)) })),
      deleteSection: (id) =>
        set((st) => ({
          sections: st.sections.filter((s) => s.id !== id),
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
          return { sections: next };
        }),

      addMilestone: (m) => set((st) => ({ milestones: [...st.milestones, { ...m, id: uid() }] })),
      updateMilestone: (id, patch) =>
        set((st) => ({
          milestones: st.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMilestone: (id) =>
        set((st) => ({ milestones: st.milestones.filter((m) => m.id !== id) })),
    }),
    {
      name: "roadmap-v1",
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
    },
  ),
);