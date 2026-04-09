import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getBookingById,
  updateBooking,
  removeBooking,
  checkBookingConflicts,
} from "@/lib/db";
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

    const hasConflict = await checkBookingConflicts(
      {
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        className: body.className,
      },
      id
    );

    if (hasConflict) {
      return NextResponse.json(
        { message: "This room is already booked during this time" },
        { status: 409 }
      );
    }

    const updatedBooking = await updateBooking(id, {
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      groupName: body.groupName,
      className: body.className,
      bookedBy,
      bookedByEmail,
      purpose: body.purpose,
      description: body.description,
      attendees: body.attendees,
      status: body.status,
    });

    // Revalidate bookings cache
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

    const success = await removeBooking(id);

    if (!success) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

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
