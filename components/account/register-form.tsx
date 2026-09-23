"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerUser, loginWithCredentials } from "@/lib/auth/actions";
import { authField, safeNext } from "@/components/account/login-form";
import { GoogleButton } from "@/components/account/google-button";
import { BRAND } from "@/lib/brand";

export function RegisterForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    setError(null);
    startTransition(async () => {
      const res = await registerUser({ name, email, password });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Sign straight in; if that fails for any reason, the login page works.
      const signedIn = await loginWithCredentials(email, password);
      router.push(signedIn.ok ? safeNext(params.get("next")) ?? "/account" : "/login");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="eyebrow text-gold-ink">Join {BRAND.name}</p>
      <h1 className="mt-3 font-display text-[2.1rem] font-medium leading-tight tracking-[-0.015em]">
        Create account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track every order, save your addresses and keep a wishlist across devices.
      </p>

      {googleEnabled && (
        <div className="mt-7">
          <GoogleButton next={safeNext(params.get("next")) ?? "/account"} label="Sign up with Google" />
          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className={googleEnabled ? "space-y-4" : "mt-7 space-y-4"} noValidate>
        <div>
          <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="reg-name"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            className={authField}
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={authField}
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-describedby="reg-password-hint"
            className={authField}
          />
          <p id="reg-password-hint" className="mt-1.5 text-xs text-muted-foreground">
            At least 8 characters.
          </p>
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
          {pending ? "Creating…" : "Create account"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/legal/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-gold-ink"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
