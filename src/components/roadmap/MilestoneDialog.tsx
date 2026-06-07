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
import { useShellCopy } from "@/lib/app-locale";
import { useRoadmap, type Milestone, type MilestoneType } from "@/lib/roadmap-store";
import { toLocalISODate } from "@/lib/date-utils";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone;
  defaultSectionId?: string;
  defaultDate?: string;
};

export function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  defaultSectionId,
  defaultDate,
}: Props) {
  const copy = useShellCopy();
  const sections = useRoadmap((s) => s.sections);
  const addMilestone = useRoadmap((s) => s.addMilestone);
  const updateMilestone = useRoadmap((s) => s.updateMilestone);
  const deleteMilestone = useRoadmap((s) => s.deleteMilestone);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState<MilestoneType>("commitment");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description ?? "");
      setSectionId(milestone.sectionId);
      setDate(parseISO(milestone.date));
      setType(milestone.type ?? "commitment");
    } else {
      setTitle("");
      setDescription("");
      setSectionId(defaultSectionId ?? sections[0]?.id ?? "");
      setDate(defaultDate ? parseISO(defaultDate) : new Date());
      setType("commitment");
    }
  }, [open, milestone, defaultSectionId, defaultDate, sections]);

  const canSave = title.trim().length > 0 && sectionId && date;

  function save() {
    if (!canSave || !date) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      sectionId,
      date: toLocalISODate(date),
      type,
    };
    if (milestone) void updateMilestone(milestone.id, payload);
    else void addMilestone(payload);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight">
              {milestone ? copy.milestoneDialog.editTitle : copy.milestoneDialog.newTitle}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {copy.milestoneDialog.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">{copy.milestoneDialog.titleLabel}</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.milestoneDialog.titlePlaceholder}
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="section">{copy.milestoneDialog.sectionLabel}</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger id="section" aria-label={copy.milestoneDialog.sectionLabel}>
                    <SelectValue placeholder={copy.milestoneDialog.sectionPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="milestone-type">{copy.milestoneDialog.typeLabel}</Label>
                <Select value={type} onValueChange={(value) => setType(value as MilestoneType)}>
                  <SelectTrigger id="milestone-type" aria-label={copy.milestoneDialog.typeLabel}>
                    <SelectValue placeholder={copy.milestoneDialog.typePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commitment">{copy.milestoneDialog.commitment}</SelectItem>
                    <SelectItem value="intention">{copy.milestoneDialog.intention}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="milestone-date">{copy.milestoneDialog.dateLabel}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="milestone-date"
                      variant="outline"
                      className={cn(
                        "w-full min-w-0 justify-start overflow-hidden text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                      aria-label={copy.milestoneDialog.dateLabel}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                      <span className="min-w-0 truncate">
                        {date ? format(date, "PPP") : copy.milestoneDialog.datePlaceholder}
                      </span>
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
              <Label htmlFor="desc">{copy.milestoneDialog.descriptionLabel}</Label>
              <Textarea
                id="desc"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={copy.milestoneDialog.descriptionPlaceholder}
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
                  {copy.milestoneDialog.delete}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {copy.milestoneDialog.cancel}
              </Button>
              <Button onClick={save} disabled={!canSave}>
                {milestone ? copy.milestoneDialog.save : copy.milestoneDialog.create}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {milestone && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={copy.milestoneDialog.deleteTitle}
          description={copy.milestoneDialog.deleteDescription}
          confirmLabel={copy.milestoneDialog.delete}
          destructive
          onConfirm={() => {
            void deleteMilestone(milestone.id);
            setConfirmDelete(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}
