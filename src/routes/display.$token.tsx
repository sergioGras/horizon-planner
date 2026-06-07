import { createFileRoute } from "@tanstack/react-router";
import { DisplayBoard } from "@/components/roadmap/DisplayBoard";

export const Route = createFileRoute("/display/$token")({
  component: DisplayRoadmapRoute,
});

function DisplayRoadmapRoute() {
  const { token } = Route.useParams();
  return <DisplayBoard token={token} />;
}
