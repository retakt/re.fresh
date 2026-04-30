import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  corsHeaders,
  jsonError,
  jsonResponse,
  requireAdmin,
} from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireAdmin(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { adminClient } = auth;
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return jsonError("email is required");
    }

    const { error } = await adminClient.auth.resetPasswordForEmail(email);
    if (error) return jsonError(error.message);

    return jsonResponse({ success: true });
  } catch {
    return jsonError("Invalid request");
  }
});
