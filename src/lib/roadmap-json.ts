import { z } from "zod";
import { DEFAULT_SECTION_COLOR, SECTION_COLORS, type SectionColorId } from "./section-colors";

export const ROADMAP_FILE_SCHEMA_NAME = "horizon-roadmap";
export const ROADMAP_FILE_VERSION = 1 as const;

export type RoadmapMilestoneType = "commitment" | "intention";
export type RoadmapTimeScale = "month" | "quarter" | "year";

export type RoadmapFileSection = {
  key: string;
  title: string;
  order?: number;
  color?: SectionColorId;
};

export type RoadmapFileMilestone = {
  title: string;
  description?: string;
  sectionKey: string;
  date: string;
  type?: RoadmapMilestoneType;
};

export type RoadmapFileProject = {
  title?: string;
  scale?: RoadmapTimeScale;
  anchor?: string;
};

export type RoadmapFileV1 = {
  schema: typeof ROADMAP_FILE_SCHEMA_NAME;
  version: typeof ROADMAP_FILE_VERSION;
  project?: RoadmapFileProject;
  sections: RoadmapFileSection[];
  milestones: RoadmapFileMilestone[];
};

export type ImportedRoadmapData = {
  title?: string;
  scale?: RoadmapTimeScale;
  anchor?: string;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    color: SectionColorId;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description?: string;
    sectionId: string;
    date: string;
    type: RoadmapMilestoneType;
  }>;
};

const ROADMAP_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ROADMAP_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const sectionColorIds = new Set(SECTION_COLORS.map((color) => color.id));

const roadmapSectionSchema = z.object({
  key: z.string().trim().min(1).regex(ROADMAP_KEY_PATTERN),
  title: z.string().trim().min(1),
  order: z.number().int().nonnegative().optional(),
  color: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || sectionColorIds.has(value as SectionColorId), {
      message: "Invalid section color.",
    }),
});

const roadmapMilestoneSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  sectionKey: z.string().trim().min(1).regex(ROADMAP_KEY_PATTERN),
  date: z.string().trim().regex(ROADMAP_DATE_PATTERN),
  type: z.enum(["commitment", "intention"]).optional(),
});

const roadmapProjectSchema = z.object({
  title: z.string().trim().optional(),
  scale: z.enum(["month", "quarter", "year"]).optional(),
  anchor: z.string().trim().regex(ROADMAP_DATE_PATTERN).optional(),
});

export const ROADMAP_FILE_SCHEMA = z
  .object({
    schema: z.literal(ROADMAP_FILE_SCHEMA_NAME),
    version: z.literal(ROADMAP_FILE_VERSION),
    project: roadmapProjectSchema.optional(),
    sections: z.array(roadmapSectionSchema).min(1),
    milestones: z.array(roadmapMilestoneSchema).min(0),
  })
  .superRefine((value, ctx) => {
    const seenKeys = new Set<string>();

    for (const section of value.sections) {
      if (seenKeys.has(section.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate section key: ${section.key}`,
          path: ["sections"],
        });
        return;
      }
      seenKeys.add(section.key);
    }

    for (const milestone of value.milestones) {
      if (!seenKeys.has(milestone.sectionKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown section key referenced by milestone: ${milestone.sectionKey}`,
          path: ["milestones"],
        });
        return;
      }
    }
  });

export type RoadmapFileParseResult =
  | { success: true; data: RoadmapFileV1 }
  | { success: false; error: string };

export function parseRoadmapFile(input: unknown): RoadmapFileParseResult {
  const result = ROADMAP_FILE_SCHEMA.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  return { success: true, data: result.data };
}

export function roadmapFileToImportedData(file: RoadmapFileV1): ImportedRoadmapData {
  return {
    title: file.project?.title,
    scale: file.project?.scale,
    anchor: file.project?.anchor,
    sections: [...file.sections]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((section, index) => ({
        id: section.key,
        title: section.title,
        order: section.order ?? index,
        color: section.color ?? DEFAULT_SECTION_COLOR,
      })),
    milestones: file.milestones.map((milestone, index) => ({
      id: `${milestone.sectionKey}-${milestone.date}-${index}`,
      title: milestone.title,
      description: milestone.description,
      sectionId: milestone.sectionKey,
      date: milestone.date,
      type: milestone.type ?? "commitment",
    })),
  };
}

export function createRoadmapTemplate(): RoadmapFileV1 {
  return {
    schema: ROADMAP_FILE_SCHEMA_NAME,
    version: ROADMAP_FILE_VERSION,
    project: {
      title: "Personal Roadmap",
      scale: "quarter",
      anchor: "2026-01-01",
    },
    sections: [
      { key: "treeplet-core", title: "TreePlet Core", order: 0, color: "sage" },
      { key: "learning", title: "Learning", order: 1, color: "sky" },
      { key: "personal-strategic", title: "Personal Strategic", order: 2, color: "clay" },
      { key: "sandbox", title: "Optional / Sandbox", order: 3, color: "lavender" },
    ],
    milestones: [
      {
        title: "Connectivity Stabilization",
        sectionKey: "treeplet-core",
        date: "2026-05-31",
        type: "commitment",
        description: "Device connectivity, certificates, and reliable ingestion pipeline.",
      },
    ],
  };
}
