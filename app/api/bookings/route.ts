import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import {
  addBooking,
  checkBookingConflicts,
  getAllBookings,
  getBookings,
  createRecurringBookings,
  type RecurringPattern,
} from "@/lib/db";
import {
  hasBookingsQueryParams,
  parseBookingsSearchParams,
} from "@/lib/booking-query";
import {
  resolveBookingStatus,
  validateSlotOrResponse,
} from "@/lib/booking-api-helpers";
import { notifyBookingEvent } from "@/lib/notifications";
import {
  requireApiSession,
  bookingActorFromSessionUser,
  sessionUserHasRole,
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

    if (hasBookingsQueryParams(query)) {
      const { bookings, total } = await getBookings(query);
      const limit = query.limit ?? total;
      const page = query.page ?? 1;
      return NextResponse.json({
        bookings,
        total,
        page,
        limit,
        totalPages: query.limit ? Math.ceil(total / query.limit) : 1,
      });
    }

    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;
  const { bookedBy, bookedByEmail } = bookingActorFromSessionUser(
    authResult.session.user,
  );
  const isAdmin = sessionUserHasRole(authResult.session.user, "role_admin");
  try {
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
          { status: 400 },
        );
      }
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

    const status = resolveBookingStatus(body.className, body.status);

    if (body.recurring) {
      const pattern: RecurringPattern = body.recurring;

      if (!pattern.frequency || !pattern.interval || !pattern.endDate) {
        return NextResponse.json(
          { message: "Invalid recurring pattern" },
          { status: 400 },
        );
      }

      try {
        const bookings = await createRecurringBookings(
          { ...body, bookedBy, bookedByEmail, status },
          pattern,
        );
        for (const booking of bookings) {
          notifyBookingEvent({
            event: status === "pending" ? "pending" : "created",
            booking,
            actorEmail: bookedByEmail,
          });
        }
        return NextResponse.json(bookings, { status: 201 });
      } catch {
        return NextResponse.json(
          { message: "Failed to create recurring bookings" },
          { status: 500 },
        );
      }
    }

    const hasConflict = await checkBookingConflicts({
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      className: body.className,
    });

    if (hasConflict) {
      return NextResponse.json(
        { message: "This room is already booked during this time" },
        { status: 409 },
      );
    }

    const newBooking = await addBooking({
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      groupName: body.groupName,
      className: body.className,
      bookedBy,
      bookedByEmail,
      purpose: body.purpose,
      description: body.description,
      status,
    });

    notifyBookingEvent({
      event: status === "pending" ? "pending" : "created",
      booking: newBooking,
      actorEmail: bookedByEmail,
    });

    revalidateTag("bookings", "max");

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "Failed to create booking" },
      { status: 500 },
    );
  }
}
