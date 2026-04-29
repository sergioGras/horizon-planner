import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/roadmap/Board";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <Board />;
}
