# CHANGELOG

## 2026-05-04

- Added Spanish localization for the public app shell, including the sign-in screen, auth banner, header, board shell states, and not-found page.
- Localized the core roadmap surface, dialogs, empty states, timeline labels, and date-scale labels into Spanish.
- Added a persisted language switcher in the profile menu so users can lock the shell to English or Spanish.
- Removed the stale project-switcher prop wiring and normalized the shared locale copy source.
- Expanded the board viewport to use the full available width on large screens.

## 2026-05-03

- Improved invite acceptance UX with sign-in hints, acceptance banners, and clearer failure states.
- Kept invite links usable across Google sign-in by preserving and clearing the invite token intentionally.
- Marked the shared-project foundation, invite acceptance, and member management tasks as done.
- Switched the active task back to the mobile version view.
- Added an explicit Supabase grant migration for the shared project RPCs so `create_project_invite` and `accept_project_invite` are callable by authenticated users in production.
- Fixed the shared-project RPCs to reference `pgcrypto` functions through the `extensions` schema so invite creation no longer fails on `gen_random_bytes`.
- Fixed an ambiguous `email` reference in the shared-project invite RPC by qualifying returned `project_invites` columns.
- Tightened the share-project dialog layout, added a dialog description for accessibility, and stacked invite/member rows more cleanly on narrow widths.
- Fixed an ambiguous `project_id` reference in the invite acceptance RPC so invite links can be accepted without a 400 error.
- Replaced the invite acceptance RPC conflict clause with the named unique constraint to avoid `project_id` output-column ambiguity during acceptance.
- Updated the task board for responsive breakpoint refinement and Spanish localization planning.
- Removed the 1600px board width cap and collapsed the top bar earlier at 1300px so the layout uses wide screens better and avoids header compression sooner.

## 2026-05-01

- Made login optional while keeping cloud-backed authenticated projects.
- Fixed the cloud project creation flow by switching the roadmap store into cloud mode.
- Added milestone type selection to the milestone editor.
- Added milestone type visual encoding in the timeline chip.
- Moved task tracking to `docs/status/` with explicit task, state, and changelog files.
- Defined the versioned AI-native roadmap JSON format and schema.
- Added a sample roadmap JSON template for AI-assisted generation.
- Added drag-and-drop JSON roadmap import with validation and preview.
- Switched the default onboarding seed to a generic canonical roadmap template.
- Added a reusable AI skill file for generating `horizon-roadmap` JSON.
- Added download actions in the import dialog for the AI skill and sample JSON template.
