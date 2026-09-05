import "server-only";
import type { RecordStore } from "./store";

/**
 * Durable storage over Supabase's REST endpoint.
 *
 * Deliberately no client library: PostgREST is a plain HTTP API, and `fetch`
 * reaches it from any runtime without adding a dependency or a connection pool
 * that serverless would immediately misuse.
 *
 * One table holds every desk, keyed by namespace, because the records are
 * already self-describing JSON and giving each desk its own table would buy
 * nothing but migrations. See `supabase/schema.sql`.
 */
type Stored = { id: string; createdAt: string };

type Row<T> = { data: T };

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set to use Supabase storage.",
    );
  }
  return { endpoint: `${url}/rest/v1/records`, key };
}

function headers(extra: Record<string, string> = {}): HeadersInit {
  const { key } = config();
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...extra,
  };
}

/**
 * The service-role key bypasses row-level security, so it must never reach a
 * browser. Every call here runs server-side; `server-only` enforces it.
 */
export function createSupabaseStore<T extends Stored>(
  namespace: string,
): RecordStore<T> {
  const ns = encodeURIComponent(namespace);

  return {
    async get(id) {
      const { endpoint } = config();
      const url = `${endpoint}?namespace=eq.${ns}&id=eq.${encodeURIComponent(id)}&select=data&limit=1`;
      const response = await fetch(url, { headers: headers(), cache: "no-store" });
      if (!response.ok) return null;

      const rows = (await response.json()) as Row<T>[];
      return rows[0]?.data ?? null;
    },

    async put(record) {
      const { endpoint } = config();
      const response = await fetch(endpoint, {
        method: "POST",
        // Upsert: a run writes the same row once per stage.
        headers: headers({ prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({
          namespace,
          id: record.id,
          created_at: record.createdAt,
          data: record,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Supabase write failed (${response.status}): ${await response.text()}`,
        );
      }
    },

    async list() {
      const { endpoint } = config();
      const url = `${endpoint}?namespace=eq.${ns}&select=data&order=created_at.desc`;
      const response = await fetch(url, { headers: headers(), cache: "no-store" });
      if (!response.ok) return [];

      const rows = (await response.json()) as Row<T>[];
      return rows.map((r) => r.data);
    },

    async remove(id) {
      const { endpoint } = config();
      const url = `${endpoint}?namespace=eq.${ns}&id=eq.${encodeURIComponent(id)}`;
      await fetch(url, { method: "DELETE", headers: headers() });
    },
  };
}
