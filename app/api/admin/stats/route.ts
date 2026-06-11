import { NextResponse } from "next/server";

import { getAdminBookingStats } from "@/lib/db";
import { requireApiSession, sessionUserHasRole } from "@/lib/require-session";

export async function GET() {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;

  if (!sessionUserHasRole(authResult.session.user, "role_admin")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const stats = await getAdminBookingStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { message: "Failed to load stats" },
      { status: 500 },
    );
  }
}
