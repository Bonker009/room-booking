import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { createRangeBookings } from "@/lib/db";
import {
  resolveBookingStatus,
  validateRangeOrResponse,
  validateSlotOrResponse,
} from "@/lib/booking-api-helpers";
import { notifyBookingEvent } from "@/lib/notifications";
import {
  requireApiSession,
  bookingActorFromSessionUser,
  sessionUserHasRole,
} from "@/lib/require-session";

export async function POST(request: Request) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;

  const { bookedBy, bookedByEmail } = bookingActorFromSessionUser(
    authResult.session.user,
  );

  try {
    const body = await request.json();
    const requiredFields = [
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "groupName",
      "className",
      "purpose",
    ] as const;

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const isAdmin = sessionUserHasRole(authResult.session.user, "role_admin");
    const rangeCheck = validateRangeOrResponse(
      body.startDate,
      body.endDate,
      isAdmin,
    );
    if (!rangeCheck.ok) {
      return NextResponse.json({ message: rangeCheck.message }, { status: 400 });
    }

    const slotCheck = validateSlotOrResponse(
      {
        date: body.startDate,
        startTime: body.startTime,
        endTime: body.endTime,
      },
      isAdmin,
    );
    if (!slotCheck.ok) {
      return NextResponse.json({ message: slotCheck.message }, { status: 400 });
    }

    const status = resolveBookingStatus(body.className, body.status);

    const result = await createRangeBookings(
      {
        startTime: body.startTime,
        endTime: body.endTime,
        groupName: body.groupName,
        className: body.className,
        bookedBy,
        bookedByEmail,
        purpose: body.purpose,
        description: body.description,
        status,
      },
      body.startDate,
      body.endDate,
    );

    for (const booking of result.created) {
      notifyBookingEvent({
        event: status === "pending" ? "pending" : "created",
        booking,
        actorEmail: bookedByEmail,
      });
    }

    if (result.created.length === 0) {
      return NextResponse.json(
        {
          message: "No bookings created — all days had conflicts",
          ...result,
        },
        { status: 409 },
      );
    }

    revalidateTag("bookings", "max");

    const httpStatus = result.conflicts.length > 0 ? 207 : 201;
    return NextResponse.json(
      {
        message:
          result.conflicts.length > 0
            ? `Created ${result.created.length} booking(s); ${result.conflicts.length} day(s) had conflicts`
            : `Created ${result.created.length} booking(s)`,
        ...result,
      },
      { status: httpStatus },
    );
  } catch (error) {
    console.error("Error creating range bookings:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create range bookings",
      },
      { status: 500 },
    );
  }
}
