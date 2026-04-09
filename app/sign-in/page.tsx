"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

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
          void (async () => {
            setPending(true);
            try {
              const { data, error } = await authClient.signIn.oauth2({
                providerId: "keycloak",
                callbackURL,
                disableRedirect: true,
              });
              if (error) {
                toast.error("Could not start sign-in", {
                  description:
                    error.message ??
                    "Check server BETTER_AUTH_URL / NEXT_PUBLIC_BETTER_AUTH_URL match this site, and Keycloak valid redirect URIs.",
                });
                setPending(false);
                return;
              }
              const url = data?.url;
              if (url && typeof window !== "undefined") {
                window.location.assign(url);
                return;
              }
              toast.error("Could not start sign-in", {
                description:
                  "No redirect URL from server. Set BETTER_AUTH_URL (and NEXT_PUBLIC_BETTER_AUTH_URL) to your live site URL (e.g. https://your-domain.com).",
              });
            } catch (e) {
              toast.error("Could not start sign-in", {
                description:
                  e instanceof Error ? e.message : "Network or server error.",
              });
            }
            setPending(false);
          })();
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
