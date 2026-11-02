import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Dumbbell } from "lucide-react";
import BookingCalendar from "@/components/BookingCalendar";
import { SLOTS_ENDPOINTS } from "@/lib/slots";

export const Route = createFileRoute("/treinar/personal/agendar")({
  component: PersonalAgendarPage,
  head: () => ({
    meta: [
      { title: "Agendar Aula Experimental — Personal Trainer — André Rediss" },
      { name: "description", content: "Agende sua aula experimental de Personal Trainer com André Rediss em Guaíba - RS." },
    ],
  }),
});

function PersonalAgendarPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="px-6 pt-8">
        <Link
          to="/treinar/personal"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>
      <div className="mx-auto max-w-lg px-6 pb-16 pt-8">
        <BookingCalendar
          modalidade="personal"
          slotsEndpoint={SLOTS_ENDPOINTS.personal}
          agendarEndpoint="https://n8n.marcaki.com/webhook/agendar/personal"
          titulo="Personal Trainer"
          icone={<Dumbbell className="h-8 w-8 text-primary" strokeWidth={1.5} />}
          local="Academia Moinhos Fitness"
          localEndereco="R. São José, 102 — Centro, Guaíba — RS"
        />
      </div>
      <footer className="border-t border-border/30 px-6 py-8 text-center text-xs uppercase tracking-widest text-muted-foreground/50">
        © André Rediss — CREF 040046-G/RS
      </footer>
    </main>
  );
}
