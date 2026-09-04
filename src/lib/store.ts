import "server-only";
import type { CaseRecord } from "@/lib/domain/case";

/**
 * Process-local case storage.
 *
 * Deliberately an interface with one trivial implementation: cases are written
 * from exactly these four methods, so swapping in Postgres later is a single
 * file rather than a refactor. It does mean cases do not survive a restart or
 * a cold serverless instance, which the case list says out loud rather than
 * pretending otherwise.
 */
export interface CaseStore {
  get(id: string): Promise<CaseRecord | null>;
  put(record: CaseRecord): Promise<void>;
  list(): Promise<CaseRecord[]>;
  remove(id: string): Promise<void>;
}

const globalRef = globalThis as typeof globalThis & {
  __overturnCases?: Map<string, CaseRecord>;
};

// Survives hot reloads in development, which otherwise drops every case on save.
const cases = (globalRef.__overturnCases ??= new Map<string, CaseRecord>());

export const memoryStore: CaseStore = {
  async get(id) {
    return cases.get(id) ?? null;
  },
  async put(record) {
    cases.set(record.id, record);
  },
  async list() {
    return [...cases.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  },
  async remove(id) {
    cases.delete(id);
  },
};

export const caseStore: CaseStore = memoryStore;

export function newCaseId(): string {
  return `case_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
