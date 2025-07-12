import { getUserById } from "@/utils/getUser";
import { notFound } from "next/navigation";
import MyAccountView from "./MyAccountView";

export default async function AdminUserAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO: Add admin authentication/authorization check
  const user = await getUserById(id);
  if (!user) return notFound();
  // Ensure name is a string
  return (
    <MyAccountView
      user={{
        ...user,
        name: user.name ?? "",
        email: String(user.email ?? ""),
        image: user.image ?? undefined,
      }}
    />
  );
}
