import { NextResponse } from "next/server";

import { findConflictingBooking } from "@/lib/db";
import { ROOM_OPTIONS } from "@/lib/rooms";
import { requireApiSession } from "@/lib/require-session";

export interface RoomAvailabilityConflict {
  groupName: string;
  startTime: string;
  endTime: string;
}

export interface RoomAvailabilityItem {
  room: string;
  available: boolean;
  conflictingBookingId?: string;
  conflict?: RoomAvailabilityConflict;
}

export async function GET(request: Request) {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const excludeId = searchParams.get("excludeId") || undefined;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { message: "date, startTime, and endTime are required" },
        { status: 400 },
      );
    }

    const rooms: RoomAvailabilityItem[] = [];

    for (const room of ROOM_OPTIONS) {
      const conflict = await findConflictingBooking(
        { date, startTime, endTime, className: room },
        excludeId,
      );
      rooms.push({
        room,
        available: !conflict,
        conflictingBookingId: conflict?.id,
        conflict: conflict
          ? {
              groupName: conflict.groupName,
              startTime: conflict.startTime,
              endTime: conflict.endTime,
            }
          : undefined,
      });
    }

    return NextResponse.json({ date, startTime, endTime, rooms });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { message: "Failed to check availability" },
      { status: 500 },
    );
  }
}
