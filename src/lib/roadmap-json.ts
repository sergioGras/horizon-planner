import { z } from "zod";
import { DEFAULT_SECTION_COLOR, SECTION_COLORS, type SectionColorId } from "./section-colors";
import type { Milestone, Section, TimeScale } from "./roadmap-store";

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

export function importedRoadmapToLocalShape(data: ImportedRoadmapData) {
  return {
    sections: data.sections.map(({ id, title, order, color }) => ({
      id,
      title,
      order,
      color,
    })),
    milestones: data.milestones.map(({ id, title, description, sectionId, date, type }) => ({
      id,
      title,
      description,
      sectionId,
      date,
      type,
    })),
    scale: data.scale,
    anchor: data.anchor,
  };
}

function toRoadmapKey(value: string, fallback: string) {
  const key = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return key || fallback;
}

function uniqueRoadmapKey(baseKey: string, usedKeys: Set<string>) {
  let key = baseKey;
  let index = 2;

  while (usedKeys.has(key)) {
    key = `${baseKey}-${index}`;
    index += 1;
  }

  usedKeys.add(key);
  return key;
}

export function roadmapStateToFile({
  title,
  sections,
  milestones,
  scale,
  anchor,
}: {
  title?: string;
  sections: Section[];
  milestones: Milestone[];
  scale: TimeScale;
  anchor: string;
}): RoadmapFileV1 {
  const usedKeys = new Set<string>();
  const sectionKeyById = new Map<string, string>();

  const fileSections = [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => {
      const key = uniqueRoadmapKey(toRoadmapKey(section.title, `section-${index + 1}`), usedKeys);
      sectionKeyById.set(section.id, key);

      return {
        key,
        title: section.title,
        order: index,
        color: section.color ?? DEFAULT_SECTION_COLOR,
      };
    });

  return {
    schema: ROADMAP_FILE_SCHEMA_NAME,
    version: ROADMAP_FILE_VERSION,
    project: {
      title: title?.trim() || "Roadmap",
      scale,
      anchor,
    },
    sections: fileSections,
    milestones: milestones
      .filter((milestone) => sectionKeyById.has(milestone.sectionId))
      .map((milestone) => ({
        title: milestone.title,
        description: milestone.description,
        sectionKey: sectionKeyById.get(milestone.sectionId) ?? "",
        date: milestone.date,
        type: milestone.type ?? "commitment",
      })),
  };
}

export function createRoadmapExportJsonText(file: RoadmapFileV1) {
  return JSON.stringify(file, null, 2) + "\n";
}

export function createRoadmapTemplate(): RoadmapFileV1 {
  return {
    schema: ROADMAP_FILE_SCHEMA_NAME,
    version: ROADMAP_FILE_VERSION,
    project: {
      title: "Roadmap",
      scale: "quarter",
      anchor: "2026-01-01",
    },
    sections: [
      { key: "core", title: "Core", order: 0, color: "sage" },
      { key: "learning", title: "Learning", order: 1, color: "sky" },
      { key: "personal", title: "Personal", order: 2, color: "clay" },
      { key: "sandbox", title: "Sandbox", order: 3, color: "lavender" },
    ],
    milestones: [
      {
        title: "Project kickoff",
        sectionKey: "core",
        date: "2026-02-15",
        type: "commitment",
        description: "Align scope, timeline, and the first delivery checkpoint.",
      },
      {
        title: "Foundational review",
        sectionKey: "core",
        date: "2026-04-30",
        type: "commitment",
        description: "Review the base plan and adjust priorities for the next phase.",
      },
      {
        title: "Learning cadence",
        sectionKey: "learning",
        date: "2026-06-15",
        type: "intention",
        description: "Keep a steady learning rhythm for skill growth.",
      },
      {
        title: "Personal planning checkpoint",
        sectionKey: "personal",
        date: "2026-08-31",
        type: "intention",
        description: "Check in on personal decisions and reduce ambiguity.",
      },
      {
        title: "Sandbox exploration",
        sectionKey: "sandbox",
        date: "2026-10-15",
        type: "intention",
        description: "Leave room for opportunistic experiments and side ideas.",
      },
    ],
  };
}

export function createGenericRoadmapSeed() {
  return importedRoadmapToLocalShape(roadmapFileToImportedData(createRoadmapTemplate()));
}

export function createRoadmapSampleJsonText() {
  return JSON.stringify(createRoadmapTemplate(), null, 2) + "\n";
}

export function createRoadmapSkillMarkdown() {
  return `---
name: horizon-roadmap-json
description: Generate or validate AI-native roadmap JSON files for the Horizon roadmap app.
origin: local
---

# Horizon Roadmap JSON Skill

Use this skill when an AI system needs to generate a roadmap file for the app.

## Goal

Produce a single JSON object that matches the \`horizon-roadmap\` v1 schema exactly.

## Required Shape

\`\`\`json
{
  "schema": "horizon-roadmap",
  "version": 1,
  "project": {
    "title": "Roadmap",
    "scale": "quarter",
    "anchor": "2026-01-01"
  },
  "sections": [
    {
      "key": "core",
      "title": "Core",
      "order": 0,
      "color": "sage"
    }
  ],
  "milestones": [
    {
      "title": "Project kickoff",
      "sectionKey": "core",
      "date": "2026-02-15",
      "type": "commitment",
      "description": "Align scope, timeline, and the first delivery checkpoint."
    }
  ]
}
\`\`\`

## Rules

- Output JSON only.
- Do not wrap the JSON in markdown fences unless explicitly requested.
- Use \`schema: "horizon-roadmap"\` and \`version: 1\`.
- Use stable lowercase section keys like \`core\`, \`learning\`, \`personal\`, and \`sandbox\`.
- Every milestone must reference an existing \`sectionKey\`.
- Use \`YYYY-MM-DD\` local dates.
- \`type\` must be \`commitment\` or \`intention\`.
- Keep milestone titles short and concrete.
- Keep descriptions optional and concise.
- Do not add tasks, dependencies, or PM metadata.

## Suggested Generation Strategy

- Start with 3 to 4 sections.
- Include 3 to 8 milestones.
- Mix commitments and intentions.
- Spread milestones across the year.
- Keep the file easy to read and easy to import.

## Reference Files

- Schema doc: \`docs/roadmap-json-format.md\`
- Sample file: \`docs/samples/roadmap-template.json\`
`;
}
