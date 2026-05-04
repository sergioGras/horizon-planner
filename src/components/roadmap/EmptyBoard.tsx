import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShellCopy } from "@/lib/app-locale";

type Props = {
  onAddSection: () => void;
};

export function EmptyBoard({ onAddSection }: Props) {
  const copy = useShellCopy();
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-card px-8 py-24 text-center">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
        {copy.emptyBoard.title}
      </div>
      <h2 className="font-display text-2xl tracking-tight text-primary">{copy.emptyBoard.label}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {copy.emptyBoard.description}
      </p>
      <Button onClick={onAddSection} className="mt-6">
        <Plus className="h-4 w-4" />
        {copy.emptyBoard.action}
      </Button>
    </div>
  );
}
