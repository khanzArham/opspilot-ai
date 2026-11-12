import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">OpsPilot AI</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Internal operations autopilot: durable workflows, a database-backed job
        queue, and human-approved AI diagnosis.
      </p>
      <p className="text-sm text-neutral-500">
        Portfolio project. GrowthFlow Media and all records are fictional.
      </p>
      <div>
        <Link
          href="/dashboard"
          className="inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
