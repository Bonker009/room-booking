import { NextResponse } from "next/server";

import { getPendingBookings } from "@/lib/db";
import { requireApiSession, sessionUserHasRole } from "@/lib/require-session";

export async function GET() {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;

  if (!sessionUserHasRole(authResult.session.user, "role_admin")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const bookings = await getPendingBookings();
    return NextResponse.json({ bookings, total: bookings.length });
  } catch (error) {
    console.error("Pending bookings error:", error);
    return NextResponse.json(
      { message: "Failed to load pending bookings" },
      { status: 500 },
    );
  }
}
