import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  corsHeaders,
  createAdminClient,
  jsonError,
  jsonResponse,
} from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  try {
    const { identifier } = await req.json();

    if (!identifier || typeof identifier !== "string") {
      return jsonError("identifier is required");
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      return jsonError("identifier is required");
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("profiles")
      .select("id, email")
      .ilike("username", normalizedIdentifier)
      .maybeSingle();

    if (error) {
      return jsonError(error.message);
    }

    let resolvedEmail = data?.email ?? null;

    if (!resolvedEmail && data?.id) {
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(data.id);

      if (userError) {
        return jsonError(userError.message);
      }

      resolvedEmail = userData.user?.email ?? null;
    }

    return jsonResponse({
      resolvedEmail,
    });
  } catch {
    return jsonError("Invalid request");
  }
});
