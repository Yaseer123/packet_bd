import RenderBlog from "@/components/admin-components/RenderBlog";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return (
    <div className="min-h-50 mx-auto w-full p-4 md:w-3/5 md:p-10">
      <RenderBlog id={id} />
    </div>
  );
}
