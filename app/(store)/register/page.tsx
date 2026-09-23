import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/account/register-form";
import { isGoogleEnabled } from "@/lib/auth/providers";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-content items-center justify-center px-5 pb-20 pt-40 sm:px-8">
      {/* The form reads ?next=, which needs a Suspense boundary to prerender. */}
      <Suspense>
        <RegisterForm googleEnabled={isGoogleEnabled()} />
      </Suspense>
    </div>
  );
}
