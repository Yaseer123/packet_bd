import EditBlogForm from "@/components/admin-components/EditBlogForm";
import { auth } from "@/server/auth";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  const session = await auth();

  if (!session) {
    return null;
  }
  return (
    <div className="min-h-50 p-4 md:p-10">
      <EditBlogForm blogId={id} userId={session.user.id} />
    </div>
  );
}
