"use client";

import { useState, useTransition } from "react";
import { updateProfile, changePassword } from "@/lib/account/actions";

export function ProfileForm({
  initialName,
  email,
  hasPassword = true,
}: {
  initialName: string;
  email: string;
  /** False for accounts created through Google, which have no password yet. */
  hasPassword?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [pending, startTransition] = useTransition();

  function saveName() {
    setNameMsg(null);
    startTransition(async () => {
      const res = await updateProfile({ name });
      setNameMsg(res.ok ? "Saved." : res.error ?? "Error");
    });
  }

  function savePassword() {
    setPwMsg(null);
    startTransition(async () => {
      const res = await changePassword({ current, next });
      if (res.ok) {
        setCurrent("");
        setNext("");
        setPwMsg({ ok: true, text: "Password updated." });
      } else {
        setPwMsg({ ok: false, text: res.error ?? "Error" });
      }
    });
  }

  return (
    <div className="max-w-md space-y-10">
      <section>
        <h2 className="font-display text-xl font-semibold">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              value={email}
              disabled
              className="w-full rounded-control border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          {nameMsg && <p className="text-sm text-success">{nameMsg}</p>}
          <button
            onClick={saveName}
            disabled={pending}
            className="inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">
          {hasPassword ? "Password" : "Set a password"}
        </h2>
        {!hasPassword && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            You signed in with Google. Setting a password here lets you sign in with
            your email as well — Google keeps working either way.
          </p>
        )}
        <div className="mt-4 space-y-4">
          {hasPassword && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Current password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-success" : "text-danger"}`}>
              {pwMsg.text}
            </p>
          )}
          <button
            onClick={savePassword}
            disabled={pending}
            className="inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            {hasPassword ? "Update password" : "Set password"}
          </button>
        </div>
      </section>
    </div>
  );
}
