import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-24" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

/**
 * Defense in depth behind the request proxy: re-verify the user on the server
 * before rendering ANY dashboard content. Children live inside this gate, so
 * nothing streams to a logged-out visitor even if the proxy were bypassed.
 */
async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <DashboardNav email={user.email} />
      {children}
    </>
  );
}
