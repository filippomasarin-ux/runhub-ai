import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { stravaExchangeCode } from "@/lib/strava.functions";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/strava/callback")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    code: (s.code as string | undefined) ?? "",
    error: (s.error as string | undefined) ?? "",
  }),
  component: StravaCallbackPage,
});

function StravaCallbackPage() {
  const navigate = useNavigate();
  const { code, error } = useSearch({ from: "/strava/callback" });
  const exchange = useServerFn(stravaExchangeCode);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (error) {
      toast.error("Connessione Strava annullata");
      navigate({ to: "/profilo" });
      return;
    }

    if (!code) {
      toast.error("Codice Strava mancante");
      navigate({ to: "/profilo" });
      return;
    }

    exchange({ data: { code } })
      .then(() => {
        toast.success("Strava connesso! Sincronizzazione in corso…");
        navigate({ to: "/profilo" });
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Errore connessione Strava");
        navigate({ to: "/profilo" });
      });
  }, [code, error, exchange, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <Logo />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-accent" />
        <p className="text-sm text-muted-foreground">Connessione a Strava in corso…</p>
      </div>
    </div>
  );
}
