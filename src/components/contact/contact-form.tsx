"use client";

import { useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "block text-sm font-bold text-foreground";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.error ?? "Unable to send your message. Please try again.",
        );
        setState("error");
        return;
      }

      setName("");
      setEmail("");
      setMessage("");
      setState("success");
    } catch {
      setErrorMessage("Unable to send your message. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Message received
        </h2>

        <p className="text-sm leading-7 text-muted-foreground">
          Thank you. Your message has been received. If it relates to an
          account or household data request, the team may need to verify your
          identity before taking action.
        </p>

        <button
          type="button"
          onClick={() => setState("idle")}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="contact-name" className={labelClassName}>
          Your name
        </label>

        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClassName}
          placeholder="Enter your name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="contact-email" className={labelClassName}>
          Email address
        </label>

        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="contact-message" className={labelClassName}>
          Message
        </label>

        <textarea
          id="contact-message"
          name="message"
          required
          rows={7}
          minLength={10}
          maxLength={3000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${inputClassName} min-h-[180px] resize-y`}
          placeholder="Describe your support request or question"
        />

        <p className="text-right text-xs font-medium text-muted-foreground">
          {message.length}/3,000 characters
        </p>
      </div>

      {state === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}