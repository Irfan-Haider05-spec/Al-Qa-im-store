import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { AddressManager } from "@/components/account/address-manager";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return <AddressManager addresses={addresses} />;
}
