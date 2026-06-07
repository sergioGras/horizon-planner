# PROJECT STATE

## Product Direction

- Public roadmap timeline product for commitments and intentions across the year.
- Optional login with cloud-backed personal projects.
- Core experience stays calm, editorial, and lightweight.
- Future premium features should be additive, not disruptive to the core workflow.

## Current Focus

- Responsive layout breakpoint refinement is done; the header now collapses earlier and the board uses the full viewport width.
- Spanish localization now covers the public app shell, with a persisted language switcher in the profile menu.
- Read-only display links can embed a cloud roadmap in unattended dashboards without OAuth.
- The display route supports read-only timeline inspection, window navigation, clock refresh, and five-minute cloud-data polling.
- The share project dialog now scrolls internally and shows copy feedback for invite and display links.
- Milestone date controls now truncate cleanly inside the milestone dialog on narrow widths.
- Section move up/down now rewrites section order correctly instead of re-sorting back to the old order.
- Shared project collaboration is in place with invite-only acceptance and member management.
- JSON export for round-tripping and AI-assisted generation is available.
- AI-native roadmap JSON format is defined in a versioned spec.
- Generic onboarding seed now comes from the canonical roadmap template.
- Import dialog exposes downloadable AI skill and sample JSON for first-time users.
- Production must apply `supabase/migrations/008_read_only_display_links.sql` before display links can be created.

## Constraints

- Keep the app simple and maintainable.
- Avoid turning it into a full PM suite.
- Prefer iterative changes over large rewrites.
