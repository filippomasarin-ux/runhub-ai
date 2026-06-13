import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const GiornoSchema = z.object({
  giorno: z.string(),
  data: z.string(),
  sport: z.string(),
  titolo: z.string(),
  durata_min: z.number(),
  intensita_rpe: z.number(),
  descrizione: z.string(),
  riposo: z.boolean(),
});

const PianoSchema = z.object({
  note: z.string(),
  giorni: z.array(GiornoSchema).length(7),
});

export type PianoSettimanale = z.infer<typeof PianoSchema>;

function lunediCorrente(): string {
  const d = new Date();
  const giorno = d.getUTCDay();
  const diff = (giorno + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export const generaPianoSettimanale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const [{ data: profile }, { data: attivita }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "nome,eta,anni_esperienza,sport_primario,sport_secondari,obiettivo_tipo,obiettivo_dettaglio,giorni_disponibili,limitazioni_fisiche",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("attivita")
        .select("sport_type,data,durata_min,distanza_km,rpe")
        .eq("user_id", userId)
        .order("data", { ascending: false })
        .limit(10),
    ]);

    const inizio = lunediCorrente();

    const ctx = `
ATLETA: ${profile?.nome ?? "-"} · ${profile?.eta ?? "-"} anni · ${profile?.anni_esperienza ?? 0} anni di esperienza
Sport principale: ${profile?.sport_primario ?? "-"} · Altri: ${(profile?.sport_secondari ?? []).join(", ") || "-"}
Obiettivo: ${profile?.obiettivo_tipo ?? "-"}${profile?.obiettivo_dettaglio ? ` (${profile.obiettivo_dettaglio})` : ""}
Giorni disponibili: ${(profile?.giorni_disponibili ?? []).join(", ") || "tutti"}
Limitazioni: ${profile?.limitazioni_fisiche || "nessuna"}

ULTIME ATTIVITÀ:
${(attivita ?? []).map((a) => `- ${a.data} · ${a.sport_type ?? "?"} · ${a.durata_min ?? "?"}min${a.distanza_km ? ` · ${a.distanza_km}km` : ""}${a.rpe ? ` · RPE ${a.rpe}` : ""}`).join("\n") || "Nessuna"}

Settimana che inizia il ${inizio} (lunedì).
`;

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const { experimental_output } = await generateText({
      model,
      system: `Sei un coach esperto. Genera un piano settimanale personalizzato in italiano per l'atleta.
- 7 giorni (lun→dom), in ordine cronologico.
- Sport coerenti con quelli praticati: corsa, ciclismo, nuoto, palestra, hiit, yoga, altro.
- Includi 1-2 giorni di riposo (riposo=true, durata_min=0, intensita_rpe=0, sport="altro", titolo="Riposo").
- Bilancia carico e recupero in base alle ultime attività.
- giorno: "Lunedì", "Martedì"... data in formato YYYY-MM-DD a partire dal lunedì indicato.
- intensita_rpe da 1 a 10. descrizione breve (max 30 parole).
- note: 1-2 frasi che spiegano la logica della settimana.`,
      prompt: ctx,
      experimental_output: Output.object({ schema: PianoSchema }),
    });

    const piano = experimental_output;

    const { error } = await supabase
      .from("piani_settimanali")
      .upsert(
        {
          user_id: userId,
          settimana_inizio: inizio,
          giorni: piano.giorni,
          note: piano.note,
        },
        { onConflict: "user_id,settimana_inizio" },
      );
    if (error) throw new Error(error.message);

    return { settimana_inizio: inizio, ...piano };
  });

export const getPianoCorrente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const inizio = lunediCorrente();
    const { data } = await supabase
      .from("piani_settimanali")
      .select("settimana_inizio, giorni, note")
      .eq("user_id", userId)
      .eq("settimana_inizio", inizio)
      .maybeSingle();
    if (!data) return null;
    return {
      settimana_inizio: data.settimana_inizio,
      note: data.note ?? "",
      giorni: data.giorni as PianoSettimanale["giorni"],
    };
  });
