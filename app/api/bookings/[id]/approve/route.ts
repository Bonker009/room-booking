import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { checkBookingConflicts, getBookingById, updateBooking } from "@/lib/db";
import { notifyBookingEvent } from "@/lib/notifications";
import {
  bookingActorFromSessionUser,
  requireApiSession,
  sessionUserHasRole,
} from "@/lib/require-session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;

  if (!sessionUserHasRole(authResult.session.user, "role_admin")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if ((booking.status ?? "confirmed") !== "pending") {
      return NextResponse.json(
        { message: "Only pending bookings can be approved" },
        { status: 400 },
      );
    }

    const hasConflict = await checkBookingConflicts(
      {
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        className: booking.className,
      },
      id,
    );

    if (hasConflict) {
      return NextResponse.json(
        { message: "Cannot approve — room conflict exists" },
        { status: 409 },
      );
    }

    const updated = await updateBooking(id, { status: "confirmed" });
    const { bookedByEmail } = bookingActorFromSessionUser(authResult.session.user);

    notifyBookingEvent({
      event: "approved",
      booking: updated,
      actorEmail: bookedByEmail,
    });

    revalidateTag("bookings", "max");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Approve booking error:", error);
    return NextResponse.json(
      { message: "Failed to approve booking" },
      { status: 500 },
    );
  }
}
