import { NextResponse } from "next/server";

import { getKioskRoomStatuses } from "@/lib/db";

export async function GET() {
  try {
    const payload = await getKioskRoomStatuses();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Kiosk status error:", error);
    return NextResponse.json(
      { message: "Failed to load room status" },
      { status: 500 },
    );
  }
}
