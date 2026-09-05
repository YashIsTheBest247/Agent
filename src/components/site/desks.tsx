import Image from "next/image";
import Link from "next/link";

type Desk = {
  n: string;
  name: string;
  href: string;
  image: string;
  alt: string;
  who: string;
  problem: string;
  /** The deterministic check that makes this desk's output trustworthy. */
  gate: string;
  members: string;
  demoHref: string;
};

const desks: Desk[] = [
  {
    n: "01",
    name: "Appeals",
    href: "/cases",
    image: "/img/paperwork.jpg",
    alt: "Insurance and tax forms spread across a white desk",
    who: "For anyone holding a denial letter",
    problem:
      "Insurers deny first and rely on people giving up. Appealing means reading a policy you have never opened and writing a letter in a register you have never had to use.",
    gate:
      "Every quotation is searched for in the source document. A draft citing text nobody can find is held back, not handed over.",
    members: "Nine members · one of them code",
    demoHref: "/demo/appeal",
  },
  {
    n: "02",
    name: "Quoting",
    href: "/quotes",
    image: "/img/site.jpg",
    alt: "Workers on a construction site among reinforcing steel",
    who: "For trades who quote from a site visit",
    problem:
      "Jobs are lost because quotes take days. The bottleneck is evenings spent typing up what you already saw and measured that morning.",
    gate:
      "No agent may name a price. They describe work and quantities; every figure is computed from your own price book in integer arithmetic.",
    members: "Seven members · one of them code",
    demoHref: "/demo/quote",
  },
  {
    n: "03",
    name: "Orders",
    href: "/orders",
    image: "/img/warehouse.jpg",
    alt: "Racking and picking bins in a distribution warehouse",
    who: "For distributors rekeying purchase orders",
    problem:
      "Orders arrive as prose, PDFs and photographs of paper, and someone types them in by hand. It is not hard work, it is just relentless.",
    gate:
      "Nothing is confirmed that does not resolve to a real SKU, in stock, at the price that customer has actually agreed.",
    members: "Five members · one of them code",
    demoHref: "/demo/order",
  },
];

export function Desks() {
  return (
    <section id="desks" className="mx-auto max-w-[1240px] px-5 pb-20 sm:pb-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">The desks</div>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.4rem)]">
            <span className="display">Which problem have you </span>
            <span className="script text-[var(--ok-deep)]">got</span>
          </h2>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-[var(--text-2)]">
          Different trades, same shape of problem: something arrived, and
          answering it properly takes hours nobody has.
        </p>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {desks.map((desk) => (
          <article
            key={desk.n}
            className="group flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--white)]"
          >
            <Link href={desk.href} className="press relative block overflow-hidden">
              <Image
                src={desk.image}
                alt={desk.alt}
                width={800}
                height={520}
                className="h-48 w-full object-cover"
              />
              <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.12em] text-[var(--ink)] uppercase backdrop-blur-sm">
                {desk.n} · {desk.name}
              </span>
            </Link>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="eyebrow">{desk.who}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-2)]">
                {desk.problem}
              </p>

              <div className="mt-5 rounded-[var(--r-sm)] border border-[var(--line)] bg-[#f7f9ee] p-4">
                <p className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--ok-deep)] uppercase">
                  The gate
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                  {desk.gate}
                </p>
              </div>

              <div className="mt-auto pt-6">
                <span className="font-mono text-[9.5px] tracking-[0.12em] text-[var(--text-3)] uppercase">
                  {desk.members}
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={desk.demoHref} className="press pill pill-lime flex-1 justify-center">
                    See a real run
                  </Link>
                  <Link href={desk.href} className="press pill pill-ghost">
                    Open
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
