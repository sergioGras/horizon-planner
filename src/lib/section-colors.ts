export const SECTION_COLORS = [
  {
    id: "sage",
    label: "Sage",
    swatch: "oklch(0.78 0.07 145)",
    soft: "oklch(0.93 0.035 145)",
    border: "oklch(0.78 0.055 145)",
    ink: "oklch(0.33 0.045 145)",
  },
  {
    id: "clay",
    label: "Clay",
    swatch: "oklch(0.78 0.08 42)",
    soft: "oklch(0.94 0.045 42)",
    border: "oklch(0.79 0.06 42)",
    ink: "oklch(0.36 0.055 42)",
  },
  {
    id: "butter",
    label: "Butter",
    swatch: "oklch(0.86 0.09 88)",
    soft: "oklch(0.96 0.045 88)",
    border: "oklch(0.84 0.07 88)",
    ink: "oklch(0.38 0.055 88)",
  },
  {
    id: "sky",
    label: "Sky",
    swatch: "oklch(0.79 0.07 230)",
    soft: "oklch(0.94 0.035 230)",
    border: "oklch(0.79 0.055 230)",
    ink: "oklch(0.32 0.055 230)",
  },
  {
    id: "lavender",
    label: "Lavender",
    swatch: "oklch(0.8 0.065 300)",
    soft: "oklch(0.94 0.035 300)",
    border: "oklch(0.8 0.05 300)",
    ink: "oklch(0.34 0.055 300)",
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "oklch(0.82 0.075 15)",
    soft: "oklch(0.95 0.04 15)",
    border: "oklch(0.82 0.055 15)",
    ink: "oklch(0.37 0.055 15)",
  },
] as const;

export type SectionColorId = (typeof SECTION_COLORS)[number]["id"];
export type SectionColor = (typeof SECTION_COLORS)[number];

export const DEFAULT_SECTION_COLOR: SectionColorId = "sage";

export function getSectionColor(id?: string) {
  return SECTION_COLORS.find((color) => color.id === id) ?? SECTION_COLORS[0];
}
