import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth/AuthGate";
import { Board } from "@/components/roadmap/Board";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AuthGate>
      <Board />
    </AuthGate>
  );
}
