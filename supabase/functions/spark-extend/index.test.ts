import { loadSync } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

loadSync({ export: true, allowEmptyValues: true });

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const invoke = async (body: unknown, token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/spark-extend`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
};

Deno.test("rejects unauthenticated requests", async () => {
  const { status, json } = await invoke({ spark_id: "00000000-0000-0000-0000-000000000000", days: 1 });
  assertEquals(status, 401);
  assertEquals(json.error, "Unauthorized");
});

Deno.test("rejects request with anon key (no real user)", async () => {
  const { status, json } = await invoke(
    { spark_id: "00000000-0000-0000-0000-000000000000", days: 1 },
    SUPABASE_ANON_KEY,
  );
  // Anon key is not a valid user token
  assertEquals(status, 401);
});
