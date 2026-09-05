/**
 * Worked example orders, written the way real ones arrive.
 *
 * These exist so the desk can be tried without anyone having to invent a
 * purchase order, and so the exception queue has something to catch. Each is
 * deliberately imperfect in a different way — none of them is clean, because
 * clean orders are not the interesting case.
 */
export type SampleOrder = {
  id: string;
  label: string;
  /** What this one is meant to exercise, shown next to the button. */
  tests: string;
  body: string;
};

export const sampleOrders: SampleOrder[] = [
  {
    id: "routine",
    label: "A routine order",
    tests: "Mostly clean, one short-stocked line",
    body: `From: kate@norburyelec.co.uk
Subject: PO 8841 — Brayford site

Morning,

Can we get the following away for Thursday if possible, going to Unit 4 Brayford Way as usual.

  60 x 2 gang socket white
  30 x 1 gang switch
  4 drums of 2.5mm t&e
  12 x exit sign

PO number is 8841. Give me a shout if the exit signs are going to hold it up, we can take them separately.

Cheers
Kate`,
  },
  {
    id: "awkward",
    label: "An awkward one",
    tests: "Unknown product, an old price, a sub-minimum quantity",
    body: `From: kate@norburyelec.co.uk
Subject: Order — Meadowbank refurb

Hi,

Order for Meadowbank, our ref MB-2291:

  - 200 x double socket white @ 2.10 each
  - 6 x 16 amp mcb
  - 25 x smart dimmer module (the zigbee ones we spoke about)
  - 40 x fire rated downlight

Delivery to site, week commencing the 20th.

Thanks
Kate`,
  },
  {
    id: "stopped",
    label: "A customer on stop",
    tests: "Account on hold — nothing ships",
    body: `From: accounts@pikeandsons.co.uk
Subject: Urgent order

Need these today please:

10 x consumer unit 10 way
100 x 20mm gland
20 x mini trunking

Ta,
Dave`,
  },
];

export function sampleById(id: string): SampleOrder | undefined {
  return sampleOrders.find((s) => s.id === id);
}
