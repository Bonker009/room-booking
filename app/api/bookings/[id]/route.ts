import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getBookingById,
  updateBooking,
  removeBooking,
  removeBookingSeries,
  updateBookingSeries,
  checkBookingConflicts,
} from "@/lib/db";
import { validateSlotOrResponse } from "@/lib/booking-api-helpers";
import { notifyBookingEvent } from "@/lib/notifications";
import {
  requireApiSession,
  bookingActorFromSessionUser,
  sessionUserHasRole,
} from "@/lib/require-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;
  const { bookedBy, bookedByEmail } = bookingActorFromSessionUser(
    authResult.session.user,
  );
  try {
    const { id } = await params;
    const body = await request.json();

    const requiredFields = [
      "date",
      "startTime",
      "endTime",
      "groupName",
      "className",
      "purpose",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const existingBooking = await getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Only booking owner or role_admin can edit.
    const isAdmin = sessionUserHasRole(authResult.session.user, "role_admin");
    const actorEmail = bookedByEmail.trim().toLowerCase();
    const ownerEmail = (existingBooking.bookedByEmail ?? "").trim().toLowerCase();
    const isOwner =
      Boolean(actorEmail) && Boolean(ownerEmail) && ownerEmail === actorEmail;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const slotCheck = validateSlotOrResponse(
      {
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
      },
      isAdmin,
    );
    if (!slotCheck.ok) {
      return NextResponse.json({ message: slotCheck.message }, { status: 400 });
    }

    const scope = new URL(request.url).searchParams.get("scope");
    const patch = {
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      groupName: body.groupName,
      className: body.className,
      bookedBy,
      bookedByEmail,
      purpose: body.purpose,
      description: body.description,
      status: body.status,
    };

    if (scope === "series" && existingBooking.seriesId) {
      const seriesResult = await updateBookingSeries(existingBooking.seriesId, {
        startTime: body.startTime,
        endTime: body.endTime,
        groupName: body.groupName,
        className: body.className,
        purpose: body.purpose,
        description: body.description,
      });

      if (seriesResult.updated.length === 0) {
        return NextResponse.json(
          {
            message: "No bookings updated — conflicts on all series days",
            conflicts: seriesResult.conflicts,
          },
          { status: 409 },
        );
      }

      for (const booking of seriesResult.updated) {
        notifyBookingEvent({
          event: "updated",
          booking,
          actorEmail: bookedByEmail,
        });
      }

      revalidateTag("bookings", "max");
      return NextResponse.json({
        updated: seriesResult.updated,
        conflicts: seriesResult.conflicts,
      });
    }

    const hasConflict = await checkBookingConflicts(
      {
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        className: body.className,
      },
      id,
    );

    if (hasConflict) {
      return NextResponse.json(
        { message: "This room is already booked during this time" },
        { status: 409 },
      );
    }

    const updatedBooking = await updateBooking(id, patch);

    notifyBookingEvent({
      event: "updated",
      booking: updatedBooking,
      actorEmail: bookedByEmail,
    });

    revalidateTag("bookings", "max");

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;
  try {
    const { id } = await params;
    const existingBooking = await getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    const { bookedByEmail } = bookingActorFromSessionUser(authResult.session.user);
    const isAdmin = sessionUserHasRole(authResult.session.user, "role_admin");

    const actorEmail = bookedByEmail.trim().toLowerCase();
    const ownerEmail = (existingBooking.bookedByEmail ?? "").trim().toLowerCase();
    const isOwner = Boolean(actorEmail) && Boolean(ownerEmail) && ownerEmail === actorEmail;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const scope = request.nextUrl.searchParams.get("scope");

    if (scope === "series" && existingBooking.seriesId) {
      const removed = await removeBookingSeries(existingBooking.seriesId);
      notifyBookingEvent({
        event: "deleted",
        booking: existingBooking,
        actorEmail: bookedByEmail,
      });
      revalidateTag("bookings", "max");
      return NextResponse.json({ success: true, removed });
    }

    const success = await removeBooking(id);

    if (!success) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    notifyBookingEvent({
      event: "deleted",
      booking: existingBooking,
      actorEmail: bookedByEmail,
    });

    revalidateTag("bookings", "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { message: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
