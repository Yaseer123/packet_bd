"use client";

import { uploadFile } from "@/app/actions/file";
import {
  newCategorySchema,
  type CategoryTree,
  type NewCategory,
} from "@/schemas/categorySchema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm, type UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function AddCategoryForm() {
  const selectedCategoriesRef = useRef<(string | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: "",
      parentId: null,
      image: undefined,
      description: "",
    },
  });

  const [categories] = api.category.getAll.useSuspenseQuery();

  const utils = api.useUtils();
  const addCategory = api.category.add.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate();
      toast.success("Category added successfully");
      reset();
      selectedCategoriesRef.current = [];
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to add category");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: NewCategory) => {
    setIsSubmitting(true);
    setImagePreview(null); // Reset image preview

    const formData = new FormData();
    if (data.image) {
      const imageData = new FormData();
      imageData.append("file", data.image);

      const imageUploadResponse = await uploadFile(imageData);
      if (imageUploadResponse) {
        formData.append("imageUrl", imageUploadResponse.secure_url);
        formData.append("imageId", imageUploadResponse.public_id);
      }
    }

    addCategory.mutate({
      name: data.name,
      parentId: data.parentId,
      imageId: formData.get("imageId") as string | undefined,
      imageUrl: formData.get("imageUrl") as string | undefined,
      description: data.description ?? undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-4 rounded-lg shadow-sm"
    >
      <h2 className="text-xl font-bold">Add New Category</h2>

      {/* Category Name */}
      <div>
        <label className="text-sm font-medium">Category Name</label>
        <Input {...register("name")} placeholder="Enter category name" />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Select Image */}
      <div>
        <label className="text-sm font-medium">Select Image</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setValue("image", file); // Manually set the file in the form state
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) {
                  setImagePreview(event.target.result as string);
                }
              };
              reader.readAsDataURL(file);
            }
          }}
          placeholder="Select category image"
        />
        <div className="mt-1 text-xs text-gray-400">
          Recommended size: 220x220px or larger, square image
        </div>
        {imagePreview && (
          <div className="mt-2">
            <Image
              height={128}
              width={128}
              src={imagePreview}
              alt="Preview"
              className="h-full w-full rounded-md object-cover"
            />
          </div>
        )}
        {errors.image && (
          <p className="text-sm text-red-500">{errors.image.message}</p>
        )}
      </div>

      {/* Parent Category */}
      <div>
        <label className="text-sm font-medium">Select parent category</label>
        <CategorySelector
          setValue={setValue}
          categories={categories}
          placeholder="Select Category"
          selectedCategoriesRef={selectedCategoriesRef}
          onCategoryChange={(level) => {
            selectedCategoriesRef.current = selectedCategoriesRef.current.slice(
              0,
              level + 1,
            );
          }}
        />
        {errors.parentId && (
          <p className="text-sm text-red-500">{errors.parentId.message}</p>
        )}
      </div>

      {/* Description (optional) */}
      <div>
        <label className="text-sm font-medium">Description (optional)</label>
        <textarea
          {...register("description")}
          placeholder="Enter category description (for SEO, shown at bottom of category page)"
          className="min-h-[80px] w-full rounded border border-gray-300 p-2"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding..." : "Add Category"}
      </Button>
    </form>
  );
}

function CategorySelector({
  setValue,
  categories,
  placeholder,
  depth = 0, // Tracks category level
  selectedCategoriesRef, // Ref to store the category selection path
  onCategoryChange, // Function to reset child selection
}: {
  setValue: UseFormSetValue<NewCategory>;
  categories: CategoryTree[];
  placeholder: string;
  depth?: number;
  selectedCategoriesRef: React.MutableRefObject<(string | null)[]>;
  onCategoryChange?: (level: number) => void;
}) {
  const [subCategories, setSubCategories] = useState<CategoryTree[]>([]);

  return (
    <>
      <Select
        onValueChange={(value) => {
          setValue("parentId", value);

          // Find selected category
          const category = categories.find((cat) => cat.id === value);
          setSubCategories(category?.subcategories ?? []);

          // Update ref with selected category at current depth
          selectedCategoriesRef.current[depth] = value;

          // Reset all selections beyond this level
          if (onCategoryChange) onCategoryChange(depth);
        }}
        value={selectedCategoriesRef.current[depth] ?? ""}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Render child selector if subcategories exist */}
      {subCategories.length > 0 && selectedCategoriesRef.current[depth] && (
        <div className="my-4">
          <CategorySelector
            placeholder="Select subcategory"
            setValue={setValue}
            categories={subCategories}
            depth={depth + 1}
            selectedCategoriesRef={selectedCategoriesRef}
            onCategoryChange={(level) => {
              // Reset all selections below this level
              selectedCategoriesRef.current =
                selectedCategoriesRef.current.slice(0, level + 1);
            }}
          />
        </div>
      )}
    </>
  );
}
