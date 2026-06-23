import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Mail, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

type Mode = "login" | "signup" | "email-sent";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completato")
          .eq("id", session.user.id)
          .maybeSingle();
        navigate({ to: profile?.onboarding_completato ? "/home" : "/onboarding" });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: nome },
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/onboarding" });
        } else {
          setMode("email-sent");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore di autenticazione");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error("Impossibile reinviare l'email");
    } else {
      toast.success("Email inviata di nuovo!");
    }
    setResending(false);
  };

  if (mode === "email-sent") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Logo />
          </div>
          <div className="rounded-2xl bg-surface p-8 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "color-mix(in oklab, var(--color-accent) 15%, transparent)" }}>
              <Mail className="h-6 w-6" style={{ color: "var(--color-accent)" }} />
            </div>
            <h2 className="text-lg font-semibold">Controlla la tua email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Abbiamo inviato un link di conferma a{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Clicca il link per attivare il tuo account.
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-input bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {resending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Reinvia email
            </button>
            <div className="mt-4">
              <button
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                ← Torna al login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, oklch(0.66 0.28 295) 0%, transparent 70%)", animation: "breathe 8s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.21 25) 0%, transparent 70%)", animation: "breathe 6s 2s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
      </div>

      <div className="relative w-full max-w-md" style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Il tuo coach personale, sempre con te.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-card sm:p-8">
          <div className="mb-6 flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === "login" ? "bg-surface text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === "signup" ? "bg-surface text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="label-caps mb-1.5 block text-muted-foreground">Nome</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Come ti chiami?"
                />
              </div>
            )}
            <div>
              <label className="label-caps mb-1.5 block text-muted-foreground">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                placeholder="tu@example.com"
              />
            </div>
            <div>
              <label className="label-caps mb-1.5 block text-muted-foreground">Password</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                placeholder="Almeno 6 caratteri"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Attendi…" : mode === "signup" ? "Crea account" : "Accedi"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Continuando accetti i termini di servizio di RunHub AI.
        </p>
      </div>
    </div>
  );
}

