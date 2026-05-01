import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LocalRoadmapData } from "@/lib/roadmap-store";

type Props = {
  open: boolean;
  localData: LocalRoadmapData | null;
  onImport: () => void;
  onStartBlank: () => void;
};

export function ImportLocalDialog({ open, localData, onImport, onStartBlank }: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[460px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">Import this roadmap?</DialogTitle>
          <DialogDescription>
            Existing local data was found on this browser. You can copy it into your first cloud
            project once, or start with a blank project.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-border bg-secondary/25 px-3 py-2 text-sm text-muted-foreground">
          {localData?.sections.length ?? 0} sections and {localData?.milestones.length ?? 0}{" "}
          milestones available to import.
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onStartBlank}>
            Start blank
          </Button>
          <Button onClick={onImport} disabled={!localData}>
            Import roadmap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
