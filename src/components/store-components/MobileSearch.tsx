"use client";

import { api } from "@/trpc/react";
import { type ProductWithCategory } from "@/types/ProductType";
import { MagnifyingGlass, SpinnerGap, X } from "@phosphor-icons/react/dist/ssr";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "../../utils/format";

function isProductWithCategory(val: unknown): val is ProductWithCategory {
  if (!val || typeof val !== "object") return false;
  return "id" in val &&
    "title" in val &&
    "images" in val &&
    "price" in val &&
    "discountedPrice" in val &&
    "category" in val
    ? true
    : false;
}

export default function MobileSearch() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();

  // Use the useDebounce hook with 300ms delay
  const debouncedSearchTerm = useDebounce(searchKeyword, 300);

  // Use trpc to fetch search results with loading state
  const { data: searchResults = [], isLoading: isSearchLoading } =
    api.product.search.useQuery(
      { query: debouncedSearchTerm },
      {
        enabled: debouncedSearchTerm.length > 1,
      },
    );

  // Show search container when user starts typing
  useEffect(() => {
    if (searchKeyword.length > 1) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchKeyword]);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    router.push(`/search-result?query=${value}`);
    setSearchKeyword("");
    setShowSearchResults(false);
  };

  return (
    <div className="mobile-search-container w-full px-4 py-3">
      <div className="relative">
        <div className="flex h-10 w-full items-center overflow-hidden rounded-md border border-gray-300">
          <input
            type="text"
            className="h-full flex-1 border-0 px-3 text-sm focus:outline-none"
            placeholder="Search products..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchKeyword)}
          />
          {searchKeyword ? (
            <button
              className="flex h-full w-10 items-center justify-center bg-gray-100"
              onClick={() => setSearchKeyword("")}
            >
              <X size={18} />
            </button>
          ) : null}
          <button
            className="flex h-full w-10 items-center justify-center bg-black text-white hover:bg-black/75"
            onClick={() => handleSearch(searchKeyword)}
          >
            <MagnifyingGlass size={18} />
          </button>
        </div>

        {/* Mobile Search Results with Loading State */}
        {showSearchResults && searchKeyword.length > 1 && (
          <div className="search-results absolute left-0 right-0 top-full z-50 mt-1 max-h-[60vh] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-2 text-sm font-medium text-gray-900">
              {isSearchLoading ? "Searching..." : "Search Results"}
            </div>

            {/* Loading spinner */}
            {isSearchLoading ? (
              <div className="flex h-24 w-full items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-black" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <>
                <div className="max-h-[50vh] overflow-y-auto">
                  {searchResults
                    .filter(isProductWithCategory)
                    .map((product) => {
                      if (isProductWithCategory(product)) {
                        return (
                          <div
                            key={product.id}
                            className="search-result-item cursor-pointer border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
                            onClick={() => {
                              router.push(`/product/${product.slug}`);
                              setShowSearchResults(false);
                              setSearchKeyword("");
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <div className="h-12 w-12 flex-shrink-0">
                                  <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="line-clamp-1 text-sm font-medium text-gray-900">
                                  {product.title}
                                </div>
                                <div className="line-clamp-1 text-xs text-gray-500">
                                  {product.shortDescription}
                                </div>
                                <div className="mt-0.5 text-sm font-medium">
                                  {product.discountedPrice != null &&
                                  product.discountedPrice < product.price ? (
                                    <>
                                      <span className="discounted-price">
                                        {formatPrice(product.discountedPrice)}
                                      </span>
                                      <span className="ml-2 text-gray-400 line-through">
                                        {formatPrice(product.price)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="discounted-price">
                                      {formatPrice(product.price)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
                <div
                  className="cursor-pointer bg-gray-50 p-2 text-center text-sm font-medium text-black hover:bg-gray-100"
                  onClick={() => handleSearch(searchKeyword)}
                >
                  View all results
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No products found matching &quot;{searchKeyword}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
