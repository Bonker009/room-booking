"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import type { Booking } from "@/lib/booking-types";
import type { AdminBookingStats } from "@/lib/db";
import { getRoomBadgeColor } from "@/lib/rooms";
import { sessionUserHasRole } from "@/lib/session-roles";

export default function AdminPage() {
  const { data: session, isPending } = authClient.useSession();
  const isAdmin = sessionUserHasRole(session?.user, "role_admin");

  const [stats, setStats] = useState<AdminBookingStats | null>(null);
  const [pending, setPending] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/pending"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(data.bookings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && isAdmin) void load();
  }, [isPending, isAdmin, load]);

  const approve = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}/approve`, { method: "POST" });
    if (res.ok) {
      toast.success("Booking approved");
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Could not approve");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          You need the Keycloak role <code>role_admin</code> to view this page.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      <header className="border-b border-border bg-card/95 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin</h1>
            <p className="text-sm text-muted-foreground">
              Utilization stats and booking approvals
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total bookings" value={stats.totalBookings} icon={BarChart3} />
            <StatCard title="Today" value={stats.todayCount} icon={Clock} />
            <StatCard title="Upcoming" value={stats.upcomingCount} icon={Clock} />
            <StatCard title="Pending approval" value={stats.pendingCount} icon={CheckCircle2} />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Room utilization</CardTitle>
              <CardDescription>Booking count per room (all time in DB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.roomUtilization.map((row) => (
                <div key={row.room} className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={getRoomBadgeColor(row.room)}>
                    {row.room}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak hours</CardTitle>
              <CardDescription>Most common booking start times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.peakHours.map((row) => (
                <div key={row.hour} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{row.hour}</span>
                  <span className="font-medium tabular-nums">{row.count} bookings</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>
              Bookings awaiting admin confirmation (e.g. Seminar room)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending bookings.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pending.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{b.groupName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(`${b.date}T12:00:00`), "PPP")} · {b.startTime}–
                        {b.endTime} ·{" "}
                        <Badge variant="outline" className={getRoomBadgeColor(b.className)}>
                          {b.className}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.bookedBy} ({b.bookedByEmail})
                      </p>
                    </div>
                    <Button size="sm" onClick={() => void approve(b.id)}>
                      Approve
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
