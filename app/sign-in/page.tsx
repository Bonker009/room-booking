"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogIn } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackUrl") ?? "/";
  const [pending, setPending] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-muted/50 to-background px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Room Booking System
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Sign in with your Keycloak account (keycloak.kshrd.app) to manage room
          reservations.
        </p>
      </div>
      <Button
        size="lg"
        className="bg-gradient-to-r from-primary to-[#003d6b] text-primary-foreground hover:opacity-95"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void authClient.signIn.oauth2({
            providerId: "keycloak",
            callbackURL,
          });
        }}
      >
        <LogIn className="mr-2 h-4 w-4" />
        {pending ? "Redirecting…" : "Continue with Keycloak"}
      </Button>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
