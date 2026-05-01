import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRoadmap } from "@/lib/roadmap-store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const initializeCloud = useRoadmap((state) => state.initializeCloud);
  const initializeLocal = useRoadmap((state) => state.initializeLocal);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (user) {
      previousUserId.current = user.id;
      void initializeCloud(user.id);
      return;
    }

    if (previousUserId.current) previousUserId.current = null;
    initializeLocal();
  }, [initializeCloud, initializeLocal, loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading session...
      </div>
    );
  }

  return children;
}
