import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { action, memberId, role, username } = await req.json();

    if (!memberId || typeof memberId !== "string") {
      return jsonError("memberId is required");
    }

    if (action === "update_role") {
      if (memberId === user.id) {
        return jsonError("You cannot change your own role here", 403);
      }

      if (!["member", "editor", "admin"].includes(role)) {
        return jsonError("Invalid role");
      }

      const { error } = await adminClient
        .from("profiles")
        .update({ role })
        .eq("id", memberId);

      if (error) return jsonError(error.message);
      return jsonResponse({ success: true });
    }

    if (action === "update_username") {
      const normalizedUsername =
        typeof username === "string" && username.trim() ? username.trim() : null;

      const { error } = await adminClient
        .from("profiles")
        .update({ username: normalizedUsername })
        .eq("id", memberId);

      if (error) return jsonError(error.message);
      return jsonResponse({ success: true });
    }

    if (action === "delete_member") {
      if (memberId === user.id) {
        return jsonError("You cannot delete your own admin account here", 403);
      }

      const { error: profileDeleteError } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", memberId);

      if (profileDeleteError) return jsonError(profileDeleteError.message);

      const { error: userDeleteError } = await adminClient.auth.admin.deleteUser(memberId);
      if (userDeleteError) return jsonError(userDeleteError.message);

      return jsonResponse({ success: true });
    }

    return jsonError("Unsupported action");
  } catch {
    return jsonError("Invalid request");
  }
});
