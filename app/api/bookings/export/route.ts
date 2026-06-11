import { NextResponse } from "next/server";

import { bookingsToCsv } from "@/lib/booking-export";
import { getBookings } from "@/lib/db";
import {
  hasBookingsQueryParams,
  parseBookingsSearchParams,
} from "@/lib/booking-query";
import {
  bookingActorFromSessionUser,
  requireApiSession,
} from "@/lib/require-session";

export async function GET(request: Request) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseBookingsSearchParams(searchParams);

    if (query.tab === "mine") {
      const { bookedByEmail } = bookingActorFromSessionUser(
        authResult.session.user,
      );
      query.bookedByEmailExact = bookedByEmail;
    }

    const { bookings } = hasBookingsQueryParams(query)
      ? await getBookings(query)
      : await getBookings({});

    const csv = bookingsToCsv(bookings);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${stamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { message: "Failed to export bookings" },
      { status: 500 },
    );
  }
}
