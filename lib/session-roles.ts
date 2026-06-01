import type { Booking } from "@/lib/booking-types";

export function sessionUserHasRole(user: unknown, role: string): boolean {
  const want = String(role ?? "").trim().toLowerCase();
  if (!want) return false;

  const u = user as Record<string, unknown> | null | undefined;
  const roles: unknown[] = [];
  if (Array.isArray(u?.roles)) roles.push(...u.roles);
  if (typeof u?.role === "string") roles.push(u.role);
  if (Array.isArray((u?.realm_access as { roles?: unknown[] })?.roles)) {
    roles.push(...(u!.realm_access as { roles: unknown[] }).roles);
  }

  const resourceAccess = u?.resource_access;
  if (resourceAccess && typeof resourceAccess === "object") {
    for (const v of Object.values(resourceAccess)) {
      if (Array.isArray((v as { roles?: unknown[] })?.roles)) {
        roles.push(...(v as { roles: unknown[] }).roles);
      }
    }
  }

  return roles.some((r) => String(r ?? "").trim().toLowerCase() === want);
}

export function canManageBooking(
  booking: Booking,
  actorEmail: string,
  isAdmin: boolean,
): boolean {
  const ownerEmail = (booking.bookedByEmail ?? "").trim().toLowerCase();
  return (
    Boolean(isAdmin) ||
    (Boolean(actorEmail) && Boolean(ownerEmail) && ownerEmail === actorEmail)
  );
}
