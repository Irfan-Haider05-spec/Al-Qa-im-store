"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { deleteMessage, setMessageRead } from "@/lib/admin/message-actions";
import { cn } from "@/lib/utils/cn";

export function MessageRow({
  message,
  storeName,
}: {
  message: {
    id: string;
    name: string;
    email: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  };
  storeName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const reply = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    `Re: your message to ${storeName}`
  )}`;

  return (
    <article
      className={cn(
        "rounded-card border bg-background p-5 transition-opacity",
        message.isRead ? "border-border" : "border-gold/60 shadow-card",
        pending && "opacity-60"
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            {!message.isRead && (
              <span className="h-2 w-2 rounded-full bg-gold" aria-label="Unread" />
            )}
            {message.name}
          </p>
          <p className="truncate text-sm text-muted-foreground">{message.email}</p>
        </div>
        <time
          dateTime={message.createdAt.toISOString()}
          className="text-xs text-muted-foreground"
        >
          {message.createdAt.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </header>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{message.message}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={reply}
          onClick={() => !message.isRead && run(() => setMessageRead(message.id, true))}
          className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary-deep"
        >
          <Reply className="h-3.5 w-3.5" aria-hidden />
          Reply by email
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setMessageRead(message.id, !message.isRead))}
          className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border px-4 text-xs font-medium hover:bg-muted"
        >
          {message.isRead ? (
            <Mail className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <MailOpen className="h-3.5 w-3.5" aria-hidden />
          )}
          {message.isRead ? "Mark unread" : "Mark read"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Delete this message? This cannot be undone.")) {
              run(() => deleteMessage(message.id));
            }
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border px-4 text-xs font-medium text-danger hover:bg-danger/5"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </button>
      </div>
    </article>
  );
}
