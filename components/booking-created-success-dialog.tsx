"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BOOKING_CREATED_REMINDER,
  type BookingCreateSuccess,
} from "@/lib/booking-messages";
import { cn } from "@/lib/utils";

const AUTO_CLOSE_MS = 8000;
const AUTO_CLOSE_SECONDS = AUTO_CLOSE_MS / 1000;

interface BookingCreatedSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success: BookingCreateSuccess | null;
}

const variantConfig: Record<
  BookingCreateSuccess["variant"],
  {
    icon: typeof CheckCircle2;
    ring: string;
    iconBg: string;
    iconColor: string;
    accent: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    ring: "ring-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    accent: "border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30",
  },
  warning: {
    icon: AlertTriangle,
    ring: "ring-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    accent: "border-l-amber-500 bg-amber-50/80 dark:bg-amber-950/30",
  },
  pending: {
    icon: Clock,
    ring: "ring-primary/20",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    accent: "border-l-primary bg-primary/5",
  },
};

export function BookingCreatedSuccessDialog({
  open,
  onOpenChange,
  success,
}: BookingCreatedSuccessDialogProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open || !success) return;

    setSecondsLeft(AUTO_CLOSE_SECONDS);
    setProgress(100);

    const closeTimer = window.setTimeout(() => {
      onOpenChange(false);
    }, AUTO_CLOSE_MS);

    const tickStart = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - tickStart;
      const remaining = Math.max(0, AUTO_CLOSE_MS - elapsed);
      setProgress((remaining / AUTO_CLOSE_MS) * 100);
      setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
    }, 50);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearInterval(progressTimer);
    };
  }, [open, success, onOpenChange]);

  if (!success) return null;

  const config = variantConfig[success.variant];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden border-0 p-0 shadow-xl sm:max-w-[400px]"
      >
        <div className="px-6 pt-8 pb-5 text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-4",
              config.ring,
              config.iconBg,
            )}
          >
            <Icon className={cn("h-8 w-8", config.iconColor)} strokeWidth={2} />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {success.title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
            {success.summary}
          </DialogDescription>
        </div>

        <div className="px-6 pb-6">
          <div
            className={cn(
              "rounded-r-lg border-l-4 px-4 py-3.5 text-left",
              config.accent,
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-background/80 p-1.5 shadow-sm">
                <Lightbulb className="h-4 w-4 text-amber-500" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                  Before you leave the room
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {BOOKING_CREATED_REMINDER}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-primary to-[#003d6b] text-primary-foreground hover:opacity-95"
            onClick={() => onOpenChange(false)}
          >
            Got it
            <span className="ml-1.5 text-primary-foreground/75 tabular-nums">
              ({secondsLeft}s)
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
