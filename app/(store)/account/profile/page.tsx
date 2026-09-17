import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/account/profile-form";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true },
  });
  return (
    <ProfileForm
      initialName={user?.name ?? ""}
      email={user?.email ?? ""}
    />
  );
}
