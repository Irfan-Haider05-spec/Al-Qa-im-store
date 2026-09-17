import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-content items-center justify-center px-5 pb-20 pt-40 sm:px-8">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
