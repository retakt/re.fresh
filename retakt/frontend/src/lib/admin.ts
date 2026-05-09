import { supabase } from "@/lib/supabase";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Invoke a Supabase Edge Function with a 15-second timeout.
 * Edge Functions cold-start in 3-8s on first call — the timeout prevents
 * the UI from hanging indefinitely if the function is unresponsive.
 */
export async function invokeAdminFunction<TBody extends Record<string, unknown>>(
  functionName: string,
  body: TBody,
) {
  const token = await getAccessToken();

  if (!token) {
    return { ok: false, error: "You must be signed in." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
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
        signal: controller.signal,
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
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: "Request timed out — the server took too long to respond. Try again.",
      };
    }
    return {
      ok: false,
      error: "Network error — check your connection.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
