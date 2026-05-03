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

    const { adminClient, user } = auth;
    const { memberId, email } = await req.json();

    if (!memberId || typeof memberId !== "string") {
      return jsonError("memberId is required");
    }

    if (!email || typeof email !== "string") {
      return jsonError("email is required");
    }

    if (memberId === user.id) {
      return jsonError("Change your own email directly in Supabase for now", 403);
    }

    const { error: userError } = await adminClient.auth.admin.updateUserById(
      memberId,
      { email, email_confirm: true },
    );
    if (userError) return jsonError(userError.message);

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ email })
      .eq("id", memberId);

    if (profileError) return jsonError(profileError.message);

    return jsonResponse({ success: true });
  } catch {
    return jsonError("Invalid request");
  }
});
