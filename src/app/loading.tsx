import { ScanLine } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-emerald-700 text-white">
          <ScanLine className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-xl font-black text-foreground">
          Loading your workspace
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Preparing your household information.
        </p>

        <div className="mx-auto mt-6 h-1.5 w-full overflow-hidden bg-muted">
          <div className="h-full w-2/3 animate-pulse bg-emerald-700" />
        </div>
      </div>
    </main>
  );
}