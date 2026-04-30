import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onAddSection: () => void;
};

export function EmptyBoard({ onAddSection }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-card px-8 py-24 text-center">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Empty roadmap
      </div>
      <h2 className="font-display text-2xl tracking-tight text-primary">
        Start with your first section
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Sections are your lanes. Add one to begin shaping the year around major milestones and
        bandwidth.
      </p>
      <Button onClick={onAddSection} className="mt-6">
        <Plus className="h-4 w-4" />
        Create first section
      </Button>
    </div>
  );
}
