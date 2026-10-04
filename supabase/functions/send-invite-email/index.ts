import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authorization || !projectUrl || !anonKey || !serviceRoleKey) {
      return respond({ error: "Function configuration is incomplete" }, 500);
    }

    const userClient = createClient(projectUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return respond({ error: "Authentication required" }, 401);

    const { inviteId } = await request.json();
    if (typeof inviteId !== "string") return respond({ error: "Invalid invite ID" }, 400);

    const adminClient = createClient(projectUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: invite, error: inviteError } = await adminClient
      .from("team_invites")
      .select("id, team_id, invited_profile_id, status")
      .eq("id", inviteId)
      .maybeSingle();
    if (inviteError || !invite) return respond({ error: "Invite not found" }, 404);
    if (invite.status !== "pending") return respond({ error: "Invite is no longer pending" }, 409);

    const { data: team, error: teamError } = await adminClient
      .from("teams")
      .select("team_name, admin_profile_id, admin_id")
      .eq("id", invite.team_id)
      .maybeSingle();
    if (teamError || !team) return respond({ error: "Team not found" }, 404);
    if (team.admin_profile_id !== user.id && team.admin_id !== user.id) {
      return respond({ error: "Only the team admin can send invitations" }, 403);
    }

    const { data: invitedUser, error: userError } = await adminClient.auth.admin.getUserById(invite.invited_profile_id);
    const email = invitedUser?.user?.email;
    if (userError || !email) return respond({ error: "Invitee email is unavailable" }, 404);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("INVITE_FROM_EMAIL");
    if (!resendKey || !fromAddress) {
      return respond({ error: "Invite saved, but email delivery is not configured" }, 503);
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `You're invited to join ${team.team_name}`,
        text: `You have a pending invitation to join ${team.team_name} in Jira Lite. Sign in to the app and open Pending Invites to respond.`,
      }),
    });
    if (!emailResponse.ok) {
      console.error("Invite email provider returned status:", emailResponse.status);
      return respond({ error: "Invite was saved, but the email provider rejected delivery" }, 502);
    }

    return respond({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected function error";
    console.error("Invite email failed:", message);
    return respond({ error: message }, 500);
  }
});