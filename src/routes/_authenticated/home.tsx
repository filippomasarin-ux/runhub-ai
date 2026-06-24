import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Plus, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { SportDot } from "@/components/SportChip";
import { sportInfo } from "@/lib/sports";
import { AddActivityDialog } from "@/components/AddActivityDialog";
import { toast } from "sonner";
import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";
import { TrainingLoadCard } from "@/components/TrainingLoadCard";
import { VolumeCard } from "@/components/VolumeCard";
import { AerobicoCard } from "@/components/AerobicoCard";
import { getAttivitaAnalytics } from "@/lib/attivita.functions";
import type { AttivitaForAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/home")({
  ssr: false,
  component: HomePage,
});

type Attivita = {
  id: string;
  sport_type: string | null;
  data: string;
  durata_min: number | null;
  distanza_km: number | null;
  rpe: number | null;
};

type Profile = { nome: string | null };

function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [analytics, setAnalytics] = useState<AttivitaForAnalytics[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRpe, setEditRpe] = useState<{ id: string; value: number } | null>(null);
  const fetchAnalytics = useServerFn(getAttivitaAnalytics);

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);
    const [{ data: p }, { data: a }, an] = await Promise.all([
      supabase.from("profiles").select("nome").eq("id", auth.user.id).maybeSingle(),
      supabase
        .from("attivita")
        .select("id, sport_type, data, durata_min, distanza_km, rpe")
        .eq("user_id", auth.user.id)
        .order("data", { ascending: false })
        .limit(20),
      fetchAnalytics().catch(() => [] as AttivitaForAnalytics[]),
    ]);
    setProfile(p);
    setAttivita(a ?? []);
    setAnalytics(an as AttivitaForAnalytics[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stato = useMemo(() => computeStato(attivita), [attivita]);
  const settimana = useMemo(() => {
    const since = Date.now() - 7 * 86400000;
    return attivita.filter((a) => new Date(a.data).getTime() >= since);
  }, [attivita]);
  const kmSettimana = settimana.reduce((s, a) => s + (a.distanza_km ?? 0), 0);

  const saveRpe = async () => {
    if (!editRpe) return;
    const { error } = await supabase.from("attivita").update({ rpe: editRpe.value }).eq("id", editRpe.id);
    if (error) {
      toast.error("Errore");
      return;
    }
    toast.success("RPE salvato");
    setEditRpe(null);
    load();
  };

  return (
    <AppShell>
      <HomeHeader name={profile?.nome?.split(" ")[0] ?? null} />

      <div className="px-5 pb-10 md:px-0" style={{ animation: "fade-up 0.4s 0.05s cubic-bezier(0.16,1,0.3,1) both" }}>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton h={172} />
              <Skeleton h={220} />
              <Skeleton h={56} />
            </div>
            <div className="space-y-3">
              <Skeleton h={200} />
              <Skeleton h={160} />
              <Skeleton h={280} />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-3">
              {/* Status card */}
              <section
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  background: "oklch(0.115 0.025 295)",
                  boxShadow: "0 1px 0 oklch(1 0 0 / 5%) inset, 0 8px 24px oklch(0 0 0 / 40%)",
                  borderLeft: `3px solid ${stato.color}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in oklab, ${stato.color} 14%, transparent)` }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stato.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="label-caps" style={{ color: stato.color }}>Come stai oggi</p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight">{stato.label}</p>
                    <p className="mt-1 text-sm leading-snug" style={{ color: "oklch(0.6 0.02 290)" }}>
                      {stato.message}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4" style={{ borderColor: "oklch(1 0 0 / 7%)" }}>
                  <StatCell
                    label="Sessioni"
                    value={`${settimana.length}`}
                    sub="questa settimana"
                  />
                  <StatCell
                    label="Km"
                    value={kmSettimana ? kmSettimana.toFixed(1) : "—"}
                    sub="settimanali"
                  />
                  <StatCell
                    label="Ultima"
                    value={attivita[0] ? formatRelDay(attivita[0].data) : "—"}
                    sub="attività"
                  />
                </div>
              </section>

              {/* Recent activities */}
              <section
                className="rounded-2xl p-5"
                style={{
                  background: "oklch(0.115 0.025 295)",
                  boxShadow: "0 1px 0 oklch(1 0 0 / 5%) inset, 0 8px 24px oklch(0 0 0 / 40%)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "oklch(0.6 0.02 290)" }}>
                    Ultime attività
                  </h2>
                  {attivita.length > 5 && (
                    <span className="text-xs" style={{ color: "oklch(0.5 0.02 290)" }}>{attivita.length} totali</span>
                  )}
                </div>

                {attivita.length === 0 ? (
                  <div
                    className="rounded-xl border border-dashed py-10 text-center"
                    style={{ borderColor: "oklch(1 0 0 / 10%)" }}
                  >
                    <p className="text-sm" style={{ color: "oklch(0.55 0.02 290)" }}>Nessuna attività ancora.</p>
                    <button
                      onClick={() => setAddOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                      style={{ background: "var(--color-accent)", color: "white" }}
                    >
                      <Plus size={13} /> Aggiungi la prima
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {attivita.slice(0, 5).map((a) => {
                      const info = sportInfo(a.sport_type);
                      return (
                        <li
                          key={a.id}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100"
                          style={{ borderLeft: `2px solid ${info.color}` }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-semibold">{info.label}</span>
                              <span className="shrink-0 text-xs" style={{ color: "oklch(0.5 0.02 290)" }}>
                                {formatRelDay(a.data)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs" style={{ color: "oklch(0.55 0.02 290)" }}>
                              {a.distanza_km ? `${a.distanza_km.toFixed(1)} km · ` : ""}{a.durata_min ?? "?"} min
                            </p>
                          </div>
                          {a.rpe ? (
                            <span
                              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                              style={{ background: "oklch(0.18 0.03 295)", color: "var(--color-foreground)" }}
                            >
                              {a.rpe}
                            </span>
                          ) : (
                            <button
                              onClick={() => setEditRpe({ id: a.id, value: 6 })}
                              className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                              style={{
                                borderColor: "oklch(1 0 0 / 10%)",
                                color: "oklch(0.5 0.02 290)",
                              }}
                            >
                              RPE
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Coach CTA */}
              <a
                href="/coach"
                className="group block rounded-2xl p-px transition-all duration-300 hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, oklch(0.66 0.28 295 / 70%) 0%, oklch(0.66 0.28 295 / 25%) 60%, oklch(1 0 0 / 6%) 100%)",
                }}
              >
                <div
                  className="flex items-center gap-4 rounded-2xl px-5 py-4"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.13 0.04 295) 0%, oklch(0.105 0.025 295) 100%)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.66 0.28 295), oklch(0.54 0.24 315))",
                      boxShadow: "0 0 20px oklch(0.66 0.28 295 / 45%)",
                    }}
                  >
                    <Zap size={16} strokeWidth={2.5} color="white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold tracking-tight">Coach AI</p>
                    <p className="text-xs" style={{ color: "oklch(0.55 0.02 290)" }}>
                      Piani · Recupero · Analisi · Nutrizione
                    </p>
                  </div>
                  <span
                    className="text-base font-light transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: "var(--color-accent)" }}
                  >
                    →
                  </span>
                </div>
              </a>
            </div>

            {/* Right column: analytics */}
            <div className="space-y-3">
              {analytics === null ? (
                <>
                  <Skeleton h={200} />
                  <Skeleton h={160} />
                  <Skeleton h={280} />
                </>
              ) : (
                <>
                  <TrainingLoadCard attivita={analytics} />
                  <VolumeCard attivita={analytics} />
                  <AerobicoCard attivita={analytics} />
                  <WeeklyPlanCard attivita={analytics} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-24 right-5 z-30 flex h-13 w-13 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 md:bottom-8"
        style={{
          background: "oklch(0.66 0.28 295)",
          boxShadow: "0 0 0 1px oklch(0.66 0.28 295 / 30%), 0 4px 20px oklch(0.66 0.28 295 / 50%)",
        }}
        aria-label="Aggiungi attività"
      >
        <Plus size={22} color="white" strokeWidth={2.5} />
      </button>

      {userId && (
        <AddActivityDialog
          userId={userId}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={load}
        />
      )}

      {editRpe && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "oklch(0 0 0 / 55%)" }}
          onClick={() => setEditRpe(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-6 sm:rounded-2xl"
            style={{ background: "oklch(0.115 0.025 295)", boxShadow: "0 -8px 40px oklch(0 0 0 / 60%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold tracking-tight">Quanto è stata dura?</h3>
            <div className="my-5 rounded-xl py-5 text-center" style={{ background: "oklch(0.09 0.02 295)" }}>
              <div className="text-6xl font-black tabular-nums" style={{ color: "var(--color-accent)" }}>
                {editRpe.value}
              </div>
              <p className="mt-1 text-xs" style={{ color: "oklch(0.5 0.02 290)" }}>su 10</p>
              <input
                type="range" min={1} max={10} value={editRpe.value}
                onChange={(e) => setEditRpe({ ...editRpe, value: Number(e.target.value) })}
                className="mt-4 w-3/4 accent-[var(--color-accent)]"
              />
              <div className="mx-auto mt-1 flex w-3/4 justify-between text-[11px]" style={{ color: "oklch(0.5 0.02 290)" }}>
                <span>Facile</span><span>Massimale</span>
              </div>
            </div>
            <button
              onClick={saveRpe}
              className="w-full rounded-xl py-3 text-sm font-bold tracking-wide text-white"
              style={{ background: "oklch(0.66 0.28 295)" }}
            >
              Salva RPE
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="label-caps" style={{ color: "oklch(0.5 0.02 290)" }}>{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px]" style={{ color: "oklch(0.48 0.02 290)" }}>{sub}</p>
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return (
    <div
      className="rounded-2xl"
      style={{
        height: h,
        background: "linear-gradient(90deg, oklch(0.115 0.025 295) 0%, oklch(0.14 0.03 295) 50%, oklch(0.115 0.025 295) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s linear infinite",
      }}
    />
  );
}

function computeStato(attivita: Attivita[]) {
  if (attivita.length === 0) {
    return {
      color: "var(--color-accent)",
      label: "Pronto",
      message: "Aggiungi la tua prima attività per ricevere consigli personalizzati.",
    };
  }
  const now = Date.now();
  const ultima = attivita[0];
  const oreUltima = (now - new Date(ultima.data).getTime()) / 3600000;
  const ultimi4gg = attivita.filter((a) => (now - new Date(a.data).getTime()) / 86400000 <= 4);

  if ((oreUltima < 24 && (ultima.rpe ?? 0) >= 8) || ultimi4gg.length >= 3) {
    return {
      color: "var(--color-destructive)",
      label: "Affaticato",
      message: "Hai accumulato carico. Privilegia recupero o sessioni leggere.",
    };
  }
  if (oreUltima >= 48 && (ultima.rpe ?? 6) <= 6) {
    return {
      color: "#10b981",
      label: "Fresco",
      message: "Hai riposato — sei pronto per una sessione di qualità.",
    };
  }
  return {
    color: "var(--color-warning)",
    label: "Forma stabile",
    message: "Continua con il tuo piano.",
  };
}

function formatRelDay(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Oggi";
  if (days === 1) return "Ieri";
  if (days < 7) return `${days}g fa`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { text: "Notte fonda", sub: "Il corpo cresce mentre dormi." };
  if (h < 12) return { text: "Buongiorno", sub: "La sessione mattutina brucia il 20% in più." };
  if (h < 17) return { text: "Buon pomeriggio", sub: "Il picco di forza è tra le 14 e le 18." };
  if (h < 21) return { text: "Buona sera", sub: "Ottimo momento per cardio o tecnica." };
  return { text: "Buona notte", sub: "Pianifica il riposo: è parte dell'allenamento." };
}

function HomeHeader({ name }: { name: string | null }) {
  const { text, sub } = getGreeting();
  return (
    <header
      className="relative overflow-hidden px-5 pt-7 pb-5 md:px-0"
      style={{ animation: "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-8 h-56 w-56 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.66 0.28 295 / 22%) 0%, transparent 65%)",
          animation: "breathe 7s ease-in-out infinite",
        }}
      />

      <div className="relative flex items-end justify-between gap-4">
        <div>
          <p
            className="label-caps"
            style={{ color: "var(--color-accent)", letterSpacing: "0.12em" }}
          >
            {text}
          </p>
          <h1 className="mt-0.5 text-4xl font-black tracking-tight md:text-5xl">
            {name ?? "Atleta"}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "oklch(0.55 0.02 290)" }}>{sub}</p>
        </div>
      </div>

      {/* Separator */}
      <div
        className="mt-5 h-px"
        style={{ background: "linear-gradient(90deg, oklch(0.66 0.28 295 / 35%), oklch(1 0 0 / 4%) 60%, transparent)" }}
      />
    </header>
  );
}
