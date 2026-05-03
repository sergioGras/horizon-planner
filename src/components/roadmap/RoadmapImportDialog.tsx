import { useEffect, useMemo, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { AlertCircle, FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  createRoadmapSampleJsonText,
  createRoadmapSkillMarkdown,
  parseRoadmapFile,
  roadmapFileToImportedData,
  type ImportedRoadmapData,
} from "@/lib/roadmap-json";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportedRoadmapData) => Promise<void> | void;
};

type ParseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; fileName: string; data: ImportedRoadmapData }
  | { status: "error"; fileName?: string; error: string };

export function RoadmapImportDialog({ open, onOpenChange, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ParseState>({ status: "idle" });
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!open) {
      setState({ status: "idle" });
      setDragActive(false);
      setIsImporting(false);
    }
  }, [open]);

  const preview = useMemo(() => {
    if (state.status !== "ready") return null;

    const commitmentCount = state.data.milestones.filter(
      (milestone) => milestone.type !== "intention",
    ).length;
    const intentionCount = state.data.milestones.length - commitmentCount;

    return {
      title: state.data.title ?? "Imported roadmap",
      scale: state.data.scale ?? "quarter",
      anchor: state.data.anchor ?? "Today",
      sections: state.data.sections.length,
      milestones: state.data.milestones.length,
      commitmentCount,
      intentionCount,
      sampleSections: state.data.sections.slice(0, 3),
      sampleMilestones: state.data.milestones.slice(0, 3),
    };
  }, [state]);

  async function handleFile(file: File | null) {
    if (!file) return;

    setState({ status: "loading" });

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = parseRoadmapFile(parsed);

      if (!result.success) {
        setState({ status: "error", fileName: file.name, error: result.error });
        return;
      }

      setState({
        status: "ready",
        fileName: file.name,
        data: roadmapFileToImportedData(result.data),
      });
    } catch (error) {
      setState({
        status: "error",
        fileName: file.name,
        error: error instanceof Error ? error.message : "Unable to read the file.",
      });
    }
  }

  function handleBrowse(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    void handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleDownloadSkill() {
    downloadTextFile("SKILL.md", createRoadmapSkillMarkdown());
  }

  function handleDownloadSample() {
    downloadTextFile("roadmap-template.json", createRoadmapSampleJsonText(), "application/json");
  }

  async function submit() {
    if (state.status !== "ready") return;
    setIsImporting(true);
    try {
      await onImport(state.data);
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">Import roadmap JSON</DialogTitle>
          <DialogDescription>
            Drop a roadmap JSON file here or browse for one. The file is validated before import,
            and you can preview the contents first.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleBrowse}
        />

        <div
          className={cn(
            "rounded-lg border border-dashed p-5 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border bg-secondary/20",
          )}
          onClick={openPicker}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-md border border-border bg-card p-2 text-muted-foreground">
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-primary">Drag and drop a roadmap JSON file here</div>
              <div className="mt-1 text-sm text-muted-foreground">
                The file should use the `horizon-roadmap` schema. Unknown fields are ignored by the
                spec docs, but the current validator expects a clean v1 file.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    openPicker();
                  }}
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Browse files
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDownloadSkill();
                  }}
                >
                  Download skill
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDownloadSample();
                  }}
                >
                  Download sample
                </Button>
              </div>
            </div>
          </div>
        </div>

        {state.status === "loading" && (
          <div className="rounded-md border border-border bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
            Validating file...
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Could not parse {state.fileName ?? "this file"}.</div>
                <div className="mt-1 text-xs leading-relaxed">{state.error}</div>
              </div>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-base font-medium text-primary">
                  {preview.title}
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {preview.scale} view
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{preview.sections} sections</div>
                <div>{preview.milestones} milestones</div>
              </div>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <Stat label="Commitments" value={preview.commitmentCount.toString()} />
              <Stat label="Intentions" value={preview.intentionCount.toString()} />
              <Stat label="Anchor" value={preview.anchor} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Sections
                </div>
                <div className="space-y-1">
                  {preview.sampleSections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between rounded-md border border-border bg-card px-2 py-1.5 text-sm"
                    >
                      <span className="truncate">{section.title}</span>
                      <span className="text-xs text-muted-foreground">{section.color}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Milestones
                </div>
                <div className="space-y-1">
                  {preview.sampleMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
                    >
                      <div className="truncate font-medium text-primary">{milestone.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {milestone.date} · {milestone.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={state.status !== "ready" || isImporting}>
            Import roadmap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-primary">{value}</div>
    </div>
  );
}
