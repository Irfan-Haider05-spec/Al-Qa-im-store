"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginWithCredentials } from "@/lib/auth/actions";
import { BRAND } from "@/lib/brand";

/**
 * Where to go after signing in. Only same-site paths are honoured: "//evil.com"
 * and "/\evil.com" are protocol-relative URLs to another site, and following
 * them would make the login page an open redirect.
 */
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export const authField =
  "w-full rounded-control border border-border bg-background px-3.5 py-2.5 text-sm transition-colors focus:border-foreground focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    setError(null);
    startTransition(async () => {
      const res = await loginWithCredentials(email, password);
      if (res.ok) {
        const next =
          params.get("from") === "admin" ? "/admin" : safeNext(params.get("next")) ?? "/account";
        router.push(next);
        router.refresh();
      } else {
        setError(res.error ?? "Login failed.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="eyebrow text-gold-ink">Welcome back</p>
      <h1 className="mt-3 font-display text-[2.1rem] font-medium leading-tight tracking-[-0.015em]">
        Log in
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your {BRAND.name} account.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={authField}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={authField}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-pill bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Forgot your password?{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
          Contact us
        </Link>{" "}
        and we&apos;ll help you back in.
      </p>

      <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={
            params.get("next")
              ? `/register?next=${encodeURIComponent(params.get("next")!)}`
              : "/register"
          }
          className="font-medium text-foreground underline underline-offset-4 hover:text-gold-ink"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export { safeNext };
