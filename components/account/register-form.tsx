"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser, loginWithCredentials } from "@/lib/auth/actions";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registerUser({ name, email, password });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // auto-login after successful registration
      await loginWithCredentials(email, password);
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Join Shoe Express — members get 20% off.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-control border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={pending}
          className="flex h-11 w-full items-center justify-center rounded-pill bg-primary font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
