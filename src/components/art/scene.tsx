import { cn } from "@/lib/utils";

/**
 * Layered vector landscapes used in place of stock photography.
 *
 * Each variant is the same construction — sky wash, sun bloom, then hill bands
 * that lose contrast and gain haze as they recede — retuned to a different hour
 * of the day so sections sitting next to each other don't read as the same image.
 */
type Variant = "dawn" | "valley" | "ridge" | "canopy";

type Palette = {
  skyTop: string;
  skyBottom: string;
  sun: string;
  sunOpacity: number;
  bands: string[];
  haze: string;
};

const palettes: Record<Variant, Palette> = {
  dawn: {
    skyTop: "#f6f8ee",
    skyBottom: "#dcefc0",
    sun: "#ffffff",
    sunOpacity: 0.9,
    bands: ["#c7e69b", "#a9d977", "#8ac954", "#6cb43c", "#4f9029", "#37701d"],
    haze: "#f4f9e8",
  },
  valley: {
    skyTop: "#eef6e2",
    skyBottom: "#c8e6a4",
    sun: "#fdfff4",
    sunOpacity: 0.75,
    bands: ["#b9e08d", "#98d067", "#79bd49", "#5da432", "#428422", "#2d6318"],
    haze: "#eef8dd",
  },
  ridge: {
    skyTop: "#f2f5ea",
    skyBottom: "#d3e5bd",
    sun: "#ffffff",
    sunOpacity: 0.6,
    bands: ["#cfe3b4", "#aed189", "#8bbb64", "#6ba248", "#4d8231", "#365f21"],
    haze: "#f1f7e5",
  },
  canopy: {
    skyTop: "#e9f3da",
    skyBottom: "#bcdd96",
    sun: "#fbffee",
    sunOpacity: 0.8,
    bands: ["#a8d977", "#87c655", "#68ae3c", "#4d9029", "#37701d", "#245214"],
    haze: "#e8f6cf",
  },
};

/** Hill silhouettes, back-most first. Drawn on an 800x600 canvas. */
const bandPaths = [
  "M0 232 C 96 200, 168 246, 262 236 C 372 224, 436 178, 546 196 C 648 212, 716 190, 800 206 L800 600 L0 600 Z",
  "M0 284 C 110 258, 190 300, 300 292 C 408 284, 474 244, 578 262 C 668 278, 730 258, 800 272 L800 600 L0 600 Z",
  "M0 340 C 88 318, 196 362, 308 348 C 424 334, 500 300, 606 320 C 692 336, 742 318, 800 330 L800 600 L0 600 Z",
  "M0 400 C 120 378, 210 424, 330 412 C 452 400, 528 366, 640 388 C 714 402, 758 388, 800 396 L800 600 L0 600 Z",
  "M0 462 C 130 442, 232 486, 356 474 C 486 462, 566 432, 682 452 C 742 462, 774 454, 800 458 L800 600 L0 600 Z",
  "M0 524 C 150 506, 268 546, 400 534 C 534 522, 618 496, 730 514 C 768 520, 788 518, 800 518 L800 600 L0 600 Z",
];

/** Contour lines that read as terraced fields on the two nearest bands. */
const contourPaths = [
  "M0 432 C 120 410, 210 456, 330 444 C 452 432, 528 398, 640 420",
  "M0 452 C 122 431, 214 476, 334 464 C 456 452, 532 420, 644 441",
  "M0 494 C 130 474, 232 518, 356 506 C 486 494, 566 464, 682 484",
  "M0 512 C 132 493, 236 536, 360 524 C 490 512, 570 484, 686 503",
];

export function Scene({
  variant = "dawn",
  className,
  seed = 0,
}: {
  variant?: Variant;
  className?: string;
  /** Offsets gradient ids so multiple scenes can share a page safely. */
  seed?: number;
}) {
  const p = palettes[variant];
  const uid = `${variant}-${seed}`;

  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={p.skyTop} />
          <stop offset="100%" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id={`sun-${uid}`} cx="0.72" cy="0.16" r="0.42">
          <stop offset="0%" stopColor={p.sun} stopOpacity={p.sunOpacity} />
          <stop offset="100%" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`haze-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.haze} stopOpacity="0.85" />
          <stop offset="100%" stopColor={p.haze} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`vignette-${uid}`} x1="0" y1="0.55" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a0e" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e3a0e" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      <rect width="800" height="600" fill={`url(#sky-${uid})`} />
      <rect width="800" height="600" fill={`url(#sun-${uid})`} />

      {bandPaths.map((d, i) => (
        <g key={d}>
          <path d={d} fill={p.bands[i]} />
          {/* Haze sits on top of each ridge line, thinning with distance. */}
          {i < 4 ? (
            <path
              d={d}
              fill={`url(#haze-${uid})`}
              opacity={0.5 - i * 0.11}
              style={{ transform: "translateY(-4px)" }}
            />
          ) : null}
        </g>
      ))}

      <g
        stroke="#ffffff"
        strokeOpacity="0.24"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      >
        {contourPaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <rect width="800" height="600" fill={`url(#vignette-${uid})`} />
    </svg>
  );
}

/** Grain layer. Sits above a Scene to stop large flat greens from banding. */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grain-overlay pointer-events-none absolute inset-0 opacity-[0.18]",
        className,
      )}
    />
  );
}
