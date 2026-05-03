---
name: horizon-roadmap-json
description: Generate or validate AI-native roadmap JSON files for the Horizon roadmap app.
origin: local
---

# Horizon Roadmap JSON Skill

Use this skill when an AI system needs to generate a roadmap file for the app.

## Goal

Produce a single JSON object that matches the `horizon-roadmap` v1 schema exactly.

## Required Shape

```json
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
```

## Rules

- Output JSON only.
- Do not wrap the JSON in markdown fences unless explicitly requested.
- Use `schema: "horizon-roadmap"` and `version: 1`.
- Use stable lowercase section keys like `core`, `learning`, `personal`, and `sandbox`.
- Every milestone must reference an existing `sectionKey`.
- Use `YYYY-MM-DD` local dates.
- `type` must be `commitment` or `intention`.
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

- Schema doc: `docs/roadmap-json-format.md`
- Sample file: `docs/samples/roadmap-template.json`
