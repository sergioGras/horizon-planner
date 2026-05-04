import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardHeader } from "./BoardHeader";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyBoard } from "./EmptyBoard";
import { ImportLocalDialog } from "./ImportLocalDialog";
import { MilestoneDialog } from "./MilestoneDialog";
import { ShareProjectDialog } from "./ShareProjectDialog";
import { RoadmapImportDialog } from "./RoadmapImportDialog";
import { ProjectDialog } from "./ProjectDialog";
import { SectionDialog } from "./SectionDialog";
import { SectionLane } from "./SectionLane";
import { TimelineAxis } from "./TimelineAxis";
import { useAuth } from "@/lib/auth";
import {
  getImportDecisionKey,
  getSeedRoadmapData,
  readLocalRoadmapData,
  useRoadmap,
  type LocalRoadmapData,
  type Milestone,
  type Project,
  type Section,
} from "@/lib/roadmap-store";
import { importedRoadmapToLocalShape, type ImportedRoadmapData } from "@/lib/roadmap-json";
import { orderSections } from "@/lib/roadmap-view";
import { getWindow, shiftAnchor } from "@/lib/timeline";
import { fromLocalISODate, toLocalISODate, todayISO } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const WHEEL_NAV_THRESHOLD = 36;
const WHEEL_NAV_COOLDOWN_MS = 650;

function hasImportDecision(userId: string) {
  return window.localStorage.getItem(getImportDecisionKey(userId)) === "done";
}

function saveImportDecision(userId: string) {
  window.localStorage.setItem(getImportDecisionKey(userId), "done");
}

export function Board() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const isMobile = useIsMobile();
  const mode = useRoadmap((state) => state.mode);
  const projects = useRoadmap((state) => state.projects);
  const activeProjectId = useRoadmap((state) => state.activeProjectId);
  const sections = useRoadmap((state) => state.sections);
  const milestones = useRoadmap((state) => state.milestones);
  const scale = useRoadmap((state) => state.scale);
  const anchor = useRoadmap((state) => state.anchor);
  const status = useRoadmap((state) => state.status);
  const error = useRoadmap((state) => state.error);
  const setScale = useRoadmap((state) => state.setScale);
  const setAnchor = useRoadmap((state) => state.setAnchor);
  const setActiveProject = useRoadmap((state) => state.setActiveProject);
  const createProject = useRoadmap((state) => state.createProject);
  const renameProject = useRoadmap((state) => state.renameProject);
  const deleteProject = useRoadmap((state) => state.deleteProject);
  const leaveProject = useRoadmap((state) => state.leaveProject);
  const addSection = useRoadmap((state) => state.addSection);
  const renameSection = useRoadmap((state) => state.renameSection);
  const deleteSection = useRoadmap((state) => state.deleteSection);
  const moveSection = useRoadmap((state) => state.moveSection);
  const importLocalRoadmap = useRoadmap((state) => state.importLocalRoadmap);

  const orderedSections = useMemo(() => orderSections(sections), [sections]);
  const anchorDate = useMemo(() => fromLocalISODate(anchor), [anchor]);
  const window = useMemo(() => getWindow(anchorDate, scale), [anchorDate, scale]);
  const lastWheelNavigationAt = useRef(0);
  const boardViewportRef = useRef<HTMLDivElement>(null);
  const hasProvisionedInitialProject = useRef(false);
  const laneDensity = isMobile
    ? "dense"
    : orderedSections.length > 12
      ? "dense"
      : orderedSections.length > 8
        ? "compact"
        : "comfortable";

  const [milestoneDialog, setMilestoneDialog] = useState<{
    open: boolean;
    milestone?: Milestone;
    defaultSectionId?: string;
  }>({ open: false });
  const [sectionAddOpen, setSectionAddOpen] = useState(false);
  const [sectionRename, setSectionRename] = useState<Section | null>(null);
  const [sectionDelete, setSectionDelete] = useState<Section | null>(null);
  const [projectAddOpen, setProjectAddOpen] = useState(false);
  const [projectRename, setProjectRename] = useState<Project | null>(null);
  const [projectDelete, setProjectDelete] = useState<Project | null>(null);
  const [shareProjectOpen, setShareProjectOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [localImportData, setLocalImportData] = useState<LocalRoadmapData | null>(null);
  const [roadmapImportOpen, setRoadmapImportOpen] = useState(false);

  const windowRange = `${format(window.start, "MMM d, yyyy")} - ${format(window.activeEnd, "MMM d, yyyy")}`;
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const isSaving = status === "saving";
  const isCloudMode = mode === "cloud";

  function navigateWindow(dir: -1 | 1) {
    setAnchor(toLocalISODate(shiftAnchor(anchorDate, scale, dir)));
  }

  useEffect(() => {
    if (
      !user ||
      status !== "ready" ||
      projects.length > 0 ||
      hasProvisionedInitialProject.current
    ) {
      return;
    }

    hasProvisionedInitialProject.current = true;
    const localData = readLocalRoadmapData();

    if (localData && !hasImportDecision(user.id)) {
      setLocalImportData(localData);
      setImportOpen(true);
      return;
    }

    saveImportDecision(user.id);
    void importLocalRoadmap(getSeedRoadmapData(), "Roadmap");
  }, [importLocalRoadmap, projects.length, status, user]);

  useEffect(() => {
    const node = boardViewportRef.current;
    if (!node) return;

    const handleWheel = (event: WheelEvent) => {
      const horizontalDelta = Math.abs(event.deltaX);
      const verticalDelta = Math.abs(event.deltaY);
      const horizontalIntent =
        horizontalDelta > verticalDelta * 1.2 ||
        (event.shiftKey && verticalDelta > horizontalDelta);
      const movement = horizontalDelta || verticalDelta;
      if (!horizontalIntent || movement < WHEEL_NAV_THRESHOLD) return;

      event.preventDefault();

      const now = Date.now();
      if (now - lastWheelNavigationAt.current < WHEEL_NAV_COOLDOWN_MS) return;

      lastWheelNavigationAt.current = now;
      setAnchor(toLocalISODate(shiftAnchor(anchorDate, scale, event.deltaX > 0 ? 1 : -1)));
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [anchorDate, scale, setAnchor]);

  function markImportDecision() {
    if (!user) return;
    saveImportDecision(user.id);
  }

  function handleImportLocalData() {
    if (!localImportData) return;
    markImportDecision();
    setImportOpen(false);
    void importLocalRoadmap(localImportData, "Personal Roadmap");
  }

  function handleStartBlank() {
    markImportDecision();
    setImportOpen(false);
    void createProject("Personal Roadmap");
  }

  function handleImportRoadmapFile(data: ImportedRoadmapData) {
    const localShape = importedRoadmapToLocalShape(data);
    void importLocalRoadmap(localShape, data.title?.trim() || "Personal Roadmap");
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 w-full flex-col">
        <BoardHeader
          projects={projects}
          activeProjectId={activeProjectId}
          user={user}
          windowLabel={window.label}
          windowRange={windowRange}
          scale={scale}
          canCreateMilestone={orderedSections.length > 0}
          isSaving={isSaving}
          onSelectProject={(projectId) => void setActiveProject(projectId)}
          onNewProject={() => setProjectAddOpen(true)}
          onShareProject={() => activeProject && setShareProjectOpen(true)}
          onRenameProject={() => activeProject && setProjectRename(activeProject)}
          onDeleteProject={() => activeProject && setProjectDelete(activeProject)}
          onLeaveProject={() => activeProject && void leaveProject(activeProject.id)}
          onSignIn={() => void signInWithGoogle()}
          onSignOut={() => void signOut()}
          onScaleChange={setScale}
          onPrevious={() => navigateWindow(-1)}
          onNext={() => navigateWindow(1)}
          onToday={() => setAnchor(todayISO())}
          onImportRoadmap={() => setRoadmapImportOpen(true)}
          onAddMilestone={() => setMilestoneDialog({ open: true })}
        />

        <main
          ref={boardViewportRef}
          className={cn(
            "mx-auto flex min-h-0 w-full max-w-[1600px] flex-1",
            isMobile ? "overflow-x-auto overflow-y-hidden px-2 py-2" : "p-3 lg:p-4",
          )}
        >
          {status === "loading" && isCloudMode ? (
            <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading roadmap...
            </div>
          ) : !activeProjectId && isCloudMode ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                <div className="font-display text-lg font-medium text-primary">
                  Create a project
                </div>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Projects keep separate personal roadmaps under the same account.
                </p>
                <Button className="mt-5" onClick={() => setProjectAddOpen(true)}>
                  New project
                </Button>
              </div>
            </div>
          ) : orderedSections.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyBoard onAddSection={() => setSectionAddOpen(true)} />
            </div>
          ) : (
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm",
                isMobile && "min-w-[760px]",
              )}
            >
              <div className="grid h-11 shrink-0 grid-cols-[184px_minmax(0,1fr)] border-b border-border/70 bg-secondary/35 md:grid-cols-[232px_minmax(0,1fr)]">
                <div className="border-r border-border/60 px-3 py-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:px-5">
                  Sections
                </div>
                <div className="relative min-w-0 overflow-hidden">
                  <TimelineAxis window={window} />
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col">
                  {orderedSections.map((section, index) => (
                    <SectionLane
                      key={section.id}
                      section={section}
                      window={window}
                      milestones={milestones}
                      density={laneDensity}
                      isMobile={isMobile}
                      sectionIndex={index}
                      sectionCount={orderedSections.length}
                      onAddMilestone={(sectionId) =>
                        setMilestoneDialog({ open: true, defaultSectionId: sectionId })
                      }
                      onOpenMilestone={(milestone) => setMilestoneDialog({ open: true, milestone })}
                      onRenameSection={setSectionRename}
                      onMoveSection={moveSection}
                      onDeleteSection={setSectionDelete}
                    />
                  ))}
                </div>

                <div className="grid h-11 shrink-0 grid-cols-[184px_minmax(0,1fr)] md:grid-cols-[232px_minmax(0,1fr)]">
                  <div className="border-r border-border/60 bg-card px-3 py-2 md:px-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full justify-start text-muted-foreground hover:text-primary"
                      onClick={() => setSectionAddOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add section
                    </Button>
                  </div>
                  <div className="bg-card" />
                </div>
              </div>
            </div>
          )}
        </main>

        {error && (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-destructive/30 bg-card px-3 py-2 text-xs text-destructive shadow-sm">
            {error}
          </div>
        )}

        <ImportLocalDialog
          open={importOpen}
          localData={localImportData}
          onImport={handleImportLocalData}
          onStartBlank={handleStartBlank}
        />
        <RoadmapImportDialog
          open={roadmapImportOpen}
          onOpenChange={setRoadmapImportOpen}
          onImport={handleImportRoadmapFile}
        />
        <ProjectDialog
          open={projectAddOpen}
          onOpenChange={setProjectAddOpen}
          title="New project"
          confirmLabel="Create project"
          onSubmit={(title) => {
            if (isCloudMode) void createProject(title);
            else void signInWithGoogle();
          }}
        />
        <ProjectDialog
          open={!!projectRename}
          onOpenChange={(open) => !open && setProjectRename(null)}
          title="Rename project"
          confirmLabel="Save"
          initialTitle={projectRename?.title}
          onSubmit={(title) => {
            if (projectRename) void renameProject(projectRename.id, title);
          }}
        />
        <ConfirmDialog
          open={!!projectDelete}
          onOpenChange={(open) => !open && setProjectDelete(null)}
          title={`Delete "${projectDelete?.title}"?`}
          description="All sections and milestones in this project will be deleted. This cannot be undone."
          confirmLabel="Delete project"
          destructive
          onConfirm={() => {
            if (projectDelete) void deleteProject(projectDelete.id);
            setProjectDelete(null);
          }}
        />
        <MilestoneDialog
          open={milestoneDialog.open}
          onOpenChange={(open) => setMilestoneDialog((state) => ({ ...state, open }))}
          milestone={milestoneDialog.milestone}
          defaultSectionId={milestoneDialog.defaultSectionId}
        />
        <ShareProjectDialog
          open={shareProjectOpen}
          onOpenChange={setShareProjectOpen}
          project={activeProject}
        />
        <SectionDialog
          open={sectionAddOpen}
          onOpenChange={setSectionAddOpen}
          title="New section"
          confirmLabel="Create section"
          onSubmit={(name, color) => void addSection(name, color)}
        />
        <SectionDialog
          open={!!sectionRename}
          onOpenChange={(open) => !open && setSectionRename(null)}
          title="Edit section"
          confirmLabel="Save"
          initialName={sectionRename?.title ?? ""}
          initialColor={sectionRename?.color}
          onSubmit={(name, color) =>
            sectionRename && void renameSection(sectionRename.id, name, color)
          }
        />
        <ConfirmDialog
          open={!!sectionDelete}
          onOpenChange={(open) => !open && setSectionDelete(null)}
          title={`Delete "${sectionDelete?.title}"?`}
          description="All milestones in this section will also be deleted. This cannot be undone."
          confirmLabel="Delete section"
          destructive
          onConfirm={() => {
            if (sectionDelete) void deleteSection(sectionDelete.id);
            setSectionDelete(null);
          }}
        />
      </div>
    </div>
  );
}
