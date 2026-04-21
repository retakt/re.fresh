import { supabase } from "@/lib/supabase";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function invokeAdminFunction<TBody extends Record<string, unknown>>(
  functionName: string,
  body: TBody,
) {
  const token = await getAccessToken();

  if (!token) {
    return { ok: false, error: "You must be signed in." };
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.error) {
    return {
      ok: false,
      error: result.error || "Function request failed",
      data: result,
    };
  }

  return {
    ok: true,
    error: null,
    data: result,
  };
}
