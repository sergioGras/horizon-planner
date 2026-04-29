import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRoadmap, type Milestone } from "@/lib/roadmap-store";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** when set, dialog is in edit mode */
  milestone?: Milestone;
  /** initial section id when creating */
  defaultSectionId?: string;
  /** initial date when creating */
  defaultDate?: string;
};

export function MilestoneDialog({ open, onOpenChange, milestone, defaultSectionId, defaultDate }: Props) {
  const sections = useRoadmap((s) => s.sections);
  const addMilestone = useRoadmap((s) => s.addMilestone);
  const updateMilestone = useRoadmap((s) => s.updateMilestone);
  const deleteMilestone = useRoadmap((s) => s.deleteMilestone);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description);
      setSectionId(milestone.sectionId);
      setDate(parseISO(milestone.date));
    } else {
      setTitle("");
      setDescription("");
      setSectionId(defaultSectionId ?? sections[0]?.id ?? "");
      setDate(defaultDate ? parseISO(defaultDate) : new Date());
    }
  }, [open, milestone, defaultSectionId, defaultDate, sections]);

  const canSave = title.trim().length > 0 && sectionId && date;

  function save() {
    if (!canSave || !date) return;
    const payload = {
      title: title.trim(),
      description: description.trim(),
      sectionId,
      date: date.toISOString().slice(0, 10),
    };
    if (milestone) updateMilestone(milestone.id, payload);
    else addMilestone(payload);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight">
              {milestone ? "Edit milestone" : "New milestone"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A point-in-time event on your roadmap.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Foundation refactor v1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional context."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex !flex-row sm:!justify-between items-center gap-3 pt-2">
            <div>
              {milestone && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!canSave}>
                {milestone ? "Save changes" : "Create milestone"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {milestone && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete this milestone?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            deleteMilestone(milestone.id);
            setConfirmDelete(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}