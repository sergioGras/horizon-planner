import { supabase } from "./supabase";
import type { Milestone, Section } from "./roadmap-store";

export type ProjectDisplayLink = {
  id: string;
  projectId: string;
  createdAt: string;
};

export type DisplayRoadmap = {
  project: {
    id: string;
    title: string;
    updatedAt: string;
  };
  sections: Section[];
  milestones: Milestone[];
};

type DisplayRoadmapPayload = {
  project: {
    id: string;
    title: string;
    updatedAt: string;
  };
  sections: Array<Omit<Section, "projectId">>;
  milestones: Array<Omit<Milestone, "projectId">>;
};

function requireDisplayClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function fetchDisplayRoadmap(token: string): Promise<DisplayRoadmap> {
  const { data, error } = await requireDisplayClient().rpc("get_display_roadmap", {
    p_token: token,
  });
  if (error) throw error;

  const payload = data as DisplayRoadmapPayload | null;
  if (!payload?.project) throw new Error("Display roadmap not found.");

  return {
    project: payload.project,
    sections: payload.sections.map((section) => ({
      ...section,
      projectId: payload.project.id,
    })),
    milestones: payload.milestones.map((milestone) => ({
      ...milestone,
      projectId: payload.project.id,
    })),
  };
}

export async function listProjectDisplayLinks(projectId: string): Promise<ProjectDisplayLink[]> {
  const { data, error } = await requireDisplayClient()
    .from("project_display_links")
    .select("id, project_id, created_at")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((link) => ({
    id: link.id,
    projectId: link.project_id,
    createdAt: link.created_at,
  }));
}

export async function createProjectDisplayLink(projectId: string) {
  const { data, error } = await requireDisplayClient().rpc("create_project_display_link", {
    p_project_id: projectId,
  });
  if (error) throw error;

  const link = Array.isArray(data) ? data[0] : data;
  if (!link) throw new Error("Display link could not be created.");

  return {
    id: (link as { display_link_id: string }).display_link_id,
    token: (link as { token: string }).token,
    createdAt: (link as { created_at: string }).created_at,
  };
}

export async function revokeProjectDisplayLink(displayLinkId: string) {
  const { error } = await requireDisplayClient().rpc("revoke_project_display_link", {
    p_display_link_id: displayLinkId,
  });
  if (error) throw error;
}
