import { DataUpload } from "@/components/desk/data-upload";
import { requireUser } from "@/lib/auth/guard";
import { getUserPriceBook } from "@/lib/desks/user-data";
import { priceBookTemplate } from "@/lib/desks/quotes/import";

export const metadata = { title: "Your price book" };
export const dynamic = "force-dynamic";

export default async function PriceBookPage() {
  const user = await requireUser("/quotes/pricebook");
  const book = await getUserPriceBook(user.id);

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="eyebrow">Quoting desk</div>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
        <span className="display">Your price </span>
        <span className="script text-[var(--ok-deep)]">book</span>
      </h1>
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text-2)]">
        Every figure in a quote is computed from this — no agent is allowed to
        name a price. A row whose cost cannot be read is rejected rather than
        priced at zero, because a zero here becomes a job you lose money on.
      </p>

      <div className="mt-8">
        <DataUpload
          endpoint="/api/quotes/pricebook"
          noun="price book"
          template={priceBookTemplate}
          current={
            book
              ? { name: book.name, items: book.items.length + book.labour.length }
              : null
          }
          columns={[
            { name: "name", required: true, note: "What you call it. Matched against how a takeoff describes the work." },
            { name: "cost", required: true, note: "Your buy price, before margin. 18.50 or £18.50 both read." },
            { name: "kind", required: false, note: "material, labour, plant or subcontract. Defaults to material." },
            { name: "unit", required: false, note: "litre, hour, day, each. Defaults to each." },
            { name: "aliases", required: false, note: "Other names for it, separated by | or ;" },
            { name: "sku", required: false, note: "Your own code. Derived from the name if absent." },
          ]}
        />
      </div>
    </div>
  );
}
