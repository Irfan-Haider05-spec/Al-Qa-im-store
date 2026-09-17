import type { Metadata } from "next";
import { RegisterForm } from "@/components/account/register-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-content items-center justify-center px-5 pb-20 pt-40 sm:px-8">
      <RegisterForm />
    </div>
  );
}
