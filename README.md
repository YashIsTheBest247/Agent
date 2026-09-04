# Overturn

An AI appeals desk for denied insurance claims and incorrect medical bills.

Insurers deny first and rely on people giving up: a large share of in-network
claims are denied, well under 1% are ever appealed, and roughly 40% of those
appealed get overturned. The denial was often simply wrong — nobody pushed back.

Overturn runs a supervised team of nine agents that reads the denial letter,
finds the policy language that contradicts it, drafts a citation-backed appeal,
and then attacks that draft the way an insurance reviewer would. Anything whose
citations do not resolve to real source text is blocked rather than shipped.

**The user signs and files. The agents never send anything on their own.**

## The pipeline

| # | Agent      | Tier      | Job |
| - | ---------- | --------- | --- |
| 1 | Intake     | fast      | Transcribes uploads literally, then extracts claim facts with a quote behind every field |
| 2 | Classifier | fast      | Collapses the payer's prose onto one of twelve canonical denial categories |
| 3 | Coverage   | reasoning | Finds the plan language that governs the claim |
| 4 | Evidence   | reasoning | Assembles clinical support, separating what the record proves from general standards |
| 5 | Strategy   | reasoning | Picks the appeal level, the deadline, and the two-to-four arguments worth making |
| 6 | Drafter    | reasoning | Writes the letter, quoting only from the verified citation pool |
| 7 | Adversary  | reasoning | Reviews from the payer's chair and tries to uphold the denial |
| 8 | Auditor    | **code**  | Re-opens each source and confirms every quote exists |
| 9 | Filing     | fast      | Submission route, checklist, deadline reminders, phone script |

Three design decisions carry most of the weight:

**The auditor is not an agent.** Asking a second model whether a first model's
quote is real just moves the hallucination one step down the chain. Verification
is string search over the transcribed source — a question about bytes, not
judgement. See [`src/lib/agents/audit.ts`](src/lib/agents/audit.ts).

**Citations are verified before drafting, not after.** An unverifiable quote
never enters the drafter's vocabulary, which is cheaper than unpicking it from a
finished letter.

**`blocked` is a real outcome.** If the draft cannot be made citation-clean in
three attempts, the user gets an explanation instead of a letter. An appeal
citing text a reviewer cannot find is dismissed, and the deadline goes with it.

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

Without a key the app runs and the marketing surface works; uploads return a
503 that says exactly what is missing.

## Scripts

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server on :3000              |
| `npm run build`     | Production build                 |
| `npm run typecheck` | `tsc --noEmit`                   |
| `npm test`          | Vitest — schema, runtime, audit  |

## Layout

```
src/
  app/
    api/cases/         create + stream a run, fetch, approve
    cases/             the workspace: list, new, detail
  components/
    site/              marketing sections
    case/              workspace UI — timeline, draft view, approval gate
    ui/                button and pill primitives
public/img/            photography, credited in CREDITS.md
  lib/
    agents/
      definitions/     the nine agents, one file per stage
      runtime.ts       defineAgent / runAgent with Zod repair
      orchestrator.ts  the pipeline, top to bottom
      audit.ts         deterministic citation verification
      trace.ts         the inspectable run log
    domain/            schemas: documents, denial, taxonomy, appeal, case
    gemini/            client, tiers, Zod-to-Gemini schema conversion
```

## Design system

Warm paper (`--paper`), near-black ink, and a single loud accent (`--lime`) that
marks only the things that act. Headlines pair a heavy uppercase grotesk with an
italic serif on the word carrying the meaning — the `.display` and `.script`
utilities. Small labels are mono, uppercase and wide-tracked — `.eyebrow`.

Every colour, radius and font is a custom property on `:root`, used through
arbitrary values (`text-[var(--text-2)]`), so the palette stays legible in the
markup and there is exactly one file to change.

Photography lives in `public/img/` and is credited in
[`public/img/CREDITS.md`](public/img/CREDITS.md). Swapping an image is a matter
of dropping a new file in at the same name.

## Deploying

Push to a Vercel project and set `GEMINI_API_KEY` in project environment
variables. The run route declares `maxDuration = 300`; on plans that cap
function duration lower, the cap applies and a long run may be cut off
mid-stream.

## Known limits

- **Cases live in server memory.** They clear on restart and are not shared
  between serverless instances. `CaseStore` in `src/lib/store.ts` is a
  single-file swap to Postgres.
- No authentication yet — every case is visible to anyone with the URL.
- Coverage findings can only quote documents the user uploads. Overturn does
  not yet carry a corpus of payer medical policies.

## Disclaimer

Overturn is not a law firm, insurer, or medical provider. It prepares documents
for a person to review, edit and file themselves. Nothing it produces is legal
or medical advice.
