# Agent Instructions

## Product

This is a lightweight personal roadmap / milestone timeline web app.

It is not a full project management system, Kanban board, spreadsheet, or Gantt tool.

The app should feel like:
- editorial roadmap
- calm internal strategy board
- premium planning surface
- minimal milestone timeline

The main purpose is to help the user see what occupies cognitive bandwidth across the year.

## Current Priority

Improve the downloaded Lovable repo into a clean, maintainable, polished web app.

Focus on:
1. visual quality
2. timeline readability
3. simple editing flows
4. data clarity
5. maintainable structure

Do not overbuild.

## Product Rules

Milestones are point-in-time items.

Roadmap blocks may represent durations only if the app explicitly supports timeline bars.

Rows represent workstreams / lanes.

Target future lanes:
- TreePlet Core
- Learning
- Personal Strategic
- Optional / Sandbox

Avoid:
- dependencies
- assignees
- permissions
- collaboration
- sprint planning
- complex PM features
- backend unless explicitly needed

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
- horizontal scrolling
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
- data model / utilities

Avoid large monolithic components.

## Data Model

Use simple local data first.

Recommended entities:

```ts
type Section = {
  id: string;
  title: string;
  order: number;
};

type Milestone = {
  id: string;
  title: string;
  description?: string;
  sectionId: string;
  date: string;
  type?: "commitment" | "intention";
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
Quality Bar

A change is good only if:

the app still feels simple
the board is easier to scan
visual hierarchy improves
code is easier to modify
no unnecessary product complexity was added
When Unsure

Choose the simpler, more coherent option.

Do not invent a large architecture.

Do not add features just because they are common in roadmap tools.

This app is personal, intentional, and lightweight.