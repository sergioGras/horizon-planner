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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  confirmLabel?: string;
  initialTitle?: string;
  onSubmit: (title: string) => void;
};

export function ProjectDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  initialTitle = "",
  onSubmit,
}: Props) {
  const copy = useShellCopy();
  const [projectTitle, setProjectTitle] = useState(initialTitle);

  useEffect(() => {
    if (open) setProjectTitle(initialTitle);
  }, [initialTitle, open]);

  function submit() {
    const trimmed = projectTitle.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="project-title">{copy.projectDialog.label}</Label>
          <Input
            id="project-title"
            name="project-title"
            value={projectTitle}
            onChange={(event) => setProjectTitle(event.target.value)}
            placeholder={copy.projectDialog.placeholder}
            autoFocus
            autoComplete="off"
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {copy.projectDialog.cancel}
          </Button>
          <Button onClick={submit} disabled={!projectTitle.trim()}>
            {confirmLabel ?? copy.projectDialog.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
