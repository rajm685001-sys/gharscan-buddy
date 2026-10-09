import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Learn how GharScan Buddy handles household inventory, scanning, groceries, meal planning, family roles, privacy, and support.",
  alternates: {
    canonical: "/faq",
  },
};

const questions = [
  {
    question: "What is GharScan Buddy?",
    answer:
      "GharScan Buddy is a shared household workspace for tracking inventory, planning groceries, monitoring expiry dates, and organizing meals.",
  },
  {
    question: "Who is it for?",
    answer:
      "It is designed for families, roommates, and shared homes that want one place to coordinate household items and food planning.",
  },
  {
    question: "What can a Viewer do?",
    answer:
      "Viewers can read shared household information but cannot add, edit, delete, scan, or manage family roles.",
  },
  {
    question: "What can an Editor do?",
    answer:
      "Editors can add and update inventory, groceries, and meals, but cannot manage family membership or roles.",
  },
  {
    question: "What can an Owner do?",
    answer:
      "Owners have full household control, including inventory workflows and family-member role management.",
  },
  {
    question: "How does scanning work?",
    answer:
      "A product image is sent to the protected server-side scan route for structured extraction. You review the result before saving it to inventory.",
  },
  {
    question: "Are household records public?",
    answer:
      "No. Household data is protected with authenticated access and database row-level security.",
  },
  {
    question: "Can I request deletion of my data?",
    answer:
      "Use the Contact page to request account or household data help. The production contact workflow should verify the account before processing a request.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="button-link">
          GharScan Buddy
        </Link>

        <header className="mt-12 max-w-2xl">
          <p className="eyebrow">Help center</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground">
            Frequently asked questions
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Clear answers about household access, scanning, privacy, and daily
            use.
          </p>
        </header>

        <section className="mt-10 divide-y divide-border border-y border-border">
          {questions.map((item) => (
            <details key={item.question} className="py-6">
              <summary className="cursor-pointer list-none pr-8 text-lg font-bold text-foreground">
                {item.question}
              </summary>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </section>

        <footer className="mt-10 flex flex-wrap gap-5 text-sm font-bold">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground"
          >
            Privacy policy
          </Link>

          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground"
          >
            Contact
          </Link>

          <Link
            href="/signup"
            className="text-muted-foreground hover:text-foreground"
          >
            Create an account
          </Link>
        </footer>
      </div>
    </main>
  );
}