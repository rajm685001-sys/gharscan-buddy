import type { Metadata } from "next";

import { ReceiptScanWorkspace } from "@/components/receipt-scan/receipt-scan-workspace";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Receipt scan",
  description:
    "Extract multiple household items from one receipt and review them before saving.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReceiptScanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-black text-foreground">
            Please sign in
          </h1>

          <p className="mt-3 text-muted-foreground">
            Sign in to scan receipts and add household items to your family
            inventory.
          </p>
        </main>
      </div>
    );
  }

  return <ReceiptScanWorkspace userId={user.id} />;
}