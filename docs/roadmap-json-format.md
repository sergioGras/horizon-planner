# Roadmap JSON Format

This is the canonical file format for AI-generated roadmap imports and roadmap export.

## Version

- `schema`: `horizon-roadmap`
- `version`: `1`

## Goals

- Easy for AI systems to generate.
- Stable for users to store and share.
- Simple to validate and import.
- Small enough to round-trip without losing meaning.

## Shape

```json
{
  "schema": "horizon-roadmap",
  "version": 1,
  "project": {
    "title": "Personal Roadmap",
    "scale": "quarter",
    "anchor": "2026-01-01"
  },
  "sections": [
    {
      "key": "treeplet-core",
      "title": "TreePlet Core",
      "order": 0,
      "color": "sage"
    }
  ],
  "milestones": [
    {
      "title": "Connectivity Stabilization",
      "sectionKey": "treeplet-core",
      "date": "2026-05-31",
      "type": "commitment",
      "description": "Device connectivity, certificates, and ingestion pipeline."
    }
  ]
}
```

## Rules

- `sections[].key` is the stable identifier referenced by milestones.
- `sections[].title` is the user-facing lane name.
- `milestones[].sectionKey` must match one of the section keys.
- `date` uses local-date format: `YYYY-MM-DD`.
- `type` is optional and defaults to `commitment`.
- `project.scale` is optional and may be `month`, `quarter`, or `year`.
- `project.anchor` is optional and should be a local date.

## AI Guidance

- Prefer short stable keys like `treeplet-core`, `learning`, `personal-strategic`, and `sandbox`.
- Keep milestone titles concise.
- Use `commitment` for high-confidence items.
- Use `intention` for exploratory or directional items.
- Do not include workflow tasks, dependencies, or daily todos.

## Import Behavior

- Unknown top-level fields should be ignored in future import logic.
- Extra fields inside section or milestone objects should be ignored if they do not break validation.
- The app can derive internal ids from section keys during import.
