/**
 * Canonical public URL of this app (no trailing slash, with protocol).
 * Used for OAuth redirect_uri and CSRF origin checks.
 */
export function getBetterAuthPublicBaseUrl(): string {
  const raw =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (raw) {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return withProtocol.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

/** Origins allowed for Better Auth (CSRF / cross-origin). */
export function buildBetterAuthTrustedOrigins(): string[] {
  const origins = new Set<string>();
  const addUrl = (value: string | undefined) => {
    if (!value?.trim()) return;
    try {
      const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      origins.add(u.origin);
    } catch {
      /* ignore invalid */
    }
  };
  addUrl(process.env.BETTER_AUTH_URL);
  addUrl(process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
  if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
    for (const part of process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")) {
      const t = part.trim();
      if (!t) continue;
      addUrl(t.includes("://") ? t : `https://${t}`);
    }
  }
  return [...origins];
}
