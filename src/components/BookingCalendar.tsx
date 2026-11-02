import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { fetchSlots, invalidateSlots, type Slot } from "@/lib/slots";

interface BookingCalendarProps {
  modalidade: "personal" | "muaythai";
  slotsEndpoint: string;
  agendarEndpoint: string;
  titulo: string;
  icone: ReactNode;
  local: string;
  localEndereco: string;
}

type Step = "loading" | "calendar" | "success";

interface AgendamentoConfirmado {
  nome: string;
  whatsapp: string;
  slot: Slot;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

function makeDayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getBrtDate(date: Date) {
  return new Date(date.getTime() - BRT_OFFSET_MS);
}

function getBrtParts(date: Date) {
  const local = getBrtDate(date);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
  };
}

function getSlotDayKey(slot: Slot) {
  const local = getBrtDate(new Date(slot.isoStart));
  return makeDayKey(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
}

function getTomorrowKey() {
  const now = getBrtDate(new Date());
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return makeDayKey(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate());
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1)).toUpperCase();
}

function formatWeekdayLabel(year: number, month: number, day: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(new Date(year, month, day));
}

function formatDateLabel(isoStart: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(isoStart));
}

function formatTimeLabel(slot: Slot) {
  if (slot.label) return slot.label;
  if (slot.time) return slot.time;

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(slot.isoStart));
}

function CalendarSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="aspect-square animate-pulse bg-card/70" />
        ))}
      </div>
      <p
        role="status"
        className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Carregando horários disponíveis…
      </p>
    </div>
  );
}

export default function BookingCalendar({
  modalidade,
  slotsEndpoint,
  agendarEndpoint,
  titulo,
  icone,
  local,
  localEndereco,
}: BookingCalendarProps) {
  const today = getBrtParts(new Date());
  const [step, setStep] = useState<Step>("loading");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadError, setLoadError] = useState("");
  const [selectedYear, setSelectedYear] = useState(today.year);
  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmado, setConfirmado] = useState<AgendamentoConfirmado | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  async function loadSlots() {
    setStep("loading");
    setLoadError("");

    try {
      setSlots(await fetchSlots(slotsEndpoint));
      setStep("calendar");
    } catch {
      setLoadError("Não foi possível carregar os horários disponíveis.");
    }
  }

  useEffect(() => {
    void loadSlots();
  }, []);

  useEffect(() => {
    if (!selectedDayKey || !detailsRef.current) return;

    detailsRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedDayKey]);

  const slotsByDay: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const key = getSlotDayKey(slot);
    if (!slotsByDay[key]) {
      slotsByDay[key] = [];
    }
    slotsByDay[key].push(slot);
  }

  const selectedDaySlots = selectedDayKey ? slotsByDay[selectedDayKey] ?? [] : [];
  const monthOffset = new Date(selectedYear, selectedMonth, 1).getDay();
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const tomorrowKey = getTomorrowKey();
  const isPrevDisabled =
    selectedYear < today.year || (selectedYear === today.year && selectedMonth <= today.month);
  const isSubmitDisabled = !selectedSlot || !nome.trim() || !whatsapp.trim() || isSubmitting;

  async function handleSubmit() {
    if (!selectedSlot || isSubmitDisabled) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(agendarEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          isoStart: selectedSlot.isoStart,
          isoEnd: selectedSlot.isoEnd,
        }),
      });

      const data = (await response.json()) as { success?: boolean };

      if (!response.ok || !data.success) {
        throw new Error("Falha ao agendar");
      }

      invalidateSlots(slotsEndpoint);
      setConfirmado({
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        slot: selectedSlot,
      });
      setStep("success");
    } catch {
      setSubmitError("Não foi possível confirmar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "success" && confirmado) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <div className="mb-4">{icone}</div>
            <CheckCircle2 size={52} className="mx-auto mb-4 text-green-500" />
            <h1 className="mt-2 font-display text-3xl font-black uppercase text-center">
              Agendamento confirmado!
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              Você receberá uma confirmação no WhatsApp em instantes.
            </p>
          </div>

          <div className="mt-6 border border-border/50 border-l-2 border-l-primary bg-card px-6 py-5">
            {[
              { label: "Nome", value: confirmado.nome },
              { label: "Data", value: formatDateLabel(confirmado.slot.isoStart) },
              { label: "Horário", value: formatTimeLabel(confirmado.slot) },
              { label: "Local", value: local },
            ].map((item, index, items) => (
              <div
                key={item.label}
                className={`flex justify-between py-2 text-sm ${index !== items.length - 1 ? "border-b border-border/20" : ""}`}
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-right font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Endereço:</span> {localEndereco}
          </div>

          <Link
            to="/"
            className="mt-6 flex w-full items-center justify-between bg-primary px-6 py-4 font-display text-sm uppercase tracking-widest text-primary-foreground transition hover:bg-[oklch(0.595_0.225_27.5)]"
          >
            Voltar ao início
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center">{icone}</div>
        <span className="font-display text-xs uppercase tracking-[0.4em] text-primary">
          {modalidade === "personal" ? "Aula Experimental" : "Agendamento"}
        </span>
        <h1 className="mt-3 font-display text-4xl font-black uppercase leading-none sm:text-5xl">
          {titulo}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Escolha um dia, selecione um horário disponível e preencha seus dados para confirmar.
        </p>
        <div className="mt-5 border border-border/50 border-l-2 border-l-primary bg-card px-5 py-4 text-left">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">Local</span>
          <p className="mt-2 font-display text-lg font-black uppercase">{local}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{localEndereco}</p>
        </div>
      </div>

      <div className="mt-8">
        {step === "loading" && !loadError ? (
          <CalendarSkeleton />
        ) : loadError ? (
          <div className="border border-border/50 bg-card px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                void loadSlots();
              }}
              className="mt-4 inline-flex items-center justify-center border border-border/50 px-4 py-2 text-xs uppercase tracking-widest text-foreground transition hover:border-primary/60"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                disabled={isPrevDisabled}
                onClick={() => {
                  if (isPrevDisabled) return;

                  const previousMonth = new Date(selectedYear, selectedMonth - 1, 1);
                  setSelectedYear(previousMonth.getFullYear());
                  setSelectedMonth(previousMonth.getMonth());
                  setSelectedDayKey("");
                  setSelectedSlot(null);
                  setSubmitError("");
                }}
                className="flex h-8 w-8 items-center justify-center border border-border/50 transition disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="font-display text-lg font-black uppercase tracking-wide">
                {formatMonthLabel(selectedYear, selectedMonth)}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextMonth = new Date(selectedYear, selectedMonth + 1, 1);
                  setSelectedYear(nextMonth.getFullYear());
                  setSelectedMonth(nextMonth.getMonth());
                  setSelectedDayKey("");
                  setSelectedSlot(null);
                  setSubmitError("");
                }}
                className="flex h-8 w-8 items-center justify-center border border-border/50 transition hover:border-primary/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthOffset }).map((_, index) => (
                <div key={`offset-${index}`} className="aspect-square invisible" />
              ))}

              {Array.from({ length: totalDays }).map((_, index) => {
                const day = index + 1;
                const dayKey = makeDayKey(selectedYear, selectedMonth, day);
                const daySlots = slotsByDay[dayKey] ?? [];
                const isPast = dayKey < tomorrowKey;
                const isAvailable = !isPast && daySlots.length > 0;
                const isSelected = selectedDayKey === dayKey;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedDayKey(dayKey);
                      setSelectedSlot(null);
                      setSubmitError("");
                    }}
                    className={[
                      "aspect-square flex flex-col items-center justify-center text-sm transition",
                      isSelected
                        ? "border border-primary bg-primary text-primary-foreground"
                        : isAvailable
                          ? "border border-border/50 bg-card cursor-pointer hover:border-primary/60"
                          : "cursor-not-allowed text-muted-foreground/25",
                      isPast ? "text-muted-foreground/20" : "",
                    ].join(" ")}
                  >
                    <span>{day}</span>
                    {daySlots.length > 0 && (
                      <span className={`mt-0.5 text-[9px] leading-none ${isSelected ? "text-primary-foreground/80" : "text-primary"}`}>
                        {daySlots.length}h
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDaySlots.length > 0 && (
              <div ref={detailsRef} className="mt-4 border-t border-border/30 pt-4">
                <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                  Horários disponíveis em {formatWeekdayLabel(selectedYear, selectedMonth, Number(selectedDayKey.slice(-2)))}
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {selectedDaySlots.map((slot) => {
                    const isSelected = selectedSlot?.isoStart === slot.isoStart;

                    return (
                      <button
                        key={slot.isoStart}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSubmitError("");
                        }}
                        className={[
                          "cursor-pointer border border-border/50 bg-card py-3 font-display text-xl uppercase tracking-wide whitespace-nowrap transition",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-primary/60",
                        ].join(" ")}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>

                <div className="my-4 border-t border-border/30 pt-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.4em] text-primary">Seus dados</p>

                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Seu nome"
                    className="mb-4 w-full border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition"
                  />

                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                    WhatsApp com DDD
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    placeholder="51999999999"
                    className="mb-4 w-full border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition"
                  />

                  <button
                    type="button"
                    disabled={isSubmitDisabled}
                    onClick={() => {
                      void handleSubmit();
                    }}
                    className={[
                      "flex w-full items-center justify-between bg-primary px-6 py-4 font-display text-sm uppercase tracking-widest text-primary-foreground transition hover:bg-[oklch(0.595_0.225_27.5)]",
                      isSubmitDisabled ? "cursor-not-allowed opacity-40" : "",
                    ].join(" ")}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Aguarde...
                        </span>
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </>
                    ) : (
                      <>
                        Confirmar agendamento
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  {submitError && (
                    <p className="mt-2 text-sm text-destructive">{submitError}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
