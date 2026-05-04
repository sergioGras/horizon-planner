import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShellCopy } from "@/lib/app-locale";
import { cn } from "@/lib/utils";
import { DEFAULT_SECTION_COLOR, SECTION_COLORS, type SectionColorId } from "@/lib/section-colors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialColor?: SectionColorId;
  title: string;
  confirmLabel: string;
  onSubmit: (name: string, color: SectionColorId) => void;
};

export function SectionDialog({
  open,
  onOpenChange,
  initialName = "",
  initialColor = DEFAULT_SECTION_COLOR,
  title,
  confirmLabel,
  onSubmit,
}: Props) {
  const copy = useShellCopy();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<SectionColorId>(initialColor);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setColor(initialColor);
  }, [open, initialName, initialColor]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, color);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="section-name">{copy.sectionDialog.nameLabel}</Label>
            <Input
              id="section-name"
              name="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.sectionDialog.namePlaceholder}
              autoFocus
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>{copy.sectionDialog.paletteLabel}</Label>
            <div className="grid grid-cols-3 gap-2">
              {SECTION_COLORS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={color === option.id}
                  onClick={() => setColor(option.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2 py-2 text-left text-xs transition-colors",
                    color === option.id
                      ? "border-primary bg-secondary/50 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-primary",
                  )}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-black/5"
                    style={{ backgroundColor: option.swatch }}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {copy.sectionDialog.cancel}
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            {confirmLabel ?? copy.sectionDialog.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
