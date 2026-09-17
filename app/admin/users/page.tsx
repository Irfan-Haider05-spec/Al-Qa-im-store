import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export default async function AdminUsersPage() {
  await requirePermission("users.manage");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader title="Users" description={`${users.length} total · manage roles`} />
      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(
              (u: {
                id: string;
                name: string | null;
                email: string;
                role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EDITOR" | "CUSTOMER";
                createdAt: Date;
              }) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleSelect userId={u.id} role={u.role} />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
