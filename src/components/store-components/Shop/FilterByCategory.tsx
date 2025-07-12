import { type CategoryTree } from "@/schemas/categorySchema";
import { api } from "@/trpc/react";
import { CaretDown, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

const CategoryItem = ({
  category,
  handleCategory,
  selectedCategoryId,
}: {
  category: CategoryTree;
  handleCategory: (id: string, name: string) => void;
  selectedCategoryId?: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const hasChildren =
    category.subcategories && category.subcategories.length > 0;

  // Determine if this category is active
  const isActive = selectedCategoryId === category.id;

  return (
    <div className="category-item mb-1">
      <div
        onClick={() => handleCategory(category.id, category.name)}
        className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-colors ${
          isActive
            ? "bg-white text-brand-primary"
            : "text-gray-700 hover:bg-white"
        }`}
      >
        <span
          className={`flex items-center font-medium transition-colors ${
            isActive
              ? "text-brand-primary"
              : "bg-white text-gray-700 group-hover:text-brand-primary"
          }`}
        >
          {category.name}
        </span>

        {hasChildren && (
          <button
            onClick={toggleExpand}
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary hover:text-white"
          >
            {expanded ? (
              <CaretDown size={16} weight="bold" />
            ) : (
              <CaretRight size={16} weight="bold" />
            )}
          </button>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="ml-2 mt-1 space-y-1 border-l border-brand-primary pl-4">
          {category.subcategories.map((child) => (
            <CategoryItem
              handleCategory={handleCategory}
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FilterByCategory({
  handleCategory,
  selectedCategoryId,
}: {
  handleCategory: (id: string, name: string) => void;
  selectedCategoryId?: string;
}) {
  const [categories] = api.category.getAll.useSuspenseQuery();
  return (
    <div className="space-y-1 rounded-lg">
      {categories.map((category) => (
        <CategoryItem
          handleCategory={handleCategory}
          key={category.id}
          category={category}
          selectedCategoryId={selectedCategoryId}
        />
      ))}
    </div>
  );
}
