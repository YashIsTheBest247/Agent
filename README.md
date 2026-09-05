# Second Chair

Three desks of AI agents for work that ends in a document somebody has to sign.

A *second chair* is the person beside the lead who does the preparation the lead
signs off. That is the whole design: **agents propose, code verifies, a human
signs.** No document leaves this application on its own.

---

## The problem

Between something arriving and someone answering it properly sits work nobody
has automated, because getting it wrong is expensive and getting it right is
dull.

- **A denial letter** written to be difficult to argue with. Appealing means
  reading a policy you have never opened, matching it against records you do not
  hold, and writing in a register you have never had to use. Almost nobody does
  it. Of those who do, a great many win.
- **A site visit** that has to become a number you are contractually bound to.
  Jobs are lost because quotes take days — the bottleneck is evenings spent
  typing up what you already saw that morning.
- **A purchase order** three replies down an email thread, which somebody will
  rekey by hand. Not hard work; just relentless, and a wrong keystroke is a
  wrong delivery and a credit note.

Each ends in a document a person signs, where a plausible invention costs more
than an honest gap. That is precisely the shape of work general-purpose AI does
worst: it will confidently produce a citation, a price, or a product code that
does not exist.

## The solution

Nineteen agents across three desks, each with one narrow job and a typed output
— and **one deterministic gate per desk that no model is allowed to answer.**

| Desk | For | Route | Members |
| --- | --- | --- | --- |
| **Appeals** | Denied insurance claims and incorrect medical bills | `/cases` | 9, one of them code |
| **Quoting** | Trades quoting from a site visit | `/quotes` | 7, one of them code |
| **Orders** | Distributors rekeying emailed purchase orders | `/orders` | 5, one of them code |

Each gate asks the same question against a different corpus:

| Desk | The question | Checked against |
| --- | --- | --- |
| Appeals | Does this sentence appear in the policy? | The transcribed source document |
| Quoting | Does this line have a price behind it? | The contractor's own price book |
| Orders | Is this in stock at the agreed price? | The catalogue, stock and customer terms |

A model asked whether a quote is real can agree with one that is not, so none of
these is a model. Anything that fails its gate **blocks the work** and is
reported, rather than travelling inside a finished document.

For the reasoning behind all of this, see **[DOCS.md](DOCS.md)**.

## Architecture

```
                       ┌──────────────┐
   upload / paste ───► │    Intake    │  multimodal: audio, photos, PDFs
                       └──────┬───────┘
                              ▼
                     ┌─────────────────┐
                     │  Agents propose │  narrow jobs, Zod-typed outputs
                     └────────┬────────┘
                              ▼
                    ╔═════════════════════╗
                    ║   THE GATE (code)   ║  ── fails ──► held, with a reason
                    ╚══════════╤══════════╝
                               ▼ passes
                     ┌─────────────────┐
                     │  Document drafted│  adversarial review, revision loop
                     └────────┬────────┘
                              ▼
                     ┌─────────────────┐
                     │  You read + sign │  nothing is ever transmitted
                     └─────────────────┘
```

```
src/
  app/
    api/{cases,quotes,orders}/   create + stream a run, fetch, approve, delete
    api/auth/                    signup, signin, signout
    cases/ quotes/ orders/       one workspace per desk
    signin/ signup/              account screens
  components/
    site/                        marketing surface
    case/ quote/ order/          per-desk workspace UI
    auth/ ui/                    account controls and primitives
  lib/
    agents/                      runtime, trace, appeals agents + gate
    desks/quotes/                domain, agents, pricing gate, orchestrator
    desks/orders/                domain, agents, resolve gate, orchestrator
    auth/                        passwords, sessions, guards
    gemini/                      client, model tiers, Zod→Gemini schema
    match.ts                     the matcher all three gates share
    store.ts                     namespaced, file-backed record storage
```

## Tech stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 — CSS-first tokens in `src/app/globals.css` |
| Type | Archivo, Instrument Serif, DM Sans, JetBrains Mono |
| Model | Google Gemini via `@google/genai`, two tiers |
| Contracts | Zod on every agent output, converted to Gemini response schemas |
| Auth | scrypt + server-side sessions, Node `crypto` only |
| Storage | File-backed JSON, namespaced per desk |
| Tests | Vitest — 110 tests across 8 files |
| Deploy | Vercel |

Runtime dependencies: `next`, `react`, `react-dom`, `@google/genai`, `zod`,
`clsx`, `tailwind-merge`, `lucide-react`, `server-only`. Nothing else.

## Setup

Requires Node 20 or newer.

```bash
git clone <your-repo-url> second-chair
cd second-chair
npm install
cp .env.example .env.local
```

Add a Gemini API key to `.env.local` — free at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey):

```
GEMINI_API_KEY=your-key-here
```

```bash
npm run dev
```

Open <http://localhost:3000> and create an account.

Without a key the site still builds and every page renders; uploads return a
503 naming the missing variable, so a misconfigured install is obvious rather
than silent.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Server-side only. Never prefix with `NEXT_PUBLIC_`. |
| `GEMINI_MODEL_REASONING` | no | Defaults to `gemini-3.6-flash`. |
| `GEMINI_MODEL_FAST` | no | Defaults to `gemini-3.5-flash`. |
| `SECOND_CHAIR_PERSIST` | no | `1` forces disk storage on, `0` off. On by default locally, off on Vercel. |
| `SECOND_CHAIR_DATA_DIR` | no | Where records are written. Defaults to `./.data`. |

## Usage

**Appeals** — `/cases/new`. Upload the denial letter; a phone photograph is
fine. Add plan documents and clinical records if you have them: the more the
agents can quote, the less the appeal has to assert.

**Quoting** — `/quotes/new`. Upload a voice recording of yourself walking the
site, plus photographs of anything affecting the price. Quantities come from what
you said; every figure comes from your price book.

**Orders** — `/orders/new`. Paste the order email or attach the PO. Three worked
examples are on the page if you would rather not write one — one routine, one
awkward, one from an account on stop.

**Your own data** — `/quotes/pricebook` and `/orders/catalogue` take a CSV, and
every run then prices and resolves against yours instead of the worked example.
Every document can be saved as a PDF from its page.

Every desk ends the same way: a document, an inspectable trace of how it was
produced, and an approval you give explicitly. Approving records that you have
read it. **It sends nothing.**

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — the matcher, the runtime, all three gates, auth, storage |

## Deploying

Import the repository into Vercel; the Next.js preset is detected automatically.
Set `GEMINI_API_KEY` in Project Settings → Environment Variables and deploy. The
build reads no secret, so it succeeds before any variable is set.

Two things to know before a public deployment:

- **Records do not persist on serverless.** Locally they are written to `.data/`
  and survive restarts; on Vercel the filesystem is ephemeral. Swap
  `RecordStore` in `src/lib/store.ts` for a database when this matters.
- **There is no password reset or email verification.** Anyone can sign up with
  any address, and a forgotten password means a new account.

Full deployment notes, including the function-duration cap, are in
[DOCS.md](DOCS.md#deployment).

## Demoing it

`/demo` serves four real recorded runs — appeals, quoting, orders, and one the
desk refused to confirm. No account, no API key, no quota. They render through
exactly the same components a live run uses.

[DEMO.md](DEMO.md) is a ninety-second script for showing it.

## Documentation

**[DOCS.md](DOCS.md)** covers the problem in depth, every agent on every desk,
how each gate works, the agent runtime, the security model, and the known
limits.

## Disclaimer

Second Chair is not a law firm, insurer, medical provider or surveyor. It
prepares documents for a person to review, edit and send themselves. Nothing it
produces is legal, medical or professional advice.

## License

[MIT](LICENSE).

Photography from Unsplash, credited in
[`public/img/CREDITS.md`](public/img/CREDITS.md).
