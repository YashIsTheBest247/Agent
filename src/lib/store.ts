import "server-only";
import type { CaseRecord } from "@/lib/domain/case";
import type { QuoteRecord } from "@/lib/desks/quotes/record";

/**
 * Process-local record storage, one namespace per desk.
 *
 * Deliberately an interface with one trivial implementation: records are
 * written from exactly these four methods, so swapping in Postgres later is a
 * single file rather than a refactor. It does mean records do not survive a
 * restart or a cold serverless instance, which the list pages say out loud
 * rather than pretending otherwise.
 */
export interface RecordStore<T> {
  get(id: string): Promise<T | null>;
  put(record: T): Promise<void>;
  list(): Promise<T[]>;
  remove(id: string): Promise<void>;
}

type Stored = { id: string; createdAt: string };

const globalRef = globalThis as typeof globalThis & {
  __overturnStores?: Map<string, Map<string, unknown>>;
};

// Survives hot reloads in development, which otherwise drops everything on save.
const namespaces = (globalRef.__overturnStores ??= new Map());

function createMemoryStore<T extends Stored>(namespace: string): RecordStore<T> {
  const bucket = (namespaces.get(namespace) ??
    namespaces.set(namespace, new Map()).get(namespace)!) as Map<string, T>;

  return {
    async get(id) {
      return bucket.get(id) ?? null;
    },
    async put(record) {
      bucket.set(record.id, record);
    },
    async list() {
      return [...bucket.values()].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
    async remove(id) {
      bucket.delete(id);
    },
  };
}

export const caseStore = createMemoryStore<CaseRecord>("cases");
export const quoteStore = createMemoryStore<QuoteRecord>("quotes");

/** Ids carry their desk, so a stray id is obvious in a log or a URL. */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function newCaseId(): string {
  return newId("case");
}

export function newQuoteId(): string {
  return newId("quote");
}
