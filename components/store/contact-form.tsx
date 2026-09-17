"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/lib/actions/contact";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await submitContact(form);
      if (res.ok) {
        setForm({ name: "", email: "", message: "" });
        setMsg({ ok: true, text: "Thanks — we'll be in touch." });
      } else {
        setMsg({ ok: false, text: res.error ?? "Error" });
      }
    });
  }

  const input =
    "w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Message</label>
        <textarea rows={5} className={input} value={form.message} onChange={(e) => set("message", e.target.value)} />
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
      <button
        onClick={submit}
        disabled={pending}
        className="inline-flex h-11 items-center rounded-pill bg-primary px-8 font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}
