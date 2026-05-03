import { Button } from "@/components/ui/button";
import { useAuth, isSupabaseConfigured } from "@/lib/auth";

export function SignInScreen() {
  const { signInWithGoogle, error } = useAuth();
  const hasInvite =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("invite");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm rounded-xl border border-border/70 bg-card/95 p-6 shadow-sm">
        <div className="space-y-2">
          <div className="font-display text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Roadmap
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-primary">
            {hasInvite ? "Join a shared timeline" : "Sign in to your planning surface"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {hasInvite
              ? "Sign in with the invited account to join the shared project and continue editing."
              : "Persistent private roadmaps, personal projects, and milestone planning across the year."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={signInWithGoogle} disabled={!isSupabaseConfigured}>
            {hasInvite ? "Continue with Google and join" : "Continue with Google"}
          </Button>
          {!isSupabaseConfigured && (
            <p className="rounded-md border border-dashed border-border bg-secondary/35 px-3 py-2 text-xs text-muted-foreground">
              Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
            </p>
          )}
          {hasInvite && (
            <p className="rounded-md border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
              An invite link was found in the URL. After sign-in, the shared project will open
              automatically.
            </p>
          )}
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
