import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

/** Authenticated top bar with sign-out. Rendered only after the user is verified. */
export function DashboardNav({ email }: { email: string | null }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-12 w-full max-w-4xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-sm font-semibold">
          OpsPilot AI
        </Link>
        <div className="flex items-center gap-3">
          {email ? (
            <span className="text-xs text-muted-foreground">{email}</span>
          ) : null}
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
