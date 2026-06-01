"use client";

import { format } from "date-fns";
import Image from "next/image";
import { Plus } from "lucide-react";

import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardTopBarProps {
  todayCount: number;
  onAddBooking: () => void;
}

export function DashboardTopBar({
  todayCount,
  onAddBooking,
}: DashboardTopBarProps) {
  const todayLabel = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/kshrd-logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
            priority
          />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-base font-semibold text-primary sm:text-lg">
              Room Booking System
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {todayLabel} · {todayCount} booking
              {todayCount !== 1 ? "s" : ""} today
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-[#003d6b] text-primary-foreground hover:opacity-95"
                onClick={onAddBooking}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Booking
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new room booking</TooltipContent>
          </Tooltip>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
