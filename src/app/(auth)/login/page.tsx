import { Suspense } from "react";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · OpsPilot AI" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            OpsPilot AI demo for the fictional GrowthFlow Media.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* searchParams is request-time data, so it streams behind Suspense. */}
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <LoginFormWithNext searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function LoginFormWithNext({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const raw = Array.isArray(next) ? next[0] : next;
  return <LoginForm next={safeRedirectPath(raw)} />;
}
