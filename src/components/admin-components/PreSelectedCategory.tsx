"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CategoryTree } from "@/schemas/categorySchema";
import { api } from "@/trpc/react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

export default function PreSelectedCategory({
  targetCategory,
  setCategoryId,
}: {
  targetCategory: string;
  setCategoryId: Dispatch<SetStateAction<string>>;
}) {
  const [categories] = api.category.getAll.useSuspenseQuery();
  const [initialPath, setInitialPath] = useState<string[]>([]);
  const selectedCategoriesRef = useRef<(string | null)[]>([]);

  // Fetch parent path of the target category
  useEffect(() => {
    const findPath = (
      categories: CategoryTree[],
      target: string,
      path: string[] = [],
    ): string[] | null => {
      for (const category of categories) {
        const currentPath = [...path, category.id];

        if (category.id === target) {
          return currentPath; // Found the target category
        }

        if (category.subcategories.length > 0) {
          const subPath = findPath(category.subcategories, target, currentPath);
          if (subPath) return subPath;
        }
      }
      return null;
    };

    const path = findPath(categories, targetCategory);
    if (path) {
      setInitialPath(path);
      selectedCategoriesRef.current = path;
      setCategoryId(path[path.length - 1]!); // Set the last selected category
    }
  }, [categories, setCategoryId, targetCategory]);

  return (
    <CategorySelector
      setCategoryId={setCategoryId}
      categories={categories}
      placeholder="Select Category"
      selectedCategoriesRef={selectedCategoriesRef}
      initialPath={initialPath}
      onCategoryChange={(level) => {
        selectedCategoriesRef.current = selectedCategoriesRef.current.slice(
          0,
          level + 1,
        );
      }}
    />
  );
}

function CategorySelector({
  setCategoryId,
  categories,
  placeholder,
  depth = 0,
  selectedCategoriesRef,
  initialPath,
  onCategoryChange,
}: {
  setCategoryId: Dispatch<SetStateAction<string>>;
  categories: CategoryTree[];
  placeholder: string;
  depth?: number;
  selectedCategoriesRef: React.MutableRefObject<(string | null)[]>;
  initialPath: string[];
  onCategoryChange?: (level: number) => void;
}) {
  const [subCategories, setSubCategories] = useState<CategoryTree[]>([]);

  useEffect(() => {
    const preselectedId = initialPath[depth];
    if (preselectedId) {
      const category = categories.find((cat) => cat.id === preselectedId);
      setSubCategories(category?.subcategories ?? []);
    }
  }, [initialPath, depth, categories]);

  return (
    <>
      <Select
        onValueChange={(value) => {
          setCategoryId(value);

          const category = categories.find((cat) => cat.id === value);
          setSubCategories(category?.subcategories ?? []);

          selectedCategoriesRef.current[depth] = value;
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

      {subCategories.length > 0 && selectedCategoriesRef.current[depth] && (
        <div className="my-4">
          <CategorySelector
            placeholder="Select subcategory"
            setCategoryId={setCategoryId}
            categories={subCategories}
            depth={depth + 1}
            selectedCategoriesRef={selectedCategoriesRef}
            initialPath={initialPath}
            onCategoryChange={(level) => {
              selectedCategoriesRef.current =
                selectedCategoriesRef.current.slice(0, level + 1);
            }}
          />
        </div>
      )}
    </>
  );
}
