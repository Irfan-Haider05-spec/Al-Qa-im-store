"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginWithCredentials } from "@/lib/auth/actions";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await loginWithCredentials(email, password);
      if (res.ok) {
        const from = params.get("from");
        router.push(from === "admin" ? "/admin/dashboard" : "/account");
        router.refresh();
      } else {
        setError(res.error ?? "Login failed.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back to Shoe Express.
      </p>

      <div className="mt-6 space-y-4">
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
        </div>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={pending}
          className="flex h-11 w-full items-center justify-center rounded-pill bg-primary font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Log in"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
