import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "path";
import { genericOAuth, keycloak } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

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

export const auth = betterAuth({
  database: new Database(authDbPath),
  secret: getSecret(),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
    : undefined,
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
