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

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (CSS-first tokens in `src/app/globals.css`)
- Gemini for the agent runtime
- Deployed on Vercel

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in GEMINI_API_KEY
npm run dev
```

## Scripts

| Command             | Purpose                       |
| ------------------- | ----------------------------- |
| `npm run dev`       | Dev server on :3000           |
| `npm run build`     | Production build              |
| `npm run typecheck` | `tsc --noEmit`                |

## Layout

```
src/
  app/                 routes — marketing surface + /cases workspace
  components/
    site/              marketing sections
    ui/                primitives (button, pill)
    art/               vector landscapes used instead of stock photography
  lib/                 shared helpers
```

## Design system

All colour, radius, type and motion tokens live in the `@theme` block of
`src/app/globals.css`. Nothing hardcodes a hex value outside that file except
the vector landscape palettes in `components/art/scene.tsx`.

## Disclaimer

Overturn is not a law firm, insurer, or medical provider. It prepares documents
for a person to review, edit and file themselves. Nothing it produces is legal
or medical advice.
