import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useShellCopy } from "@/lib/app-locale";
import { useRoadmap } from "@/lib/roadmap-store";

type InviteState =
  | { phase: "idle" }
  | { phase: "accepting" }
  | { phase: "accepted"; message: string }
  | { phase: "invalid"; message: string }
  | { phase: "expired"; message: string }
  | { phase: "wrong-account"; message: string };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const copy = useShellCopy();
  const initializeCloud = useRoadmap((state) => state.initializeCloud);
  const initializeLocal = useRoadmap((state) => state.initializeLocal);
  const acceptProjectInvite = useRoadmap((state) => state.acceptProjectInvite);
  const roadmapStatus = useRoadmap((state) => state.status);
  const previousUserId = useRef<string | null>(null);
  const handledInviteToken = useRef<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(() => getInviteToken());
  const [inviteState, setInviteState] = useState<InviteState>({ phase: "idle" });

  useEffect(() => {
    if (loading) return;

    if (user) {
      previousUserId.current = user.id;
      void initializeCloud(user.id);
      return;
    }

    if (previousUserId.current) previousUserId.current = null;
    handledInviteToken.current = null;
    setInviteState({ phase: "idle" });
    initializeLocal();
  }, [initializeCloud, initializeLocal, loading, user]);

  useEffect(() => {
    if (!user || loading || roadmapStatus !== "ready" || !inviteToken) return;

    if (handledInviteToken.current === inviteToken) return;

    handledInviteToken.current = inviteToken;
    setInviteState({ phase: "accepting" });

    void acceptProjectInvite(inviteToken).then((result) => {
      if (result.status === "accepted") {
        setInviteState({
          phase: "accepted",
          message: copy.authGate.accepted(result.projectTitle),
        });
        clearInviteToken();
        window.setTimeout(() => {
          setInviteState({ phase: "idle" });
        }, 1400);
        return;
      }

      setInviteState({
        phase: result.status,
        message: getInviteMessage(copy, result.status, result.message),
      });

      if (result.status !== "wrong-account") {
        clearInviteToken(setInviteToken);
      }
    });
  }, [acceptProjectInvite, copy, inviteToken, loading, roadmapStatus, user]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        {copy.authGate.loadingSession}
      </div>
    );
  }

  return (
    <>
      <InviteStatusBanner
        state={inviteState}
        onDismiss={() => setInviteState({ phase: "idle" })}
        onSwitchAccount={() => void signOut()}
      />
      {children}
    </>
  );
}

function InviteStatusBanner({
  state,
  onDismiss,
  onSwitchAccount,
}: {
  state: InviteState;
  onDismiss: () => void;
  onSwitchAccount: () => void;
}) {
  if (state.phase === "idle") return null;

  const isActionable = state.phase === "wrong-account";

  return (
    <div className="fixed inset-x-0 top-3 z-50 px-3">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-lg border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {copy.authGate.inviteTitle}
          </div>
          <div className="truncate text-sm font-medium text-primary">{state.message}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isActionable ? (
            <>
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                {copy.authGate.dismiss}
              </Button>
              <Button size="sm" onClick={onSwitchAccount}>
                {copy.authGate.tryAnotherAccount}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              {copy.authGate.close}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function getInviteMessage(
  copy: ReturnType<typeof useShellCopy>,
  status: Exclude<InviteState["phase"], "idle" | "accepting" | "accepted">,
  fallback: string,
) {
  switch (status) {
    case "expired":
      return copy.authGate.expired;
    case "wrong-account":
      return copy.authGate.wrongAccount;
    case "invalid":
      return copy.authGate.invalid;
    default:
      return fallback;
  }
}

function getInviteToken() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("invite");
}

function clearInviteToken(setInviteToken: (token: string | null) => void) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  setInviteToken(null);
}
