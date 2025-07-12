import { auth } from "@/server/auth";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) {
    return <div>Not authorized</div>;
  }

  if (session.user.role !== "ADMIN") {
    return <div>Not authorized</div>;
  }

  return <div>Admin&apos;s home page</div>;
}
