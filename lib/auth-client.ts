import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

/**
 * Browser needs the full `/api/auth` base when the public URL is only set via
 * env (e.g. SSR). In the browser, missing env falls back to same-origin via Better Auth defaults.
 */
function clientAuthApiBase(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim().replace(/\/$/, "") ?? "";
  if (!raw) return undefined;
  try {
    const origin = new URL(
      /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
    ).origin;
    return `${origin}/api/auth`;
  } catch {
    return undefined;
  }
}

export const authClient = createAuthClient({
  baseURL: clientAuthApiBase(),
  plugins: [genericOAuthClient()],
});
