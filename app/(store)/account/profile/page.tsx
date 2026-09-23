import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/account/profile-form";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, passwordHash: true },
  });
  return (
    <ProfileForm
      initialName={user?.name ?? ""}
      email={user?.email ?? ""}
      // Google accounts have no password yet: they get "set a password"
      // instead of "change password", with no current password to confirm.
      hasPassword={Boolean(user?.passwordHash)}
    />
  );
}
