import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useShellCopy } from "@/lib/app-locale";
import type { LocalRoadmapData } from "@/lib/roadmap-store";

type Props = {
  open: boolean;
  localData: LocalRoadmapData | null;
  onImport: () => void;
  onStartBlank: () => void;
};

export function ImportLocalDialog({ open, localData, onImport, onStartBlank }: Props) {
  const copy = useShellCopy();
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[460px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {copy.importLocal.title}
          </DialogTitle>
          <DialogDescription>{copy.importLocal.description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-border bg-secondary/25 px-3 py-2 text-sm text-muted-foreground">
          {copy.importLocal.stats(
            localData?.sections.length ?? 0,
            localData?.milestones.length ?? 0,
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onStartBlank}>
            {copy.importLocal.startBlank}
          </Button>
          <Button onClick={onImport} disabled={!localData}>
            {copy.importLocal.importRoadmap}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
