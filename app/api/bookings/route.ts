import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import {
  getAllBookings,
  addBooking,
  checkBookingConflicts,
  getBookings,
  createRecurringBookings,
  type BookingQuery,
  type RecurringPattern,
} from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const query: BookingQuery = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      className: searchParams.get("className") || undefined,
      groupName: searchParams.get("groupName") || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: (searchParams.get("sortBy") as "date" | "createdAt" | "className") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    }

    // Handle pagination
    const page = searchParams.get("page")
    const limit = searchParams.get("limit")
    if (page && limit) {
      query.page = Number.parseInt(page)
      query.limit = Number.parseInt(limit)
    }

    // Use filtered query if parameters exist, otherwise get all
    if (Object.values(query).some((val) => val !== undefined)) {
      const { bookings, total } = await getBookings(query)
      return NextResponse.json({
        bookings,
        total,
        page: query.page || 1,
        limit: query.limit || total,
        totalPages: query.limit ? Math.ceil(total / query.limit) : 1,
      })
    } else {
      const bookings = await getAllBookings()
      return NextResponse.json(bookings)
    }
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ message: "Failed to fetch bookings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields (including purpose)
    const requiredFields = ["date", "startTime", "endTime", "groupName", "className", "bookedBy", "purpose"]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `${field} is required` }, { status: 400 })
      }
    }

    // Handle recurring bookings
    if (body.recurring) {
      const pattern: RecurringPattern = body.recurring

      // Validate recurring pattern
      if (!pattern.frequency || !pattern.interval || !pattern.endDate) {
        return NextResponse.json({ message: "Invalid recurring pattern" }, { status: 400 })
      }

      try {
        const bookings = await createRecurringBookings(body, pattern)
        return NextResponse.json(bookings, { status: 201 })
      } catch (error) {
        return NextResponse.json({ message: "Failed to create recurring bookings" }, { status: 500 })
      }
    }

    // Check for booking conflicts
    const hasConflict = await checkBookingConflicts({
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      className: body.className,
    })

    if (hasConflict) {
      return NextResponse.json({ message: "This room is already booked during this time" }, { status: 409 })
    }

    // Create new booking (including purpose)
    const newBooking = await addBooking({
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      groupName: body.groupName,
      className: body.className,
      bookedBy: body.bookedBy,
      purpose: body.purpose,
      description: body.description,
      attendees: body.attendees,
      status: body.status,
    })

    // Revalidate bookings cache
    revalidateTag("bookings")

    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ message: "Failed to create booking" }, { status: 500 })
  }
}
