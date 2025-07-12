"use client";

import useCategoryPopup from "@/hooks/useCategoryPopup";
import type { CategoryTree } from "@/schemas/categorySchema";
import { api } from "@/trpc/react";
import { CaretDown, CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";

const CategoryDropdown = () => {
  const [categories, { error }] = api.category.getAll.useSuspenseQuery();
  const { openCategoryPopup, handleCategoryPopup } = useCategoryPopup();
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  if (error) return <div>Error: {error.message}</div>;

  // Utility function to convert string to title case
  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
    );
  };

  const handleCategoryHover = (categoryId: string, level: number) => {
    setActiveCategories((prev) => {
      const newActive = [...prev];
      newActive[level] = categoryId;
      return newActive.slice(0, level + 1);
    });
  };

  const renderSubcategories = (subcategories: CategoryTree[], level = 1) => {
    return (
      <div
        id={`dropdown-level-${level}`}
        className="absolute left-full top-0 z-10 w-max divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-lg"
        style={{ zIndex: 10 + level }} // Ensure higher levels appear above lower levels
      >
        <ul className="py-2 text-sm text-gray-800">
          {subcategories.map((sub) => (
            <li key={sub.id}>
              {sub.subcategories?.length > 0 ? (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-nowrap px-5 py-2.5 text-sm font-medium hover:bg-gray-200"
                    onMouseEnter={() => handleCategoryHover(sub.id, level)}
                  >
                    <Link href={`/products?category=${sub.id}`}>
                      {toTitleCase(sub.name)}
                    </Link>
                    <CaretRight className="ms-3 h-3 w-3 text-gray-600" />
                  </button>
                  {activeCategories[level] === sub.id &&
                    renderSubcategories(sub.subcategories, level + 1)}
                </>
              ) : (
                <Link
                  href={`/products?category=${sub.id}`}
                  className="block px-5 py-2.5 text-sm font-medium hover:bg-gray-200"
                  onMouseEnter={() =>
                    setActiveCategories((prev) => prev.slice(0, level))
                  }
                >
                  {toTitleCase(sub.name)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="relative h-full">
      {/* Main Category Button */}
      <button
        id="multiLevelDropdownButton"
        className="inline-flex h-full items-center text-nowrap rounded-l-md bg-black px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-black/75 focus:outline-none"
        onClick={handleCategoryPopup}
        type="button"
      >
        All Categories
        <CaretDown className="ms-3 h-3 w-3" />
      </button>

      {/* Dropdown Menu */}
      <div
        id="multi-dropdown"
        className={`z-10 ${openCategoryPopup ? "block" : "hidden"} absolute left-0 top-full mt-1 w-max divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-lg`}
        onMouseLeave={() => setActiveCategories([])}
      >
        <ul
          className="py-2 text-sm text-gray-800"
          aria-labelledby="multiLevelDropdownButton"
        >
          {categories.map((category) => (
            <li key={category.id}>
              {category.subcategories?.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-nowrap px-5 py-2.5 text-sm font-medium hover:bg-gray-200"
                    onMouseEnter={() => handleCategoryHover(category.id, 0)}
                  >
                    <Link href={`/products?category=${category.id}`}>
                      {toTitleCase(category.name)}
                    </Link>
                    <CaretRight className="ms-3 h-3 w-3 text-gray-600" />
                  </button>
                  {activeCategories[0] === category.id &&
                    renderSubcategories(category.subcategories)}
                </div>
              ) : (
                <Link
                  href={`/products?category=${category.id}`}
                  className="block px-5 py-2.5 text-sm font-medium hover:bg-gray-200"
                  onMouseEnter={() => setActiveCategories([])}
                >
                  {toTitleCase(category.name)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategoryDropdown;
