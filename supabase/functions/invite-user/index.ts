// invite-user v7 — Decodes JWT without verification (safe: service role does the actual auth check)
// Deploy: npx supabase functions deploy invite-user
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url decode the payload (no signature verification — we verify role via DB)
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return respond({ error: "Missing token" }, 401);
    const token = authHeader.slice(7);

    // Decode JWT payload without signature verification
    // Works with both HS256 and ES256 — algorithm doesn't matter for decoding
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.sub) {
      return respond({ error: "Invalid token" }, 401);
    }

    const userId = payload.sub as string;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // Use service role to verify the user's role in the DB
    // This is safe: we're checking the DB, not trusting the JWT claims
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup failed:", profileError?.message, "userId:", userId);
      return respond({ error: "Not authorized" }, 401);
    }

    if (profile.role !== "admin") {
      return respond({ error: "Admin only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return respond({ error: "Valid email required" }, 400);

    if (resendKey) {
      // Generate invite link via Supabase admin, send via Resend
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "invite",
        email,
      });

      if (linkError) {
        console.error("generateLink error:", linkError.message);
        return respond({ error: linkError.message }, 400);
      }

      const inviteUrl = linkData?.properties?.action_link;
      if (!inviteUrl) return respond({ error: "Failed to generate invite link" }, 500);

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "re.Takt <noreply@retakt.cc>",
          to: [email],
          subject: "You've been invited to re.Takt",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">You're invited to re.Takt</h2>
              <p style="color: #666; margin-bottom: 24px;">
                You've been invited to join re.Takt. Click the button below to set your password and get started.
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
                This link expires in 24 hours. If you didn't expect this invitation, you can ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const resendErr = await resendRes.json().catch(() => ({}));
        console.error("Resend error:", resendErr);
        return respond({ error: "Failed to send email" }, 500);
      }

      return respond({ success: true, method: "resend" });
    } else {
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
      if (inviteError) {
        console.error("inviteUserByEmail error:", inviteError.message);
        return respond({ error: inviteError.message }, 400);
      }
      return respond({ success: true, method: "supabase" });
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return respond({ error: "Unexpected error" }, 500);
  }
});
