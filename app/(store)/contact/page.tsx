import type { Metadata } from "next";
import { ContactForm } from "@/components/store/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Shoe Express team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-28 sm:px-8">
      <h1 className="font-display text-4xl font-bold">Contact us</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        Questions about an order, sizing, or returns? Send us a message and we&apos;ll
        get back to you.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
