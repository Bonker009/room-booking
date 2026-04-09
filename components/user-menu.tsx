"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <span className="text-muted-foreground text-sm tabular-nums">…</span>
    );
  }

  if (!session?.user) {
    return null;
  }

  const label =
    session.user.name?.trim() ||
    session.user.email?.trim() ||
    "Signed in";

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:inline"
        title={label}
      >
        <User className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
        {label}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-primary/20 text-primary hover:bg-muted"
        onClick={() => {
          void (async () => {
            await authClient.signOut();
            window.location.href = "/sign-in";
          })();
        }}
      >
        <LogOut className="mr-1 h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
}
