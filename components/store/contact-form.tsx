"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/lib/actions/contact";

const field =
  "w-full rounded-control border border-border bg-background px-3.5 py-2.5 text-sm transition-colors focus:border-foreground focus:outline-none";

export function ContactForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    setMsg(null);
    startTransition(async () => {
      const res = await submitContact({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        message: String(data.get("message") ?? ""),
        website: String(data.get("website") ?? ""),
      });
      if (res.ok) {
        formEl.reset();
        setMsg({ ok: true, text: "Thank you — we'll reply within one working day." });
      } else {
        setMsg({ ok: false, text: res.error ?? "Something went wrong. Please try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4" noValidate>
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">
          Name
        </label>
        <input id="contact-name" name="name" autoComplete="name" required maxLength={100} className={field} />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={field}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={5000}
          className={field}
        />
      </div>

      {/* Honeypot: invisible to people, irresistible to form-filling bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center rounded-pill bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
