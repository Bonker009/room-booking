import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getBookingById,
  updateBooking,
  removeBooking,
  checkBookingConflicts,
} from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const id = context.params.id;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const id = context.params.id;
    const body = await request.json();

    const requiredFields = [
      "date",
      "startTime",
      "endTime",
      "groupName",
      "className",
      "bookedBy",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const existingBooking = await getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
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

    const updatedBooking = await updateBooking(id, {
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      groupName: body.groupName,
      className: body.className,
      bookedBy: body.bookedBy,
    });

    // Revalidate bookings cache
    revalidateTag("bookings");

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const id = context.params.id;
    const success = await removeBooking(id);

    if (!success) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    // Revalidate bookings cache
    revalidateTag("bookings");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { message: "Failed to delete booking" },
      { status: 500 },
    );
  }
}
