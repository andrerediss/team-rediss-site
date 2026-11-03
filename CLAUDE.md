# CLAUDE.md

Technical guidance for work in this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite development server
npm run build        # Production build
npm run build:dev    # Development-mode build
npm run preview      # Preview Vite build locally
npm run start        # Run the SSR server
npm run lint         # ESLint
npm run format       # Prettier (write)
```

There are no tests in this project.

Use Node 22, as defined in `.nvmrc`. For a new checkout, install dependencies with `npm ci --ignore-scripts` before reviewing package scripts.

## Architecture

This is a marketing site for Andre Rediss (Personal Trainer and Muay Thai Coach), built with TanStack Start on Vite and served by a Node SSR server.

**Stack:**
- **TanStack Start** (SSR-capable React meta-framework) + **TanStack Router** (file-based routing)
- **Tailwind CSS v4** with `@theme inline` — all design tokens are CSS custom properties in `src/styles.css`, not `tailwind.config.*`
- **shadcn/ui** components (Radix UI primitives) live in `src/components/ui/` — these are vendored, edit in place
- **Vite** configured via `@lovable.dev/vite-tanstack-config`; production SSR is served by `server.mjs`

**Routing:** TanStack Router file-based. `src/routeTree.gen.ts` is auto-generated and must not be edited by hand. Routes live in `src/routes/`. The root layout (`__root.tsx`) sets the HTML shell, `<head>` defaults, and 404 handler. Each route can override `head()` meta. Parent routes that have children render an `Outlet`; for example, `treinar/turma.tsx` is the layout for the turma pages.

**Design system:** Defined entirely in `src/styles.css`.
- All colors use `oklch` format. The site is dark-only (`:root` has dark values; `.dark` block is unused boilerplate from the template).
- Primary brand color: `oklch(0.553 0.214 27.5)` (red).
- Display font: `Barlow Condensed` / `Bebas Neue`; body font: `DM Sans` — loaded from Google Fonts.
- `--gradient-dark` CSS variable used for the hero background.
- Scroll-reveal animation: add `fade-up` class + attach the `useReveal` hook ref to trigger `.in-view` via `IntersectionObserver`.

**Home route (`src/routes/index.tsx`):** The page uses inline section components: `Hero → Bio → Services → CTAFooter → WebDevPromo → FooterBar`. Contact links are module-level constants at the top of the file.

**Turma flow:** There are two turmas, one folder each under `src/routes/treinar/turma/` — `studio-top-fitness/` and `ct-ishigeki/` — and each has a page plus its own waiting-list form under `interesse.tsx`. Neither turma has started: the pages read "Em breve" and must not announce a start date until the turma is confirmed. The forms stay open as waiting lists only — they must not promise a spot or an enrollment, and must not redirect users to WhatsApp.

| Turma | Webhook | Data Table | Form fields |
| --- | --- | --- | --- |
| Studio Top Fitness | `/webhook/interesse/turma` | `interessados_turma_muay_thai` | name, WhatsApp, age, preferred shift |
| CT Ishigeki | `/webhook/interesse/turma-ishigeki` | `interessados_turma_ct_ishigeki` | name, WhatsApp, age |

When a turma opens, update the unit page, the card in `/treinar/turma`, the card in `/treinar`, and the meta descriptions of all four routes — each one states the turma's status.

**Booking flow:** `/treinar/personal/agendar` and `/treinar/muaythai/agendar` render `BookingCalendar`, which reads free slots from `/webhook/slots/...` and posts the booking to `/webhook/agendar/...`. All n8n webhooks live on `https://n8n.marcaki.com` and are unauthenticated — never put anything but public form input through them.

Slot fetching lives in `src/lib/slots.ts` (`SLOTS_ENDPOINTS`, `fetchSlots`, `prefetchSlots`, `invalidateSlots`). The plan pages (`/treinar/personal`, `/treinar/muaythai`) prefetch slots on mount so the calendar opens with data ready; the response is reused for 60 s and invalidated after a confirmed booking. While slots load, `BookingCalendar` shows "Carregando horários disponíveis…". The n8n slots endpoints only allow the `andrerediss.com` origin (CORS), so slots fail to load from `localhost`.

Working hours are configured in n8n, not in this repo. Only free slots are offered: anything already on the "Trabalho" Google Calendar is blocked.
- **Personal** (`[Personal] Slots Disponíveis`): `START_HOUR` / `END_HOUR` / `WORKING_DAYS` constants in the "Calcula Slots Livres" Code node. Currently 14:00 to 22:00 (last class at 21:00), Monday to Friday.
- **Muay Thai** (`[Muay Thai] Slots Disponíveis`): the `Disponibilidade` tab of the `Muay_Thai_Particular_Disponibilidade` Google Sheet, with one row per weekday and hour (`dia_semana` without accents, `horario`, `disponivel` TRUE/FALSE). Currently 14:00 to 21:00, Monday to Friday. Keep rows ordered by day and hour, above the legend.
- The `[Personal]` / `[Muay Thai] Confirmar Agendamento` workflows do not validate the hour; they only create the Calendar event and send the WhatsApp messages.

**`calcYears` utility (index.tsx):** Computes years of martial arts practice from birth year + starting age, accounting for the April 6 birthday.

## Deployment

Deploys through EasyPanel (service `team-rediss-site`) with Nixpacks 1.41.0, from the `main` branch with build path `/`. The install, build, and start commands (`npm install`, `npm run build`, `npm run start`) are set both in `nixpacks.toml` and in the EasyPanel build settings — keep them in sync.

The production runtime is Node 22, set in two places that must always agree: `.nvmrc` (`22`) and EasyPanel's "Pacotes Nix" field (`nodejs_22`). Do not remove `.nvmrc`: without it Nixpacks falls back to its default `nodejs_18`, which has been removed from Nix as end-of-life, and the build fails with `Node.js 18.x has reached End-Of-Life and has been removed`. To change the Node version, change both together.

Do not add a second Node package (for example `nodejs_20`) or `NIXPACKS_NODE_VERSION` in EasyPanel, and do not re-add `nixPkgs` to `nixpacks.toml`. Two Node versions in the same Nix environment cause a dependency-file conflict during image creation. The canonical production domain is `https://andrerediss.com`.
