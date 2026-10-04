import { supabase } from "../lib/supabase";

export async function saveTeam(team: any, adminProfileId: string): Promise<boolean> {
  const { error } = await supabase
    .from("teams")
    .insert({
      team_name: team.teamName,
      team_code: team.teamCode,
      admin_id: adminProfileId,
      admin_profile_id: adminProfileId,
    });

  if (error) return false;
  return true;
}

export async function loadTeamByCredentials(teamName: string, teamCode: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*, team_members(*)")
    .eq("team_name", teamName)
    .eq("team_code", teamCode)
    .single();

  if (error || !data) return null;

  return {
    teamId: data.id,
    teamName: data.team_name,
    teamCode: data.team_code,
    adminId: data.admin_id,
    users: data.team_members.map((m: any) => ({ id: m.id, name: m.name })),
  };
}

export async function loadTeam(teamId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*, team_members(*)")
    .eq("id", teamId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    teamId: data.id,
    teamName: data.team_name,
    teamCode: data.team_code,
    adminId: data.admin_id,
    users: data.team_members.map((m: any) => ({ id: m.id, name: m.name })),
  };
}