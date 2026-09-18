import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings/site";
import { PageHeader } from "@/components/admin/ui";
import { MessageRow } from "@/components/admin/message-row";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Messages" };

/** Everything sent through the storefront contact form. */
export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requirePermission("messages.manage");
  const { filter } = await searchParams;

  const [messages, unread, settings] = await Promise.all([
    prisma.contactMessage.findMany({
      where: filter === "unread" ? { isRead: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    getSiteSettings(),
  ]);

  const tabs = [
    { key: "", label: "All" },
    { key: "unread", label: `Unread (${unread})` },
  ];

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Sent from the Contact page. Replies go from your own email client."
      />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/messages?filter=${t.key}` : "/admin/messages"}
            className={cn(
              "rounded-pill border px-3 py-1.5 text-sm",
              (filter ?? "") === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {messages.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
          {filter === "unread" ? "No unread messages." : "No messages yet."}
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {messages.map((m) => (
            <MessageRow key={m.id} message={m} storeName={settings.storeName} />
          ))}
        </div>
      )}
    </div>
  );
}
