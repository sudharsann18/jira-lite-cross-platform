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

    const { taskTitle, assignedTo, teamId } = await request.json();
    if (typeof taskTitle !== "string" || typeof assignedTo !== "string" || typeof teamId !== "string") {
      return respond({ error: "Invalid task notification payload" }, 400);
    }

    const adminClient = createClient(projectUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: team, error: teamError } = await adminClient
      .from("teams")
      .select("admin_profile_id, admin_id")
      .eq("id", teamId)
      .maybeSingle();

    if (teamError || !team) return respond({ error: "Team not found" }, 404);
    if (team.admin_profile_id !== user.id && team.admin_id !== user.id) {
      return respond({ error: "Only the team admin can send task notifications" }, 403);
    }

    const { data: member, error: memberError } = await adminClient
      .from("team_members")
      .select("profile_id")
      .eq("id", assignedTo)
      .eq("team_id", teamId)
      .maybeSingle();
    if (memberError || !member?.profile_id) return respond({ error: "Assignee not found" }, 404);

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("username, push_token")
      .eq("id", member.profile_id)
      .maybeSingle();
    if (profileError || !profile) return respond({ error: "Assignee profile not found" }, 404);
    if (!profile.push_token) return respond({ success: true, skipped: "No push token registered" });

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        to: profile.push_token,
        title: "New Task Assigned",
        body: taskTitle,
        data: { teamId },
      }),
    });
    const result = await pushResponse.json();
    if (!pushResponse.ok) return respond({ error: "Push provider rejected the notification" }, 502);
    return respond({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected function error";
    console.error("Task notification failed:", message);
    return respond({ error: message }, 500);
  }
});