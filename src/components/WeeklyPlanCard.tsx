import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw, Moon } from "lucide-react";
import { toast } from "sonner";
import { generaPianoSettimanale, getPianoCorrente, type PianoSettimanale } from "@/lib/piani.functions";
import { sportInfo } from "@/lib/sports";
import { SportDot } from "./SportChip";

type Piano = PianoSettimanale & { settimana_inizio: string };

export function WeeklyPlanCard() {
  const fetchPiano = useServerFn(getPianoCorrente);
  const genPiano = useServerFn(generaPianoSettimanale);
  const [piano, setPiano] = useState<Piano | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchPiano({})
      .then((p) => setPiano(p as Piano | null))
      .finally(() => setLoading(false));
  }, [fetchPiano]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const p = await genPiano({});
      setPiano(p as Piano);
      toast.success("Piano generato");
    } catch (e) {
      toast.error("Errore nella generazione");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="h-44 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!piano) {
    return (
      <section className="relative overflow-hidden rounded-2xl p-5 shadow-card" style={{ background: "linear-gradient(135deg, var(--color-surface) 0%, color-mix(in oklab, var(--color-accent) 14%, var(--color-surface)) 100%)" }}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--color-accent)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold">Il tuo piano settimanale</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generato dall'AI sulla base del tuo profilo, obiettivi e ultime attività.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? "Genero il piano…" : "Genera il mio piano"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="label-caps text-muted-foreground">Piano settimanale</p>
          <h2 className="mt-0.5 text-base font-semibold">Settimana del {formatDate(piano.settimana_inizio)}</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          aria-label="Rigenera"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
        </button>
      </div>

      <ul className="space-y-1.5">
        {piano.giorni.map((g, i) => {
          const info = sportInfo(g.sport);
          const isOpen = openIdx === i;
          return (
            <li key={i}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                <div className="w-9 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{g.giorno.slice(0, 3)}</p>
                </div>
                {g.riposo ? (
                  <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <SportDot sport={g.sport} size={10} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.titolo}</p>
                  {!g.riposo && (
                    <p className="text-[11px] text-muted-foreground">
                      {info.label} · {g.durata_min} min · RPE {g.intensita_rpe}
                    </p>
                  )}
                </div>
              </button>
              {isOpen && !g.riposo && (
                <p className="ml-12 mr-2 mt-1 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {g.descrizione}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {piano.note && (
        <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Note del coach.</span> {piano.note}
        </p>
      )}
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
}
