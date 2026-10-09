import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Receipt scan",
  description:
    "Extract multiple household items from one receipt and review them before saving.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReceiptScanPage() {
  redirect("/scan");
}