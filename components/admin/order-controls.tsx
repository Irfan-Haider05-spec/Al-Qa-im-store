"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatus,
  setTracking,
  setInternalNotes,
} from "@/lib/admin/order-actions";
import type { OrderStatus } from "@prisma/client";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function OrderControls({
  orderId,
  status,
  trackingNumber,
  internalNotes,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string;
  internalNotes: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [track, setTrack] = useState(trackingNumber);
  const [notes, setNotes] = useState(internalNotes);
  const [msg, setMsg] = useState<string | null>(null);

  const input =
    "w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

  function changeStatus(next: OrderStatus) {
    setMsg(null);
    startTransition(async () => {
      const res = await updateOrderStatus({ orderId, status: next });
      if (res.ok) {
        router.refresh();
      } else {
        setMsg(res.error ?? "Could not update status.");
      }
    });
  }

  return (
    <div className="space-y-6 rounded-card border border-border bg-background p-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value as OrderStatus)}
          disabled={pending}
          className={input}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Cancelling or refunding returns stock automatically.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tracking number</label>
        <div className="flex gap-2">
          <input
            className={input}
            value={track}
            onChange={(e) => setTrack(e.target.value)}
          />
          <button
            onClick={() =>
              startTransition(async () => {
                await setTracking({ orderId, trackingNumber: track });
                router.refresh();
              })
            }
            disabled={pending}
            className="inline-flex h-10 flex-none items-center rounded-pill bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Internal notes</label>
        <textarea
          rows={3}
          className={input}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          onClick={() =>
            startTransition(async () => {
              await setInternalNotes({ orderId, notes });
              router.refresh();
            })
          }
          disabled={pending}
          className="mt-2 inline-flex h-9 items-center rounded-pill border border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
        >
          Save notes
        </button>
      </div>

      {msg && <p className="text-sm text-danger">{msg}</p>}
    </div>
  );
}
