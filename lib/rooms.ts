import type { TEventColor } from "@/calendar/types";

/** Canonical room list for forms, filters, and calendar. */
export const ROOM_OPTIONS = [
  "BTB",
  "SR",
  "PP",
  "KPS",
  "PVH",
  "Seminar",
  "Koh Kong",
] as const;

export type RoomName = (typeof ROOM_OPTIONS)[number];

/** Rooms that require admin approval before confirmation. */
export const APPROVAL_REQUIRED_ROOMS: readonly RoomName[] = ["Seminar"] as const;

export function roomRequiresApproval(room: string): boolean {
  return (APPROVAL_REQUIRED_ROOMS as readonly string[]).includes(room);
}

/** Calendar event color per room. */
export const ROOM_COLORS: Record<string, TEventColor> = {
  BTB: "purple",
  SR: "green",
  PP: "blue",
  KPS: "yellow",
  PVH: "red",
  Seminar: "orange",
  "Koh Kong": "gray",
};

/** Tailwind badge classes for table/details views. */
export const ROOM_BADGE_COLORS: Record<string, string> = {
  BTB: "bg-purple-100 text-purple-800",
  SR: "bg-emerald-100 text-emerald-800",
  PP: "bg-indigo-100 text-indigo-800",
  KPS: "bg-amber-100 text-amber-800",
  PVH: "bg-rose-100 text-rose-800",
  Seminar: "bg-cyan-100 text-cyan-800",
  "Koh Kong": "bg-red-100 text-red-800",
  "Director Room": "bg-slate-100 text-slate-800",
  "Deputy Director Room": "bg-orange-100 text-orange-800",
};

export function getRoomBadgeColor(className: string): string {
  return ROOM_BADGE_COLORS[className] ?? "bg-muted text-muted-foreground";
}
