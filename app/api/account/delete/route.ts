// POST /api/account/delete: removes the resume files and the auth user. Rows cascade from auth.users.
// Body: { confirm: "DELETE" }. 200 { ok: true } | 400 | 401 | 500 { error }
import { cookies } from "next/headers";
import { getUser, json } from "@/lib/server";
import { adminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return json({ error: "Sign in first." }, 401);
  const body = await req.json().catch(() => null);
  if (body?.confirm !== "DELETE") return json({ error: "Type DELETE to confirm." }, 400);

  const FAILED = json({ error: "We could not delete your account. Nothing was removed. Try again." }, 500);
  const admin = adminClient();
  const bucket = admin.storage.from("resumes");
  const { data: files, error: listError } = await bucket.list(user.id);
  if (listError) return FAILED;
  if (files.length) {
    const { error } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
    if (error) return FAILED;
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: "We could not delete your account. Try again." }, 500);

  // The session no longer exists on the server; this clears its cookies.
  await supabase.auth.signOut({ scope: "local" }).catch(() => null);
  (await cookies()).delete("theme");
  return json({ ok: true });
}
