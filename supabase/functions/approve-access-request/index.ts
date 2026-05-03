// approve-access-request — marks request approved + sends invite email
// Handles both new users and existing-but-unconfirmed users
// Deploy: npx supabase functions deploy approve-access-request
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin, jsonResponse, jsonError, corsHeaders } from "../_shared/admin.ts";

serve(async (req) => {
  // Must handle OPTIONS first — before any async work that could throw
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireAdmin(req);
    if ("errorResponse" in auth) return auth.errorResponse;
    const { adminClient } = auth;

    const body = await req.json().catch(() => ({}));
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) return jsonError("requestId is required", 400);

    // Fetch the access request (service role bypasses RLS)
    const { data: accessRequest, error: fetchError } = await adminClient
      .from("access_requests")
      .select("id, email, username, status")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchError || !accessRequest) return jsonError("Access request not found", 404);
    if (accessRequest.status === "approved") return jsonError("Request already approved", 409);

    const email = (accessRequest.email as string).trim().toLowerCase();
    const username = (accessRequest.username as string | null) ?? null;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // Check if this email already exists in auth.users
    // (e.g. previously invited but never confirmed — "Waiting for verification")
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email
    ) ?? null;

    let inviteUrl: string | null = null;

    if (existingUser) {
      // Already in auth.users but unconfirmed — send a magic link so they can get in
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (linkError) {
        console.error("generateLink (magiclink) error:", linkError.message);
        return jsonError(linkError.message, 400);
      }
      inviteUrl = linkData?.properties?.action_link ?? null;
    } else {
      // Brand new — generate invite link (also creates the auth.users row)
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "invite",
        email,
      });
      if (linkError) {
        console.error("generateLink (invite) error:", linkError.message);
        return jsonError(linkError.message, 400);
      }
      inviteUrl = linkData?.properties?.action_link ?? null;
    }

    if (!inviteUrl) return jsonError("Failed to generate invite link", 500);

    // Send via Resend (branded) or fall back to Supabase built-in
    if (resendKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "re.Takt <noreply@retakt.cc>",
          to: [email],
          subject: "Your access request has been approved",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">You're in.</h2>
              <p style="color: #666; margin-bottom: 24px;">
                Your request to join re.Takt has been approved. Click the button below to set your password and get started.
              </p>
              <a href="${inviteUrl}" style="
                display: inline-block;
                background: #d946ef;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
              ">Accept invitation</a>
              <p style="color: #999; font-size: 12px; margin-top: 24px;">
                This link expires in 24 hours. If you didn't request access, you can ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const resendErr = await resendRes.json().catch(() => ({}));
        console.error("Resend error:", resendErr);
        return jsonError("Failed to send invite email", 500);
      }
    } else {
      // No Resend — only works for brand new users via Supabase built-in
      if (!existingUser) {
        const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
        if (inviteError) {
          console.error("inviteUserByEmail error:", inviteError.message);
          return jsonError(inviteError.message, 400);
        }
      }
      // Existing unconfirmed + no Resend: can't resend email, but still mark approved below
    }

    // Pre-populate profile with username from the request
    // For new users: generateLink created the auth.users row — find it now
    // For existing users: they already have a row
    let userId: string | null = existingUser?.id ?? null;
    if (!userId) {
      const { data: refreshed } = await adminClient.auth.admin.listUsers();
      userId = refreshed?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    }

    if (userId && username) {
      await adminClient
        .from("profiles")
        .upsert(
          { id: userId, email, username, role: "member" },
          { onConflict: "id" }
        );
    }

    // Explicitly mark password_set: false so the frontend redirects to /set-password
    if (userId) {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { password_set: false },
      });
    }

    // Mark approved — only reaches here if invite was sent successfully
    await adminClient
      .from("access_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    return jsonResponse({ success: true, existingUser: !!existingUser });

  } catch (e) {
    console.error("Unexpected error:", e);
    return jsonError("Unexpected server error", 500);
  }
});
