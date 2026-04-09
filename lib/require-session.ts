import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function requireApiSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}

/** Display name + email from Better Auth / Keycloak for `bookedBy` / `bookedByEmail`. */
export function bookingActorFromSessionUser(user: {
  name?: string | null;
  email?: string | null;
}) {
  const email = (user.email ?? "").trim();
  const name =
    (user.name ?? "").trim() ||
    (email ? (email.split("@")[0] ?? "") : "") ||
    "Unknown";
  return { bookedBy: name, bookedByEmail: email };
}

function toLowerTrimmed(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

/**
 * Best-effort Keycloak/Better Auth role extraction.
 * Supports common shapes like:
 * - user.roles: string[]
 * - user.role: string
 * - user.realm_access.roles: string[]
 * - user.resource_access[clientId].roles: string[]
 */
export function sessionUserHasRole(user: unknown, role: string): boolean {
  const want = toLowerTrimmed(role);
  if (!want) return false;

  const u = user as any;
  const roles: unknown[] = [];

  if (Array.isArray(u?.roles)) roles.push(...u.roles);
  if (typeof u?.role === "string") roles.push(u.role);
  if (Array.isArray(u?.realm_access?.roles)) roles.push(...u.realm_access.roles);

  const resourceAccess = u?.resource_access;
  if (resourceAccess && typeof resourceAccess === "object") {
    for (const v of Object.values(resourceAccess)) {
      if (Array.isArray((v as any)?.roles)) roles.push(...(v as any).roles);
    }
  }

  return roles.some((r) => toLowerTrimmed(r) === want);
}
