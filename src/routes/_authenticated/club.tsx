import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/club")({
  ssr: false,
  component: () => (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="text-xl">Run Club</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Unisciti a un club, segui appuntamenti e annunci del captain,
          allenati insieme alla tua community.
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          ⏳ Disponibile nella prossima fase
        </span>
      </div>
    </AppShell>
  ),
});
