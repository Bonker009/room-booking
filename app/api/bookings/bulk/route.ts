import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { createRangeBookings } from "@/lib/db";
import {
  requireApiSession,
  bookingActorFromSessionUser,
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
        attendees: body.attendees,
        status: body.status,
      },
      body.startDate,
      body.endDate,
    );

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

    const status = result.conflicts.length > 0 ? 207 : 201;
    return NextResponse.json(
      {
        message:
          result.conflicts.length > 0
            ? `Created ${result.created.length} booking(s); ${result.conflicts.length} day(s) had conflicts`
            : `Created ${result.created.length} booking(s)`,
        ...result,
      },
      { status },
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
