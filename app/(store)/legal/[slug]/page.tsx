import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings/site";

/**
 * The four policy pages the footer links to.
 *
 * They share one route because they share one shape: a title, a last-reviewed
 * date and a list of sections. The copy below is a workable starting point
 * written against how this store actually behaves — it is not legal advice, and
 * the placeholders marked [REVIEW] need a lawyer's eyes before launch.
 */
type Section = { heading: string; body: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const DOCS: Record<string, Doc> = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains what we collect when you shop with us, why we collect it, and what you can ask us to do with it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you create an account we store your name, email address and a one-way hash of your password — we never hold the password itself and cannot recover it for you.",
          "When you place an order we store the delivery address, phone number and order contents, because we cannot ship or handle a return without them.",
          "We keep a cart for you, tied to your account when you are signed in and to an anonymous token in a cookie when you are not.",
        ],
      },
      {
        heading: "What we do not do",
        body: [
          "We do not sell your personal data.",
          "We do not store card numbers on our servers. Card payments, when enabled, are handled by the payment provider and we only ever see a reference to the transaction.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "We set a session cookie so you stay signed in, and a cart cookie so a guest basket survives a page reload. Both are strictly necessary and cannot be turned off without breaking checkout.",
          "Any analytics cookie is optional and off until you accept it. [REVIEW: confirm before enabling analytics in a jurisdiction that requires prior consent.]",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can see and edit most of what we hold from your account page. To request a copy of everything, or to have your account deleted, email us and we will respond within 30 days.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro:
      "These terms cover buying from this store. Placing an order means you accept them.",
    sections: [
      {
        heading: "Orders",
        body: [
          "An order is an offer to buy. The contract forms when we confirm the order, not when you submit it — if an item turns out to be unavailable we will tell you and refund in full.",
          "Prices shown include any applicable tax at the rate configured for your delivery country and are calculated on our servers at checkout. A price displayed in error does not bind us.",
        ],
      },
      {
        heading: "Delivery",
        body: [
          "We dispatch within one working day. Delivery estimates are estimates, not guarantees.",
          "Risk passes to you on delivery. If a parcel arrives damaged, tell us within 48 hours and keep the packaging.",
        ],
      },
      {
        heading: "Returns and refunds",
        body: [
          "You have 30 days from delivery to return an unworn item in its original packaging for a full refund. Try them on indoors — a sole that has been outside is no longer unworn.",
          "Refunds go back to the original payment method within 14 days of us receiving the return.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Nothing here limits liability for death or personal injury caused by negligence, or for fraud. Beyond that our liability is limited to the value of the order. [REVIEW: local consumer law may set a different floor.]",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Settings",
    intro:
      "We use as few cookies as we can get away with. Here is the full list.",
    sections: [
      {
        heading: "Strictly necessary",
        body: [
          "Session cookie — keeps you signed in between pages. Expires when the session ends.",
          "Cart cookie — lets a guest basket survive a reload. Expires after 30 days.",
          "These cannot be disabled while you are using the store, because sign-in and checkout depend on them.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "No analytics cookies are set unless an analytics ID has been configured for this store and you have accepted them. If none is configured, this section does not apply.",
        ],
      },
      {
        heading: "Managing cookies",
        body: [
          "Your browser can block or delete cookies for this site at any time. Blocking the strictly necessary ones will sign you out and empty your basket.",
        ],
      },
    ],
  },
  imprint: {
    title: "Imprint",
    intro: "Who runs this store and how to reach a human.",
    sections: [
      {
        heading: "Responsible for content",
        body: [
          "[REVIEW: insert the registered company name, legal form, registered office address, company registration number and VAT number. Several jurisdictions — Germany's §5 TMG among them — require these on a commercial site.]",
        ],
      },
      {
        heading: "Dispute resolution",
        body: [
          "We are willing to resolve complaints directly. If we cannot agree, consumers may be entitled to use an online dispute resolution platform in their jurisdiction.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) return { title: "Not found" };

  return {
    title: doc.title,
    description: doc.intro,
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();

  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{doc.title}</span>
      </nav>

      <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
        {doc.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{doc.intro}</p>

      <div className="mt-12 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold">{section.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-card border border-border bg-muted/50 p-6">
        <h2 className="font-display text-lg font-bold">Questions about this page?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {settings.contactEmail ? (
            <>
              Email{" "}
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-primary hover:underline"
              >
                {settings.contactEmail}
              </a>{" "}
              or use the contact form.
            </>
          ) : (
            "Use the contact form and we'll get back to you."
          )}
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
