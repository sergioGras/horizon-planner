# Agent Instructions

## Product

This is a public roadmap timeline product for planning major commitments and intentions across the year.

It is not a full project management system, Kanban board, spreadsheet, or Gantt tool.

The app should feel like:
- editorial roadmap
- calm planning surface
- premium internal strategy tool
- minimal milestone timeline

The product is moving from a local personal tool toward a public SaaS product with optional authentication and future premium features.

## Current Priority

Ship a clean, maintainable, polished public product without bloating the scope.

Focus on:
1. visual quality
2. timeline readability
3. simple editing and import/export flows
4. data clarity
5. maintainable structure
6. product readiness for public use

Do not overbuild.

## Product Rules

Milestones are point-in-time items.

Roadmap blocks may represent durations only if the app explicitly supports timeline bars.

Rows represent workstreams or lanes.

Target lanes:
- TreePlet Core
- Learning
- Personal Strategic
- Optional / Sandbox

Future premium features must stay additive, not disruptive to the core roadmap surface.

Avoid:
- dependencies
- assignees
- collaboration
- sprint planning
- complex PM features
- speculative backend architecture
- unnecessary product tiers before the core workflow is stable

## Design Direction

The UI should be calm, premium, editorial, and restrained.

Prefer:
- strong typography
- generous spacing
- soft surfaces
- subtle borders
- deliberate hierarchy
- one accent color
- clear alignment
- minimal visual noise

Avoid:
- generic SaaS dashboard look
- spreadsheet styling
- heavy borders
- nested card clutter
- loud gradients
- excessive pills
- dense controls

## Timeline Behavior

The board should support:
- month view
- quarter view
- year view if it stays compact
- visible active time window
- automatic placement by date
- compact handling of dense milestone clusters

Users should not manually drag items into time positions.

## Interaction Rules

Support:
- add section
- rename section
- delete section with confirmation
- reorder sections
- add milestone
- edit milestone
- delete milestone with confirmation
- switch time scale
- inspect clusters
- import roadmap files
- export roadmap data

Use one calm modal, drawer, or panel for add/edit flows where possible.

## Engineering Rules

Before changing code:
1. inspect the current structure
2. identify existing patterns
3. preserve working behavior
4. make the smallest coherent improvement

Prefer refactoring when it improves clarity.

Keep components focused:
- timeline shell
- timeline grid
- row labels
- milestone rendering
- milestone form
- section controls
- data model and utilities

Avoid large monolithic components.

## Data Model

Use simple domain types first, then extend only when needed.

Recommended entities:

```ts
type Section = {
  id: string;
  title: string;
  order: number;
  color?: string;
};

type Milestone = {
  id: string;
  title: string;
  description?: string;
  sectionId: string;
  date: string;
  type?: "commitment" | "intention";
};

type Project = {
  id: string;
  title: string;
  ownerId?: string;
};

if duration blocks are added:

type RoadmapBlock = {
  id: string;
  title: string;
  description?: string;
  sectionId: string;
  startDate: string;
  endDate: string;
  type: "commitment" | "intention";
};
```

## Status Rules

- Check `docs/status/TASKS.md` before starting work.
- Only one task may be active at a time.
- After meaningful progress, update `docs/status/PROJECT_STATE.md` and `docs/status/CHANGELOG.md`.
- Prefer completing the active task before starting another one.
- If blocked, mark the task blocked and explain why.

## Quality Bar

A change is good only if:

- the app still feels simple
- the board is easier to scan
- visual hierarchy improves
- code is easier to modify
- no unnecessary product complexity was added

## When Unsure

Choose the simpler, more coherent option.

Do not invent a large architecture.

Do not add features just because they are common in roadmap tools.
