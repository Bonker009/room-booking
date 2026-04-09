import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "path";
import { genericOAuth, keycloak } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import {
  buildBetterAuthTrustedOrigins,
  getBetterAuthPublicBaseUrl,
} from "@/lib/auth-public";

const authDbPath = path.join(process.cwd(), "data", "auth.db");

function getSecret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] BETTER_AUTH_SECRET is missing or shorter than 32 characters. Set a strong secret in production.",
    );
  }
  return "dev-only-better-auth-secret-min-32-chars!";
}

const trustedOrigins = buildBetterAuthTrustedOrigins();

export const auth = betterAuth({
  database: new Database(authDbPath),
  secret: getSecret(),
  // Must match the URL users use in the browser (OAuth redirect_uri, cookies).
  baseURL: getBetterAuthPublicBaseUrl(),
  trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : undefined,
  emailAndPassword: { enabled: false },
  plugins: [
    genericOAuth({
      config: [
        keycloak({
          clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
          issuer: process.env.KEYCLOAK_ISSUER ?? "",
        }),
      ],
    }),
    nextCookies(),
  ],
});
