const YANDEX_USERINFO_URL = "https://login.yandex.ru/info?format=json";
const ALLOWED_EMAIL_DOMAIN = "yandex-team.ru";

type YandexUserInfo = {
  id?: string;
  login?: string;
  default_email?: string;
  emails?: string[];
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const getAccessToken = (authorization: string | null) => {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
};

const findAllowedEmail = (profile: YandexUserInfo) => {
  const candidates = [profile.default_email, ...(profile.emails ?? [])];

  return candidates.find((email) => {
    if (typeof email !== "string") return false;
    return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
  });
};

export default {
  fetch: async (request: Request) => {
    if (request.method !== "GET") {
      return jsonResponse(405, { error: "method_not_allowed" });
    }

    const accessToken = getAccessToken(request.headers.get("authorization"));
    if (!accessToken) {
      return jsonResponse(401, { error: "missing_access_token" });
    }

    let yandexResponse: Response;

    try {
      yandexResponse = await fetch(YANDEX_USERINFO_URL, {
        headers: { Authorization: `OAuth ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return jsonResponse(502, { error: "yandex_unavailable" });
    }

    if (!yandexResponse.ok) {
      return jsonResponse(401, { error: "invalid_yandex_token" });
    }

    const profile = (await yandexResponse.json()) as YandexUserInfo;
    const email = findAllowedEmail(profile)?.trim().toLowerCase();

    if (!profile.id || !email) {
      return jsonResponse(403, { error: "corporate_email_required" });
    }

    return jsonResponse(200, {
      sub: String(profile.id),
      email,
      email_verified: true,
      preferred_username: email.slice(0, email.indexOf("@")),
    });
  },
};
