import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, MapPin, ChevronLeft, ArrowRight, CalendarDays } from "lucide-react";
import { useEffect } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { prefetchSlots, SLOTS_ENDPOINTS } from "@/lib/slots";

export const Route = createFileRoute("/treinar/personal/")({
  component: PersonalPage,
  head: () => ({
    meta: [
      { title: "Personal Trainer — André Rediss" },
      { name: "description", content: "Treino individualizado de musculação em Guaíba - RS. Planos de 1x a 4x por semana. CREF 040046-G/RS." },
    ],
  }),
});

const planos = [
  { freq: "1x na semana", individual: "R$260", dupla: "R$180" },
  { freq: "2x na semana", individual: "R$480", dupla: "R$330" },
  { freq: "3x na semana", individual: "R$660", dupla: "R$480" },
  { freq: "4x na semana", individual: "R$800", dupla: "R$600" },
];

function PersonalPage() {
  useEffect(() => {
    prefetchSlots(SLOTS_ENDPOINTS.personal);
  }, []);

  const heroRef = useReveal<HTMLDivElement>();
  const planosRef = useReveal<HTMLDivElement>();
  const localRef = useReveal<HTMLDivElement>();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="px-6 pt-8">
        <Link to="/treinar" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground transition hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div ref={heroRef} className="fade-up px-6 pb-2 pt-10 text-center">
        <Dumbbell className="mx-auto h-10 w-10 text-primary" strokeWidth={1.5} />
        <h1 className="mt-4 font-display text-4xl font-black uppercase leading-none sm:text-5xl">
          Personal Trainer
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Treino de musculação 100% individualizado. Método, acompanhamento e resultado real — presencialmente em Guaíba.
        </p>
      </div>

      <section className="mx-auto max-w-lg px-6 pb-6 pt-12">
        <div ref={planosRef} className="fade-up">
          <span className="font-display text-xs uppercase tracking-[0.4em] text-primary">Valores mensais</span>
          <h2 className="mt-2 font-display text-2xl font-black uppercase">Planos disponíveis</h2>
          <div className="mt-6 overflow-hidden border border-border/50">
            <div className="grid grid-cols-3 bg-primary/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Frequência</span>
              <span className="text-center">Individual</span>
              <span className="text-center">Em Dupla</span>
            </div>
            {planos.map((p, i) => (
              <div key={p.freq} className={`grid grid-cols-3 items-center px-4 py-4 ${i !== planos.length - 1 ? "border-b border-border/30" : ""}`}>
                <span className="text-sm text-muted-foreground">{p.freq}</span>
                <span className="text-center font-display text-xl font-black text-primary">{p.individual}</span>
                <span className="text-center font-display text-xl font-black text-primary">
                  {p.dupla}
                  <span className="block text-[10px] font-normal tracking-wide text-muted-foreground">por pessoa</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground/60">Valores cobrados mensalmente · CREF 040046-G/RS</p>
        </div>
      </section>

      <section className="mx-auto max-w-lg px-6 py-6">
        <div ref={localRef} className="fade-up border border-border/50 border-l-2 border-l-primary bg-card px-6 py-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">Local</span>
              <h3 className="mt-1 font-display text-lg font-black uppercase">Academia Moinhos Fitness</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                R. São José, 102 — Centro<br />
                Guaíba — RS, 92510-330
              </p>
              <a href="https://maps.google.com/?q=R.+São+José,+102,+Centro,+Guaíba,+RS" target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground/60 transition hover:text-primary">
                Ver no mapa →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-lg px-6 pb-16 pt-4">
        <Link to="/treinar/personal/agendar" className="group flex w-full items-center justify-between bg-primary px-6 py-5 font-display text-base font-bold uppercase tracking-widest text-primary-foreground transition hover:bg-[oklch(0.595_0.225_27.5)]">
          <span className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5" />
            Quero agendar
          </span>
          <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
        </Link>
      </section>

      <footer className="border-t border-border/30 px-6 py-8 text-center text-xs uppercase tracking-widest text-muted-foreground/50">
        © André Rediss — CREF 040046-G/RS
      </footer>
    </main>
  );
}
