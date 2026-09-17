"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/lib/admin/user-actions";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "CUSTOMER"];

export function UserRoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: Role;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        value={role}
        disabled={pending}
        onChange={(e) => {
          setError(null);
          const next = e.target.value as Role;
          startTransition(async () => {
            const res = await setUserRole({ userId, role: next });
            if (!res.ok) setError(res.error ?? "Error");
            router.refresh();
          });
        }}
        className="rounded-control border border-border px-2 py-1.5 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
