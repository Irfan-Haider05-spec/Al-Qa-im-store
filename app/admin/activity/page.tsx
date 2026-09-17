import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminActivityPage() {
  await requirePermission("settings.write");
  const logs = await prisma.adminActivityLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Activity log" description="Last 100 admin actions" />
      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(
              (l: {
                id: string;
                action: string;
                entity: string;
                entityId: string | null;
                createdAt: Date;
                user: { name: string | null; email: string } | null;
              }) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {l.user?.name ?? l.user?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">{l.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.entity}
                    {l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No activity yet.
          </p>
        )}
      </div>
    </div>
  );
}
