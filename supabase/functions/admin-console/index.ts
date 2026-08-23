import { withSupabase } from "npm:@supabase/server";

type AdminRequest = {
  action?: "unlock" | "list_users" | "adjust_points" | "set_status" | "set_role" | "ledger" | "audit" | "season" | "update_season";
  password?: string;
  query?: string;
  targetUserId?: string;
  adjustment?: number;
  note?: string;
  status?: "active" | "suspended";
  role?: "player" | "moderator" | "admin";
  season?: {
    title?: string;
    label?: string;
    startsAt?: string;
    endsAt?: string;
    status?: "upcoming" | "active" | "finished";
    leaderboardRefreshMinutes?: number;
  };
};

const encoder = new TextEncoder();
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const configured = (Deno.env.get("ADMIN_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return LOCAL_ORIGIN.test(origin) || configured.includes(origin) ? origin : null;
}

function response(origin: string | null, status: number, body: Record<string, unknown>) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "vary": "Origin",
  });
  if (origin) headers.set("access-control-allow-origin", origin);
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

const securedFetch = withSupabase({ auth: "user" }, async (request, context) => {
    const origin = allowedOrigin(request);
    if (request.headers.has("origin") && !origin) return response(null, 403, { error: "origin_not_allowed" });
    if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

    const expectedPasswordHash = (Deno.env.get("ADMIN_PANEL_PASSWORD_SHA256") ?? "").trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(expectedPasswordHash)) {
      return response(origin, 503, { error: "admin_console_not_configured" });
    }

    const actorUserId = context.userClaims?.id ?? context.jwtClaims?.sub;
    if (!actorUserId) return response(origin, 401, { error: "invalid_session" });
    const { data: actorProfile, error: actorProfileError } = await context.supabase
      .from("profiles")
      .select("user_id, display_name, role, status")
      .eq("user_id", actorUserId)
      .maybeSingle();
    if (actorProfileError) {
      console.error("admin_profile_lookup_failed", { actorUserId, message: actorProfileError.message });
      return response(origin, 500, { error: "admin_profile_lookup_failed" });
    }
    if (!actorProfile) {
      console.error("admin_profile_missing", { actorUserId });
      return response(origin, 403, { error: "admin_profile_missing" });
    }
    if (actorProfile.role !== "admin" || actorProfile.status !== "active") {
      return response(origin, 403, {
        error: "admin_role_required",
        currentRole: actorProfile.role,
        currentStatus: actorProfile.status,
      });
    }

    const adminClient = context.supabaseAdmin;

    let body: AdminRequest;
    try {
      body = await request.json();
    } catch {
      return response(origin, 400, { error: "invalid_json" });
    }

    const now = new Date();
    const { data: guard } = await adminClient
      .from("admin_access_guards")
      .select("failed_attempts, window_started_at, blocked_until")
      .eq("user_id", actorUserId)
      .maybeSingle();
    if (guard?.blocked_until && new Date(guard.blocked_until) > now) {
      return response(origin, 429, { error: "admin_access_temporarily_blocked", retryAt: guard.blocked_until });
    }

    const suppliedHash = await sha256(body.password ?? "");
    if (!constantTimeEqual(suppliedHash, expectedPasswordHash)) {
      const windowStarted = guard?.window_started_at ? new Date(guard.window_started_at) : now;
      const inCurrentWindow = now.getTime() - windowStarted.getTime() < 15 * 60_000;
      const failedAttempts = inCurrentWindow ? (guard?.failed_attempts ?? 0) + 1 : 1;
      const blockedUntil = failedAttempts >= 5 ? new Date(now.getTime() + 15 * 60_000).toISOString() : null;
      await adminClient.from("admin_access_guards").upsert({
        user_id: actorUserId,
        failed_attempts: failedAttempts,
        window_started_at: inCurrentWindow ? windowStarted.toISOString() : now.toISOString(),
        blocked_until: blockedUntil,
        updated_at: now.toISOString(),
      });
      return response(origin, failedAttempts >= 5 ? 429 : 403, {
        error: failedAttempts >= 5 ? "admin_access_temporarily_blocked" : "invalid_admin_password",
        attemptsRemaining: Math.max(0, 5 - failedAttempts),
        retryAt: blockedUntil,
      });
    }

    await adminClient.from("admin_access_guards").upsert({
      user_id: actorUserId,
      failed_attempts: 0,
      window_started_at: now.toISOString(),
      blocked_until: null,
      updated_at: now.toISOString(),
    });

    if (body.action === "unlock") {
      return response(origin, 200, { admin: { id: actorUserId, displayName: actorProfile.display_name } });
    }

    if (body.action === "list_users") {
      const query = (body.query ?? "").trim().slice(0, 64);
      const safeQuery = query.replace(/[%,]/g, "");
      let profileQuery = adminClient
        .from("profiles")
        .select("user_id, display_name, avatar_id, frame_id, role, status, activity_points, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (safeQuery) profileQuery = profileQuery.ilike("display_name", `%${safeQuery}%`);
      const { data: profiles, error } = await profileQuery;
      if (error) {
        console.error("admin_users_load_failed", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return response(origin, 500, {
          error: "users_load_failed",
          diagnostic: [error.code, error.message, error.details, error.hint].filter(Boolean).join(" · "),
        });
      }
      const userIds = (profiles ?? []).map((profile) => profile.user_id);
      const resultStats = new Map<string, { bestScore: number; gamesPlayed: number; lastPlayedAt: string | null }>();
      if (userIds.length) {
        const { data: results } = await adminClient
          .from("rovers_results")
          .select("user_id, score, received_at")
          .in("user_id", userIds)
          .eq("status", "accepted");
        for (const result of results ?? []) {
          const current = resultStats.get(result.user_id) ?? { bestScore: 0, gamesPlayed: 0, lastPlayedAt: null };
          current.bestScore = Math.max(current.bestScore, result.score);
          current.gamesPlayed += 1;
          if (!current.lastPlayedAt || result.received_at > current.lastPlayedAt) current.lastPlayedAt = result.received_at;
          resultStats.set(result.user_id, current);
        }
      }
      return response(origin, 200, {
        users: (profiles ?? []).map((profile) => ({
          userId: profile.user_id,
          displayName: profile.display_name,
          avatarId: profile.avatar_id,
          frameId: profile.frame_id,
          role: profile.role,
          status: profile.status,
          activityPoints: profile.activity_points,
          createdAt: profile.created_at,
          bestScore: resultStats.get(profile.user_id)?.bestScore ?? 0,
          gamesPlayed: resultStats.get(profile.user_id)?.gamesPlayed ?? 0,
          lastPlayedAt: resultStats.get(profile.user_id)?.lastPlayedAt ?? null,
        })),
      });
    }

    if (body.action === "adjust_points") {
      if (!body.targetUserId || !Number.isInteger(body.adjustment)) return response(origin, 400, { error: "invalid_adjustment" });
      const { data, error } = await adminClient.rpc("admin_adjust_activity_points", {
        target_user_id: body.targetUserId,
        adjustment: body.adjustment,
        adjustment_note: body.note ?? "",
        actor_user_id: actorUserId,
      });
      if (error) return response(origin, 400, { error: error.message });
      return response(origin, 200, { activityPoints: data });
    }

    if (body.action === "set_status") {
      if (!body.targetUserId || !body.status) return response(origin, 400, { error: "invalid_status" });
      const { data, error } = await adminClient.rpc("admin_set_profile_status", {
        target_user_id: body.targetUserId,
        next_status: body.status,
        status_note: body.note ?? "",
        actor_user_id: actorUserId,
      });
      if (error) return response(origin, 400, { error: error.message });
      return response(origin, 200, { status: data });
    }

    if (body.action === "set_role") {
      if (!body.targetUserId || !body.role) return response(origin, 400, { error: "invalid_profile_role" });
      const { data, error } = await adminClient.rpc("admin_set_profile_role", {
        target_user_id: body.targetUserId,
        next_role: body.role,
        role_note: body.note ?? "",
        actor_user_id: actorUserId,
      });
      if (error) return response(origin, 400, { error: error.message });
      return response(origin, 200, { role: data });
    }

    if (body.action === "ledger") {
      if (!body.targetUserId) return response(origin, 400, { error: "target_required" });
      const { data, error } = await adminClient
        .from("activity_point_ledger")
        .select("id, amount, reason, note, actor_user_id, created_at")
        .eq("user_id", body.targetUserId)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) return response(origin, 500, { error: "ledger_load_failed" });
      return response(origin, 200, { entries: data ?? [] });
    }

    if (body.action === "audit") {
      const { data, error } = await adminClient
        .from("admin_audit_log")
        .select("id, actor_user_id, target_user_id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return response(origin, 500, { error: "audit_load_failed" });
      return response(origin, 200, { entries: data ?? [] });
    }

    if (body.action === "season") {
      const { data, error } = await adminClient
        .from("boostplay_season_settings")
        .select("title, label, starts_at, ends_at, status, leaderboard_refresh_minutes, updated_at")
        .eq("id", "current")
        .single();
      if (error) return response(origin, 500, { error: "season_load_failed" });
      return response(origin, 200, { season: {
        title: data.title,
        label: data.label,
        startsAt: data.starts_at,
        endsAt: data.ends_at,
        status: data.status,
        leaderboardRefreshMinutes: data.leaderboard_refresh_minutes,
        updatedAt: data.updated_at,
      } });
    }

    if (body.action === "update_season") {
      const season = body.season;
      if (!season?.title || !season.label || !season.startsAt || !season.endsAt || !season.status
        || !Number.isInteger(season.leaderboardRefreshMinutes)) {
        return response(origin, 400, { error: "invalid_season_settings" });
      }
      const { error } = await adminClient.rpc("admin_update_boostplay_season", {
        season_title: season.title,
        season_label: season.label,
        season_starts_at: season.startsAt,
        season_ends_at: season.endsAt,
        season_status: season.status,
        refresh_minutes: season.leaderboardRefreshMinutes,
        actor_user_id: actorUserId,
      });
      if (error) return response(origin, 400, { error: error.message });
      return response(origin, 200, { saved: true });
    }

    return response(origin, 400, { error: "unknown_action" });
});

export default {
  fetch: (request: Request) => {
    if (request.method === "OPTIONS") {
      const origin = allowedOrigin(request);
      if (!origin) return response(null, 403, { error: "origin_not_allowed" });
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-max-age": "86400",
          "vary": "Origin",
        },
      });
    }
    return securedFetch(request);
  },
};
