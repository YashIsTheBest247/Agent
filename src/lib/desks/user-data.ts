import "server-only";
import { createStore } from "@/lib/store";
import { decoratorBook } from "./quotes/price-books";
import { electricalCatalog } from "./orders/catalogs";
import type { PriceBook } from "./quotes/domain";
import type { Catalog } from "./orders/domain";

/**
 * A user's own price book or catalogue.
 *
 * The seeded examples exist so the desks work out of the box, but a quote
 * priced from someone else's book is a demo, not a tool. One record per user
 * per desk, keyed by user id, so a run always prices against their data when
 * they have uploaded it.
 */
type Owned<T> = { id: string; createdAt: string; updatedAt: string; data: T };

const bookStore = createStore<Owned<PriceBook>>("pricebooks");
const catalogStore = createStore<Owned<Catalog>>("catalogs");

export async function getUserPriceBook(userId: string): Promise<PriceBook | null> {
  return (await bookStore.get(userId))?.data ?? null;
}

export async function saveUserPriceBook(userId: string, book: PriceBook) {
  const now = new Date().toISOString();
  const existing = await bookStore.get(userId);
  await bookStore.put({
    id: userId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    data: book,
  });
}

export async function clearUserPriceBook(userId: string) {
  await bookStore.remove(userId);
}

export async function getUserCatalog(userId: string): Promise<Catalog | null> {
  return (await catalogStore.get(userId))?.data ?? null;
}

export async function saveUserCatalog(userId: string, catalog: Catalog) {
  const now = new Date().toISOString();
  const existing = await catalogStore.get(userId);
  await catalogStore.put({
    id: userId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    data: catalog,
  });
}

export async function clearUserCatalog(userId: string) {
  await catalogStore.remove(userId);
}

/** The book a run should price against: the user's if they have one. */
export async function priceBookForUser(userId: string): Promise<PriceBook> {
  return (await getUserPriceBook(userId)) ?? decoratorBook;
}

/** The catalogue a run should resolve against: the user's if they have one. */
export async function catalogForUser(userId: string): Promise<Catalog> {
  return (await getUserCatalog(userId)) ?? electricalCatalog;
}
