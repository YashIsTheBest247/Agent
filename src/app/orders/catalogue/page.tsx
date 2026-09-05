import { DataUpload } from "@/components/desk/data-upload";
import { requireUser } from "@/lib/auth/guard";
import { getUserCatalog } from "@/lib/desks/user-data";
import { catalogTemplate } from "@/lib/desks/orders/import";

export const metadata = { title: "Your catalogue" };
export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const user = await requireUser("/orders/catalogue");
  const catalog = await getUserCatalog(user.id);

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="eyebrow">Orders desk</div>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
        <span className="display">Your </span>
        <span className="script text-[var(--ok-deep)]">catalogue</span>
      </h1>
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text-2)]">
        Nothing is confirmed that does not resolve to a line in here, in stock,
        at the agreed price. A row missing a price or a stock figure is rejected:
        the gate cannot confirm a line whose availability is unknown.
      </p>

      <div className="mt-8">
        <DataUpload
          endpoint="/api/orders/catalogue"
          noun="catalogue"
          template={catalogTemplate}
          current={catalog ? { name: catalog.name, items: catalog.items.length } : null}
          columns={[
            { name: "name", required: true, note: "The product name customers order against." },
            { name: "price", required: true, note: "List price. Customer discounts are applied on top." },
            { name: "stock", required: true, note: "Units on hand. An empty cell is rejected, not read as zero." },
            { name: "sku", required: false, note: "Your own code. Derived from the name if absent." },
            { name: "unit", required: false, note: "each, drum, metre. Defaults to each." },
            { name: "leadtime", required: false, note: "Days for the balance of a short-stocked line. Defaults to 5." },
            { name: "minorder", required: false, note: "Minimum order quantity. Defaults to 1." },
            { name: "aliases", required: false, note: "What customers actually call it, separated by | or ;" },
          ]}
        />
      </div>
    </div>
  );
}
