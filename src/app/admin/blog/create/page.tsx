import AddBlogForm from "@/components/admin-components/AddBlogForm";
import { auth } from "@/server/auth";

export default async function BlogPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-50 p-4 md:p-10">
      <AddBlogForm userId={session.user.id} />
    </div>
  );
}
