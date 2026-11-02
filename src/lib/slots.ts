export interface Slot {
  isoStart: string;
  isoEnd: string;
  date?: string;
  time?: string;
  label?: string;
}

export const SLOTS_ENDPOINTS = {
  personal: "https://n8n.marcaki.com/webhook/slots/personal",
  muaythai: "https://n8n.marcaki.com/webhook/slots/muaythai",
} as const;

// Slots change when someone books, so a cached response is only reused briefly.
const CACHE_TTL_MS = 60 * 1000;

const cache = new Map<string, { promise: Promise<Slot[]>; createdAt: number }>();

async function requestSlots(endpoint: string): Promise<Slot[]> {
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Falha ao carregar slots");
  }

  const data = (await response.json()) as { slots?: Slot[] };
  return Array.isArray(data.slots) ? data.slots : [];
}

export function fetchSlots(endpoint: string): Promise<Slot[]> {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = requestSlots(endpoint);
  cache.set(endpoint, { promise, createdAt: Date.now() });
  promise.catch(() => {
    if (cache.get(endpoint)?.promise === promise) {
      cache.delete(endpoint);
    }
  });

  return promise;
}

/** Starts loading slots ahead of time so the booking calendar opens with data ready. */
export function prefetchSlots(endpoint: string) {
  fetchSlots(endpoint).catch(() => {
    // The calendar retries and shows the error itself.
  });
}

export function invalidateSlots(endpoint: string) {
  cache.delete(endpoint);
}
