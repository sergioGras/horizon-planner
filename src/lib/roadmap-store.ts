import { create } from "zustand";
import { toLocalISODate, todayISO } from "./date-utils";
import { DEFAULT_SECTION_COLOR, SECTION_COLORS, type SectionColorId } from "./section-colors";
import { createGenericRoadmapSeed } from "./roadmap-json";
import { requireSupabase } from "./supabase";

export type Project = {
  id: string;
  ownerId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
};

export type Section = {
  id: string;
  projectId: string;
  title: string;
  order: number;
  color?: SectionColorId;
};

export type MilestoneType = "commitment" | "intention";

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sectionId: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  type?: MilestoneType;
};

export type TimeScale = "month" | "quarter" | "year";

type StoreStatus = "idle" | "loading" | "ready" | "saving" | "error";
type StoreMode = "local" | "cloud";

type RoadmapState = {
  mode: StoreMode;
  projects: Project[];
  activeProjectId: string | null;
  sections: Section[];
  milestones: Milestone[];
  scale: TimeScale;
  /** anchor date for the current viewing window (ISO) */
  anchor: string;
  status: StoreStatus;
  error: string | null;
  initializedUserId: string | null;

  initializeCloud: (userId: string) => Promise<void>;
  initializeLocal: () => void;
  refreshActiveProject: () => Promise<void>;

  setScale: (s: TimeScale) => void;
  setAnchor: (iso: string) => void;
  setActiveProject: (projectId: string) => Promise<void>;

  createProject: (title: string) => Promise<Project | null>;
  renameProject: (id: string, title: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addSection: (title: string, color?: SectionColorId) => Promise<void>;
  renameSection: (id: string, title: string, color?: SectionColorId) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  moveSection: (id: string, dir: -1 | 1) => Promise<void>;

  addMilestone: (m: Omit<Milestone, "id" | "projectId">) => Promise<void>;
  updateMilestone: (
    id: string,
    patch: Partial<Omit<Milestone, "id" | "projectId">>,
  ) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  importLocalRoadmap: (data: LocalRoadmapData, projectTitle?: string) => Promise<void>;
};

export type LocalRoadmapData = {
  sections: Array<Pick<Section, "id" | "title" | "order" | "color">>;
  milestones: Array<Omit<Milestone, "projectId">>;
  scale?: TimeScale;
  anchor?: string;
};

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
};

type SectionRow = {
  id: string;
  project_id: string;
  title: string;
  order: number;
  color?: SectionColorId | null;
};

type MilestoneRow = {
  id: string;
  project_id: string;
  section_id: string;
  title: string;
  description?: string | null;
  date: string;
  type?: MilestoneType | null;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const iso = (d: Date) => toLocalISODate(d);

const genericSeedData = createGenericRoadmapSeed();

function normalizeScale(scale?: string): TimeScale {
  return scale === "month" || scale === "quarter" || scale === "year" ? scale : "quarter";
}

function normalizeSections(sections: LocalRoadmapData["sections"]) {
  const colorIds = new Set<string>(SECTION_COLORS.map((color) => color.id));

  return [...sections]
    .map((section, index) => ({
      id: section.id,
      title: section.title?.trim() || "Untitled",
      order: Number.isFinite(section.order) ? section.order : index,
      color: colorIds.has(section.color ?? "") ? section.color : DEFAULT_SECTION_COLOR,
    }))
    .sort((a, b) => a.order - b.order)
    .map((section, order) => ({ ...section, order }));
}

function normalizeMilestone(milestone: Omit<Milestone, "projectId">): Omit<Milestone, "projectId"> {
  return {
    ...milestone,
    title: milestone.title.trim() || "Untitled milestone",
    description: milestone.description?.trim() || undefined,
    type: milestone.type === "intention" ? "intention" : "commitment",
  };
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function toSection(row: SectionRow): Section {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    order: row.order,
    color: row.color ?? DEFAULT_SECTION_COLOR,
  };
}

function toMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    projectId: row.project_id,
    sectionId: row.section_id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    type: row.type ?? "commitment",
  };
}

function toSectionInsert(section: LocalRoadmapData["sections"][number], projectId: string) {
  return {
    id: section.id,
    project_id: projectId,
    title: section.title,
    order: section.order,
    color: section.color ?? DEFAULT_SECTION_COLOR,
  };
}

function toMilestoneInsert(milestone: Omit<Milestone, "projectId">, projectId: string) {
  return {
    id: milestone.id,
    project_id: projectId,
    section_id: milestone.sectionId,
    title: milestone.title,
    description: milestone.description ?? null,
    date: milestone.date,
    type: milestone.type ?? "commitment",
  };
}

function getSelectedProjectStorageKey(userId: string) {
  return `roadmap:selected-project:${userId}`;
}

const LOCAL_STORAGE_KEY = "roadmap-v1";
const LOCAL_PROJECT_ID = "local-project";

function getLocalFallbackData(): LocalRoadmapData {
  return readLocalRoadmapData() ?? getSeedRoadmapData();
}

function getLocalProject(): Project {
  return {
    id: LOCAL_PROJECT_ID,
    ownerId: "local",
    title: "Local Roadmap",
  };
}

function saveLocalRoadmapData(
  state: Pick<RoadmapState, "sections" | "milestones" | "scale" | "anchor">,
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({
      state: {
        sections: state.sections.map(({ id, title, order, color }) => ({
          id,
          title,
          order,
          color,
        })),
        milestones: state.milestones.map(({ id, title, description, sectionId, date, type }) => ({
          id,
          title,
          description,
          sectionId,
          date,
          type,
        })),
        scale: state.scale,
        anchor: state.anchor,
      },
      version: 3,
    }),
  );
}

function toLocalSections(data: LocalRoadmapData): Section[] {
  return normalizeSections(data.sections).map((section) => ({
    ...section,
    projectId: LOCAL_PROJECT_ID,
  }));
}

function toLocalMilestones(data: LocalRoadmapData): Milestone[] {
  return data.milestones.map((milestone) => ({
    ...normalizeMilestone(milestone),
    projectId: LOCAL_PROJECT_ID,
  }));
}

async function fetchProjects() {
  const { data, error } = await requireSupabase()
    .from("projects")
    .select("id, owner_id, title, created_at, updated_at, archived_at")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => toProject(row as ProjectRow));
}

async function fetchProjectData(projectId: string) {
  const supabase = requireSupabase();
  const [sectionsResult, milestonesResult] = await Promise.all([
    supabase
      .from("sections")
      .select("id, project_id, title, order, color")
      .eq("project_id", projectId)
      .order("order", { ascending: true }),
    supabase
      .from("milestones")
      .select("id, project_id, section_id, title, description, date, type")
      .eq("project_id", projectId)
      .order("date", { ascending: true }),
  ]);

  if (sectionsResult.error) throw sectionsResult.error;
  if (milestonesResult.error) throw milestonesResult.error;

  return {
    sections: (sectionsResult.data ?? []).map((row) => toSection(row as SectionRow)),
    milestones: (milestonesResult.data ?? []).map((row) => toMilestone(row as MilestoneRow)),
  };
}

async function createCloudProject(title: string) {
  const supabase = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to create a project.");

  const { data, error } = await supabase
    .from("projects")
    .insert({ owner_id: user.id, title: title.trim() || "Personal Roadmap" })
    .select("id, owner_id, title, created_at, updated_at, archived_at")
    .single();

  if (error) throw error;
  return toProject(data as ProjectRow);
}

async function seedProject(projectId: string, data: LocalRoadmapData) {
  const sections = normalizeSections(data.sections);
  const milestones = data.milestones.map(normalizeMilestone);
  const sectionIdMap = new Map(sections.map((section) => [section.id, uid()]));

  if (sections.length > 0) {
    const { error } = await requireSupabase()
      .from("sections")
      .insert(
        sections.map((section) => ({
          id: sectionIdMap.get(section.id),
          project_id: projectId,
          title: section.title,
          order: section.order,
          color: section.color ?? DEFAULT_SECTION_COLOR,
        })),
      );
    if (error) throw error;
  }

  if (milestones.length > 0) {
    const { error } = await requireSupabase()
      .from("milestones")
      .insert(
        milestones
          .filter((milestone) => sectionIdMap.has(milestone.sectionId))
          .map((milestone) => ({
            id: uid(),
            project_id: projectId,
            section_id: sectionIdMap.get(milestone.sectionId),
            title: milestone.title,
            description: milestone.description ?? null,
            date: milestone.date,
            type: milestone.type ?? "commitment",
          })),
      );
    if (error) throw error;
  }
}

export function getSeedRoadmapData(): LocalRoadmapData {
  return {
    sections: normalizeSections(genericSeedData.sections),
    milestones: genericSeedData.milestones.map(normalizeMilestone),
    scale: genericSeedData.scale ?? "quarter",
    anchor: todayISO(),
  };
}

export function readLocalRoadmapData(): LocalRoadmapData | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("roadmap-v1");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      state?: Partial<LocalRoadmapData> & {
        sections?: Array<Partial<LocalRoadmapData["sections"][number]> & { name?: string }>;
      };
    };
    const state = parsed.state;
    if (!state?.sections?.length) return null;

    return {
      sections: normalizeSections(
        state.sections.map((section, index) => ({
          id: section.id ?? uid(),
          title: section.title ?? section.name ?? "Untitled",
          order: section.order ?? index,
          color: section.color,
        })),
      ),
      milestones: (state.milestones ?? []).map((milestone) =>
        normalizeMilestone({
          id: milestone.id ?? uid(),
          title: milestone.title ?? "Untitled milestone",
          description: milestone.description,
          sectionId: milestone.sectionId ?? state.sections?.[0]?.id ?? "s-core",
          date: milestone.date ?? iso(new Date()),
          type: milestone.type,
        }),
      ),
      scale: normalizeScale(state.scale),
      anchor: state.anchor ?? todayISO(),
    };
  } catch {
    return null;
  }
}

export function getImportDecisionKey(userId: string) {
  return `roadmap:import-decision:${userId}`;
}

async function loadActiveProject(userId: string, projects: Project[]) {
  const selectedId =
    typeof window !== "undefined"
      ? window.localStorage.getItem(getSelectedProjectStorageKey(userId))
      : null;
  const activeProject =
    projects.find((project) => project.id === selectedId) ?? projects[0] ?? null;

  if (!activeProject) {
    return { activeProjectId: null, sections: [], milestones: [] };
  }

  const data = await fetchProjectData(activeProject.id);
  return { activeProjectId: activeProject.id, ...data };
}

function setStoreError(set: (state: Partial<RoadmapState>) => void, error: unknown) {
  set({
    status: "error",
    error: error instanceof Error ? error.message : "Unexpected roadmap error.",
  });
}

export const useRoadmap = create<RoadmapState>()((set, get) => ({
  mode: "local",
  projects: [],
  activeProjectId: null,
  sections: [],
  milestones: [],
  scale: "quarter",
  anchor: todayISO(),
  status: "idle",
  error: null,
  initializedUserId: null,

  initializeCloud: async (userId) => {
    if (get().initializedUserId === userId && get().mode === "cloud" && get().status !== "error") {
      return;
    }

    set({ mode: "cloud", status: "loading", error: null, initializedUserId: userId });

    try {
      const projects = await fetchProjects();
      const activeData = await loadActiveProject(userId, projects);
      set({ projects, ...activeData, status: "ready", error: null });
    } catch (error) {
      setStoreError(set, error);
    }
  },

  initializeLocal: () => {
    if (get().mode === "local" && get().status === "ready") return;

    const data = getLocalFallbackData();
    set({
      mode: "local",
      projects: [getLocalProject()],
      activeProjectId: LOCAL_PROJECT_ID,
      sections: toLocalSections(data),
      milestones: toLocalMilestones(data),
      scale: data.scale ?? "quarter",
      anchor: data.anchor ?? todayISO(),
      status: "ready",
      error: null,
      initializedUserId: null,
    });
  },

  refreshActiveProject: async () => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    try {
      const data = await fetchProjectData(activeProjectId);
      set({ ...data, status: "ready", error: null });
    } catch (error) {
      setStoreError(set, error);
    }
  },

  setScale: (scale) => {
    set({ scale });
    if (get().mode === "local") saveLocalRoadmapData(get());
  },
  setAnchor: (anchor) => {
    set({ anchor });
    if (get().mode === "local") saveLocalRoadmapData(get());
  },

  setActiveProject: async (projectId) => {
    if (get().mode === "local") return;

    const { initializedUserId } = get();
    set({ status: "loading", error: null });

    try {
      const data = await fetchProjectData(projectId);
      if (initializedUserId && typeof window !== "undefined") {
        window.localStorage.setItem(getSelectedProjectStorageKey(initializedUserId), projectId);
      }
      set({ activeProjectId: projectId, ...data, status: "ready", error: null });
    } catch (error) {
      setStoreError(set, error);
    }
  },

  createProject: async (title) => {
    if (get().mode === "local") {
      set({ error: "Sign in to create multiple timeline projects." });
      return null;
    }

    set({ status: "saving", error: null });

    try {
      const project = await createCloudProject(title);
      const projects = [...get().projects, project];
      set({ projects, activeProjectId: project.id, sections: [], milestones: [], status: "ready" });
      return project;
    } catch (error) {
      setStoreError(set, error);
      return null;
    }
  },

  renameProject: async (id, title) => {
    if (get().mode === "local") {
      const nextTitle = title.trim() || "Local Roadmap";
      set({
        projects: get().projects.map((project) =>
          project.id === id ? { ...project, title: nextTitle } : project,
        ),
      });
      saveLocalRoadmapData(get());
      return;
    }

    const previous = get().projects;
    const nextTitle = title.trim() || "Untitled project";
    set({
      projects: previous.map((project) =>
        project.id === id ? { ...project, title: nextTitle } : project,
      ),
    });

    const { error } = await requireSupabase()
      .from("projects")
      .update({ title: nextTitle })
      .eq("id", id);
    if (error) {
      set({ projects: previous });
      setStoreError(set, error);
    }
  },

  deleteProject: async (id) => {
    if (get().mode === "local") return;

    const previous = get();
    const remainingProjects = previous.projects.filter((project) => project.id !== id);
    const nextActiveId = remainingProjects[0]?.id ?? null;
    set({
      projects: remainingProjects,
      activeProjectId: nextActiveId,
      sections: [],
      milestones: [],
    });

    const { error } = await requireSupabase().from("projects").delete().eq("id", id);
    if (error) {
      set(previous);
      setStoreError(set, error);
      return;
    }

    if (nextActiveId) await get().setActiveProject(nextActiveId);
  },

  addSection: async (title, color = DEFAULT_SECTION_COLOR) => {
    const projectId = get().activeProjectId;
    if (!projectId) return;

    const section: Section = {
      id: uid(),
      projectId,
      title: title.trim() || "Untitled",
      order: get().sections.length,
      color,
    };
    const previous = get().sections;
    set({
      sections: normalizeSections([...previous, section]).map((item) => ({ ...item, projectId })),
    });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const { error } = await requireSupabase()
      .from("sections")
      .insert(toSectionInsert(section, projectId));
    if (error) {
      set({ sections: previous });
      setStoreError(set, error);
    }
  },

  renameSection: async (id, title, color) => {
    const previous = get().sections;
    const nextTitle = title.trim() || "Untitled";
    set({
      sections: previous.map((section) =>
        section.id === id
          ? { ...section, title: nextTitle, color: color ?? section.color }
          : section,
      ),
    });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const { error } = await requireSupabase()
      .from("sections")
      .update({ title: nextTitle, color })
      .eq("id", id);
    if (error) {
      set({ sections: previous });
      setStoreError(set, error);
    }
  },

  deleteSection: async (id) => {
    const previousSections = get().sections;
    const previousMilestones = get().milestones;
    set({
      sections: normalizeSections(previousSections.filter((section) => section.id !== id)).map(
        (section) => ({
          ...section,
          projectId: previousSections[0]?.projectId ?? get().activeProjectId ?? "",
        }),
      ),
      milestones: previousMilestones.filter((milestone) => milestone.sectionId !== id),
    });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const { error } = await requireSupabase().from("sections").delete().eq("id", id);
    if (error) {
      set({ sections: previousSections, milestones: previousMilestones });
      setStoreError(set, error);
    }
  },

  moveSection: async (id, dir) => {
    const previous = get().sections;
    const index = previous.findIndex((section) => section.id === id);
    const targetIndex = index + dir;
    if (index < 0 || targetIndex < 0 || targetIndex >= previous.length) return;

    const reordered = previous.slice();
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const normalized = normalizeSections(reordered).map((section) => ({
      ...section,
      projectId: previous[0]?.projectId ?? get().activeProjectId ?? "",
    }));
    set({ sections: normalized });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const updates = normalized.map((section) =>
      requireSupabase().from("sections").update({ order: section.order }).eq("id", section.id),
    );
    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;
    if (error) {
      set({ sections: previous });
      setStoreError(set, error);
    }
  },

  addMilestone: async (milestone) => {
    const projectId = get().activeProjectId;
    if (!projectId) return;

    const nextMilestone: Milestone = {
      ...normalizeMilestone({ ...milestone, id: uid() }),
      projectId,
    };
    const previous = get().milestones;
    set({ milestones: [...previous, nextMilestone].sort((a, b) => a.date.localeCompare(b.date)) });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const { error } = await requireSupabase()
      .from("milestones")
      .insert(toMilestoneInsert(nextMilestone, projectId));
    if (error) {
      set({ milestones: previous });
      setStoreError(set, error);
    }
  },

  updateMilestone: async (id, patch) => {
    const previous = get().milestones;
    const next = previous.map((milestone) =>
      milestone.id === id
        ? { ...milestone, ...normalizeMilestone({ ...milestone, ...patch }) }
        : milestone,
    );
    set({ milestones: next.sort((a, b) => a.date.localeCompare(b.date)) });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const { error } = await requireSupabase()
      .from("milestones")
      .update({
        title: patch.title,
        description: patch.description ?? null,
        section_id: patch.sectionId,
        date: patch.date,
        type: patch.type,
      })
      .eq("id", id);
    if (error) {
      set({ milestones: previous });
      setStoreError(set, error);
    }
  },

  deleteMilestone: async (id) => {
    const previous = get().milestones;
    set({ milestones: previous.filter((milestone) => milestone.id !== id) });

    if (get().mode === "local") {
      saveLocalRoadmapData(get());
      return;
    }

    const { error } = await requireSupabase().from("milestones").delete().eq("id", id);
    if (error) {
      set({ milestones: previous });
      setStoreError(set, error);
    }
  },

  importLocalRoadmap: async (data, projectTitle = "Personal Roadmap") => {
    set({ status: "saving", error: null });

    try {
      const project = await createCloudProject(projectTitle);
      await seedProject(project.id, data);
      const projects = await fetchProjects();
      const activeData = await fetchProjectData(project.id);
      set({
        projects,
        activeProjectId: project.id,
        ...activeData,
        scale: data.scale ?? get().scale,
        anchor: data.anchor ?? get().anchor,
        status: "ready",
        error: null,
      });
    } catch (error) {
      setStoreError(set, error);
    }
  },
}));
