# Roadmap — Editorial Timeline Board

A single-page, calm, premium timeline for planning milestones across sections. Paper-and-ink palette, Outfit headings, Figtree body. Local-only persistence. Ships pre-seeded with a 4-lane sample roadmap.

## Visual direction

- Palette: warm paper `#f5f3ee` canvas, soft `#e8e4dd` rules, `#2d2d2d` text, `#0d0d0d` ink for emphasis. Single accent reserved for "today" marker, active time window, and primary actions.
- Typography: Outfit for headings and section labels (tight tracking, medium weight). Figtree for body, dates, and milestone titles.
- Surfaces: large breathing room, hairline rules instead of cards-in-cards, subtle dotted month gridlines, no heavy borders, no rounded pills everywhere. Milestones use a small refined chip with a dot + truncated title.
- Motion: quiet — fade/slide on dialogs, smooth horizontal pan when changing time window, no bounce.

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│  Roadmap                          [Month | Quarter]   [+ Milestone]│
│  Sample Strategic Board                              ‹ Q2 2026 ›   │
├───────────────┬──────────────────────────────────────────────┤
│ SECTIONS      │  Apr        May        Jun        Jul        │
│               │  ·  ·  · │ ·  ·  · │ ·  ·  · │ ·  ·  ·  ← today│
│ Core        ⋮ │     ●  ●         ⊕3                  ●        │
│ Learning    ⋮ │           ●                ●                  │
│ Personal    ⋮ │  ●                    ●           ●           │
│ Optional    ⋮ │                ●                              │
│               │                                                │
│ + Section     │                                                │
└───────────────┴──────────────────────────────────────────────┘
```

- Top bar: board title, time-scale toggle (Month / Quarter), prev/next window arrows with current window label, "Today" jump, primary "+ Milestone".
- Left rail: section labels with a compact `⋮` menu (rename, delete, reorder up/down). "+ Section" inline at the bottom.
- Main grid: horizontal time axis aligned to rail rows. Soft vertical dividers per unit, stronger divider per period (month in Quarter view, week in Month view). A vertical accent line marks today.
- Rows expand to fill vertical space when few sections exist; switch to compact row height past ~8 sections so the board stays legible.

## Time model

- Month view: shows ~6 weeks at a time, day-level positioning, week dividers.
- Quarter view: paged — one quarter fills the viewport width, arrows page Q-by-Q, month dividers inside.
- Active window highlighted in the header; horizontal scroll still works for free panning, but arrows + Today are the primary controls so the user always knows where they are.
- Smooth scroll-to when paging or jumping to today.

## Milestones

- Point-in-time only. Fields: title, description, section, date.
- Auto-positioned by date and section — no drag.
- Compact chip: small accent dot + title truncated with ellipsis, consistent height.
- Click chip → opens the same dialog used for create, in edit mode.
- Density handling (progressive disclosure):
  - 1 item in a slot → normal chip
  - 2–N overlapping in the same row+window slot → cluster chip `⊕ 3` showing count
  - Click cluster → popover listing the items with title + date; click any to open its edit dialog
- Slot width is derived from the current scale so clustering only triggers when chips would actually overlap.

## Create / edit surface

- Single dialog reused for add and edit (centered modal, generous padding, calm).
- Fields: Title, Section (select), Date (shadcn date picker with `pointer-events-auto`), Description (textarea).
- Footer: Cancel (ghost) on the left of the right group, Save (solid ink) on the right. In edit mode, a Delete action sits on the far left, visually separated, opens a confirm dialog.
- Section management uses the same calm dialog pattern for rename and delete-with-confirm.

## Empty states

- No sections: centered editorial prompt — short headline, one-line guidance, single "Create first section" button.
- Sections but no milestones: a quiet inline message in the grid area — "No milestones yet. Add one to start shaping the roadmap." with a primary action.

## Pre-seeded content

Four lanes — Core, Learning, Personal Strategic, Optional — with ~8–12 sample milestones spread across the current and next quarter, including one cluster to demonstrate density behavior.

## Persistence

- All sections and milestones stored in `localStorage` under a single namespaced key, hydrated on load with the seed if empty.
- No backend, no auth.

## Responsiveness

- Desktop-first. On narrower widths, the left rail narrows, time-scale toggle collapses to icons, and the grid keeps horizontal scroll. No separate mobile layout.

## Technical notes

- Single route: `src/routes/index.tsx` becomes the board. Replace placeholder.
- State: lightweight Zustand store (or React context + reducer) with a `localStorage` adapter; pure date math via `date-fns`.
- Components: `BoardHeader`, `TimelineAxis`, `SectionRail`, `TimelineGrid`, `MilestoneChip`, `ClusterChip` + popover, `MilestoneDialog`, `SectionDialog`, `ConfirmDialog`, `EmptyState`.
- Reuse shadcn `dialog`, `popover`, `dropdown-menu`, `button`, `input`, `textarea`, `select`, `calendar` (with `pointer-events-auto`).
- Theme tokens updated in `src/styles.css` to the Paper & Ink palette in oklch; load Outfit + Figtree via Google Fonts in `__root.tsx` head.
- Update `__root.tsx` meta: title "Roadmap", description matching the editorial tone.
