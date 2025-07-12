"use client";

import CategoryAttributesManager from "@/components/admin-components/CategoryAttributesManager";
import { useParams, useRouter } from "next/navigation";

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  if (!params?.id) {
    return router.push("/admin/category");
  }

  return (
    <div className="min-h-[80vh] p-10">
      <CategoryAttributesManager categoryId={params.id} />
    </div>
  );
}
