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
  requireApiSession,
  bookingActorFromSessionUser,
} from "@/lib/require-session";

export async function GET(request: Request) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;
  try {
    const { searchParams } = new URL(request.url);
    const query = parseBookingsSearchParams(searchParams);

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

    if (body.recurring) {
      const pattern: RecurringPattern = body.recurring;

      if (!pattern.frequency || !pattern.interval || !pattern.endDate) {
        return NextResponse.json(
          { message: "Invalid recurring pattern" },
          { status: 400 },
        );
      }

      try {
        const bookings = await createRecurringBookings(body, pattern);
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
      attendees: body.attendees,
      status: body.status,
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
