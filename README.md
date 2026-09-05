# Second Chair

Three desks of AI agents for work that ends in a document somebody has to sign.

Between something arriving and someone answering it properly sits work nobody
has automated, because getting it wrong is expensive and getting it right is
dull. A denial letter written to be difficult to argue with. A site visit that
has to become a number you are bound to by Friday. A purchase order three
replies down an email thread, which somebody will rekey by hand.

Each desk prepares a document. **None of them is allowed to send it, and none of
them is trusted with the part that has to be true.**

## The desks

| Desk | For | Route | Members |
| ---- | --- | ----- | ------- |
| **Appeals** | Denied insurance claims and incorrect medical bills | `/cases` | 9, one of them code |
| **Quoting** | Trades quoting from a site visit | `/quotes` | 7, one of them code |
| **Orders** | Distributors rekeying emailed purchase orders | `/orders` | 5, one of them code |

## The method

The same shape three times:

1. **Agents propose.** Specialists with one job each and a Zod-typed output.
2. **Code decides what is real.** Not a second model — a model asked whether a
   quote is real can agree with one that is not.
3. **Anything unproven is held.** `blocked` is a first-class outcome with a
   reason, not an error.
4. **You read it and sign.** Nothing in this codebase transmits anything
   outward.

Each desk's gate answers the same question against a different corpus:

| Desk | The question | The corpus |
| ---- | ------------ | ---------- |
| Appeals | Does this sentence appear in the policy? | The transcribed source document |
| Quoting | Does this line have a price behind it? | The contractor's own price book |
| Orders | Is this in stock at the agreed price? | The catalogue, stock and customer terms |

All three run on the same matcher in [`src/lib/match.ts`](src/lib/match.ts).
Whether a string corresponds to something that exists is one question, and its
answer does not depend on anybody's judgement.

**The quoting desk deserves a specific note:** no agent there is permitted to
produce a figure. The takeoff emits descriptions and quantities; every number in
the finished quote is computed by [`pricing.ts`](src/lib/desks/quotes/pricing.ts)
in integer minor units. It refuses to produce a quote whose realised margin
falls below the contractor's floor — a job they would lose money honouring.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 — tokens and custom utilities in `src/app/globals.css`
- Archivo + Instrument Serif for display, DM Sans for body, JetBrains Mono for labels
- Gemini for the agent runtime, with Zod contracts on every output
- Deployed on Vercel

## Running locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY
npm run dev
```

Without a key the site runs and every marketing surface works; uploads return a
503 that says exactly what is missing.

## Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — matcher, runtime, and all three gates |

## Layout

```
src/
  app/
    api/{cases,quotes,orders}/   create + stream a run, fetch, approve, delete
    cases/ quotes/ orders/       one workspace per desk
  components/
    site/                        the Second Chair marketing surface
    case/ quote/ order/          per-desk workspace UI
    ui/                          button, pill, status badge, approval bar
  lib/
    agents/
      runtime.ts                 defineAgent / runAgent with Zod repair
      trace.ts                   the inspectable run log
      audit.ts                   the appeals gate
      definitions/               the appeals agents
      orchestrator.ts            the appeals pipeline
    desks/quotes/                domain, agents, pricing gate, orchestrator
    desks/orders/                domain, agents, resolve gate, orchestrator
    match.ts                     the matcher all three gates share
    gemini/                      client, model tiers, Zod-to-Gemini schema
public/img/                      photography, credited in CREDITS.md
```

## Design system

Warm paper (`--paper`), near-black ink, and a single loud accent (`--lime`) that
marks only the things that act. Headlines pair a heavy uppercase grotesk with an
italic serif on the word carrying the meaning — the `.display` and `.script`
utilities. Small labels are mono, uppercase and wide-tracked — `.eyebrow`.

Every colour, radius and font is a custom property on `:root`, used through
arbitrary values (`text-[var(--text-2)]`), so the palette stays legible in the
markup and there is one file to change.

## Deploying

The build does not read any secret, so it succeeds on a fresh clone with no
environment file. Everything is resolved at request time.

1. **Import the repository into Vercel.** Framework preset is detected as
   Next.js; leave the build command, output directory and install command at
   their defaults.
2. **Set one environment variable** in Project Settings → Environment
   Variables, for Production, Preview and Development:

   | Name | Value |
   | ---- | ----- |
   | `GEMINI_API_KEY` | your key, server-side only |

   Optionally override `GEMINI_MODEL_REASONING` and `GEMINI_MODEL_FAST` to pin
   different models. Do not prefix the key with `NEXT_PUBLIC_` — that would ship
   it to the browser.
3. **Deploy.** Without the key the site still builds and every page renders;
   uploads return a 503 naming the missing variable, which makes a
   misconfigured deploy obvious rather than silent.

### Function duration

The three run routes declare `maxDuration = 300`, because a full pipeline is
several model calls plus revision rounds. Plans that cap function duration below
that apply their own cap, and a long run is cut off mid-stream — the client sees
the connection close and the record stays at whatever stage it reached. If runs
are being truncated, either raise the plan's limit or reduce `MAX_REVISIONS` in
the orchestrators.

### Before a public deploy

- **There is no authentication.** Every record is readable and deletable by
  anyone with its URL. Do not put real claims, quotes or customer orders through
  a public deployment until auth exists.
- **Records do not persist on serverless.** Locally they are written to
  `.data/` and survive restarts; on Vercel the filesystem is ephemeral, so a run
  completes inside one invocation but the record may be gone when the page is
  reloaded. Swap `RecordStore` in `src/lib/store.ts` for a database before this
  matters. Setting `SECOND_CHAIR_PERSIST=1` forces the disk path on if you have
  mounted real storage.
- Verify the statistics on the landing page against their cited sources.

## Known limits

- **The agents have not been run against the live API.** Nineteen prompts
  across three desks are written and typed, and every gate is covered by tests,
  but no pipeline has executed end to end. Prompt problems surface only on a
  real run.
- **Records persist to disk locally, not on serverless.** Runs are written as
  JSON under `.data/<desk>/` and survive a restart, which matters because a run
  takes minutes. On Vercel the filesystem is ephemeral, so persistence is off by
  default and records live only in the instance's memory. `RecordStore` in
  `src/lib/store.ts` is a single-file swap to Postgres.
- **No authentication.** Every record is readable by anyone with its URL.
- The seeded price book and catalogue are worked examples, not real trading
  data. Real users bring their own.

## Disclaimer

Second Chair is not a law firm, insurer, medical provider or surveyor. It
prepares documents for a person to review, edit and send themselves. Nothing it
produces is legal, medical or professional advice.
