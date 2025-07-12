"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryAccordion } from "./CategoryAccordion";

export default function CategoryAccordionManager() {
  const { data: categories, error, isLoading } = api.category.getAll.useQuery();
  // Track reordering state to prevent duplicate toasts
  const [isReordering, setIsReordering] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!categories || categories.length === 0)
    return <div>No categories found</div>;

  const utils = api.useUtils();
  const deleteCategory = api.category.delete.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate();
      toast.success("Category deleted successfully");
    },
    onError: (error: { message: string }) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const reorderCategories = api.category.reorder.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate();
      // Only show toast if not already reordering
      if (!isReordering) {
        toast.success("Category order updated successfully");
      }
      setIsReordering(false);
    },
    onError: (error: { message: string }) => {
      toast.error(`Error: ${error.message}`);
      setIsReordering(false);
    },
  });

  const handleDelete = (id: string) => {
    deleteCategory.mutate({ id });
  };

  const handleReorder = (
    items: { id: string; order: number }[],
    parentId: string | null,
  ) => {
    if (isReordering) return;

    setIsReordering(true);
    reorderCategories.mutate({ items, parentId });
  };

  return (
    <div className="w-full space-y-4 lg:w-5/12">
      <h2 className="text-xl font-bold">Categories</h2>
      <p className="text-sm text-gray-500">Drag categories to reorder them</p>
      <CategoryAccordion
        categories={categories.map((cat) => ({
          ...cat,
          description: cat.description ?? null,
        }))}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />
    </div>
  );
}
