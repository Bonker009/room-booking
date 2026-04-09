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
