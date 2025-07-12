"use client";

import CategoryBreadcrumb from "@/components/store-components/Breadcrumb/CategoryBreadcrumb";
import FilterByCategory from "@/components/store-components/Shop/FilterByCategory";
import ProductList from "@/components/store-components/Shop/ProductList";
import type { CategoryAttribute } from "@/schemas/categorySchema";
import { api } from "@/trpc/react";
import type { Variant } from "@/types/ProductType";
import { type ProductWithCategory } from "@/types/ProductType";
import {
  CaretDown,
  CaretUp,
  CheckSquare,
  Funnel,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "../../../utils/format";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mobile filter state
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Extract filter parameters from URL
  const categoryId = searchParams?.get("category") ?? "";
  // Remove onSale parameter
  const brandParam = searchParams?.get("brand") ?? "";
  const minPrice = searchParams?.get("minPrice")
    ? Number(searchParams?.get("minPrice"))
    : undefined;
  const maxPrice = searchParams?.get("maxPrice")
    ? Number(searchParams?.get("maxPrice"))
    : undefined;
  const sortOption = searchParams?.get("sort") ?? "";
  const pageParam = searchParams?.get("page")
    ? Number(searchParams.get("page"))
    : 0;

  // State from URL parameters
  // Remove showOnlySale state
  const [currentSortOption, setCurrentSortOption] = useState(sortOption);
  const [currentPage, setCurrentPage] = useState(pageParam);
  // Change from string to string array for multiple brands
  const [brands, setBrands] = useState<string[]>(
    brandParam ? brandParam.split(",") : [],
  );
  const [category, setCategory] = useState<{
    id: string;
    name: string;
  } | null>(categoryId ? { id: categoryId, name: "" } : null);

  // Add state for category attributes
  type AttributeFilterValue = string | string[];
  const [attributeFilters, setAttributeFilters] = useState<
    Record<string, AttributeFilterValue>
  >({});

  // Add stock status filter
  const stockStatusParam = searchParams?.get("stockStatus") ?? "";
  const [stockStatus, setStockStatus] = useState<string[]>(
    stockStatusParam ? stockStatusParam.split(",") : [],
  );

  // Set default price range based on global min/max from database
  const [initialPriceRange, setInitialPriceRange] = useState({
    min: 0,
    max: 1000,
  });
  const [priceRange, setPriceRange] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({
    min: minPrice,
    max: maxPrice,
  });

  // Remove unsafe type assertion and @ts-expect-error for globalPriceRange
  const { data: globalPriceRange } = api.product.getPriceRange.useQuery();

  // Fetch products with filters
  const { data: products, isLoading } = api.product.getAllWithFilters.useQuery({
    categoryId: categoryId || undefined,
    brands: brands.length > 0 ? brands : undefined,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    sort: sortOption || undefined,
    attributes:
      Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
    stockStatus:
      stockStatus.length > 0
        ? (stockStatus as ("IN_STOCK" | "OUT_OF_STOCK" | "PRE_ORDER")[])
        : undefined,
  });

  // Safely filter and type products
  const safeProducts: ProductWithCategory[] = Array.isArray(products)
    ? (products as unknown[]).filter((p: unknown): p is ProductWithCategory =>
        isProductWithCategory(p),
      )
    : [];

  // Remove unsafe type assertion and @ts-expect-error for categoryBrands
  const { data: categoryBrands } = api.product.getBrandsByCategory.useQuery(
    {
      categoryId: categoryId || undefined,
    },
    {
      enabled: true,
      staleTime: Infinity,
      gcTime: Infinity,
      placeholderData: (previousData: string[] | undefined) => previousData,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );
  const safeCategoryBrands: string[] = Array.isArray(categoryBrands)
    ? categoryBrands.filter(
        (b): b is string => typeof b === "string" && b.trim() !== "",
      )
    : [];

  // Remove unsafe type assertion and @ts-expect-error for categoryAttributes
  const { data: categoryAttributes } =
    api.product.getCategoryAttributes.useQuery(
      { categoryId },
      {
        enabled: !!categoryId,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    );
  const safeCategoryAttributes: CategoryAttribute[] = Array.isArray(
    categoryAttributes,
  )
    ? categoryAttributes.filter(
        (attr): boolean =>
          attr &&
          typeof attr === "object" &&
          "name" in attr &&
          typeof attr.name === "string",
      )
    : [];

  // Add a dedicated query to fetch category information
  const { data: categoryData } = api.category.getById.useQuery(
    { id: categoryId },
    {
      enabled: !!categoryId,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  );

  // State for handling custom slider styling
  const [sliderStyle] = useState({
    trackStyle: { backgroundColor: "var(--brand-primary)", height: 4 },
    railStyle: { backgroundColor: "#e5e7eb", height: 4 },
    handleStyle: {
      borderColor: "var(--brand-primary)",
      backgroundColor: "#ffffff",
      opacity: 1,
      boxShadow: "0 0 0 2px rgba(249, 115, 22, 0.2)",
    },
  });

  // Update URL when filters change - use a memoized function to prevent recreation
  const updateUrlParams = useMemo(() => {
    return (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString());

      // Update or remove each parameter
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset to page 0 when filters change
      if (!("page" in newParams)) {
        params.set("page", "0");
      }

      // Build the new URL
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      // Use replace instead of push to prevent scroll to top, and add scroll: false option
      router.replace(newUrl, { scroll: false });
    };
  }, [searchParams, router]);

  // Setup initial price range based on global product prices from database
  useEffect(() => {
    if (globalPriceRange) {
      const dbMaxPrice = globalPriceRange.max;
      setInitialPriceRange({ min: 0, max: dbMaxPrice });
      // Only set priceRange if both min and max are undefined (i.e., not user-typed)
      setPriceRange((prev) => {
        const min = minPrice ?? prev.min;
        const max = maxPrice ?? prev.max;
        return {
          min: min ?? 0,
          max: max ?? dbMaxPrice,
        };
      });
    }
  }, [globalPriceRange, minPrice, maxPrice]);

  // When category is loaded, update the name - keep as fallback
  useEffect(() => {
    if (
      categoryId &&
      products &&
      products.length > 0 &&
      category?.id === categoryId &&
      !category.name &&
      !categoryData // Only use this fallback if the dedicated query didn't work
    ) {
      const categoryItem = Array.isArray(products)
        ? ((products as unknown[]).find(
            (p: unknown) =>
              isProductWithCategory(p) && p.categoryId === categoryId,
          ) as ProductWithCategory | undefined)
        : undefined;
      // Only access .category if categoryItem is ProductWithCategory
      const categoryObj =
        categoryItem && isProductWithCategory(categoryItem)
          ? categoryItem.category
          : undefined;
      if (categoryObj?.name) {
        setCategory({ id: categoryId, name: categoryObj.name });
      }
    }

    // Check if current brands exist in the new category
    if (categoryId && safeCategoryBrands && brands.length > 0) {
      const validBrands = brands.filter((brand) =>
        safeCategoryBrands.includes(brand.toLowerCase()),
      );

      // If any brands were removed, update state and URL
      if (validBrands.length !== brands.length) {
        setBrands(validBrands);
        if (validBrands.length === 0) {
          updateUrlParams({ brand: null });
        } else {
          updateUrlParams({ brand: validBrands.join(",") });
        }
      }
    }

    // If category is cleared, also clear brand selection
    if (!categoryId && brands.length > 0) {
      setBrands([]);
      updateUrlParams({ brand: null });
    }
  }, [
    products,
    categoryId,
    category?.id,
    category?.name,
    safeCategoryBrands,
    brands,
    updateUrlParams,
    categoryData,
  ]);

  // Add state to track expanded attribute sections
  const [expandedAttributes, setExpandedAttributes] = useState<
    Record<string, boolean>
  >({});

  // Initialize attribute filters from URL on category change
  useEffect(() => {
    if (categoryId && safeCategoryAttributes.length > 0) {
      const newFilters: Record<string, string | string[]> = {};
      let hasFilters = false;

      // Look for attributes in URL params
      safeCategoryAttributes.forEach((attr) => {
        const paramValue = searchParams?.get(attr.name);
        if (paramValue) {
          hasFilters = true;

          // All attributes are now "select" type only
          if (paramValue.includes(",")) {
            // Handle multiple values (array) and deduplicate
            newFilters[attr.name] = [...new Set(paramValue.split(","))];
          } else {
            newFilters[attr.name] = paramValue;
          }
        }
      });

      // Only update state if there are new filters and they're different from current filters
      if (
        hasFilters &&
        JSON.stringify(newFilters) !== JSON.stringify(attributeFilters)
      ) {
        setAttributeFilters(newFilters);
      }
    } else if (!categoryId && Object.keys(attributeFilters).length > 0) {
      setAttributeFilters({});
    }
  }, [categoryId, safeCategoryAttributes, searchParams]);

  // Toggle mobile filter sidebar
  const toggleMobileFilter = () => {
    setShowMobileFilter(!showMobileFilter);
    // Prevent body scroll when filter is open
    if (!showMobileFilter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  };

  // Close mobile filter on resize if screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && showMobileFilter) {
        setShowMobileFilter(false);
        document.body.style.overflow = "";
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
    };
  }, [showMobileFilter]);

  // Filter handlers
  const handleCategory = (categoryId: string, categoryName: string) => {
    // Reset all filter states
    setBrands([]);
    setPriceRange(initialPriceRange);
    // Remove showOnlySale reset
    setCurrentSortOption("");
    setCurrentPage(0);

    // Clear attribute filters
    if (Object.keys(attributeFilters).length > 0) {
      setAttributeFilters({});
    }

    // Set the new category
    setCategory({ id: categoryId, name: categoryName });

    // Get parameters to clear all attribute URL parameters
    const attrParams: Record<string, null> = {};
    Object.keys(attributeFilters).forEach((key) => {
      attrParams[key] = null;
    });

    // Update URL with only the new category and reset page to 0
    updateUrlParams({
      category: categoryId,
      brand: null,
      minPrice: null,
      maxPrice: null,
      // Remove sale parameter
      sort: null,
      page: "0",
      ...attrParams,
    });
  };

  // Remove handleShowOnlySale function

  const handleSortChange = (option: string) => {
    setCurrentSortOption(option);
    updateUrlParams({ sort: option === "Default" ? null : option });
  };

  const handlePriceChange = (values: number | number[]) => {
    if (Array.isArray(values)) {
      const newPriceRange = { min: values[0] ?? 0, max: values[1] ?? 0 };
      setPriceRange(newPriceRange);

      // Only update URL if price range has changed significantly (debounce)
      const minPrice =
        newPriceRange.min !== initialPriceRange.min
          ? String(newPriceRange.min)
          : null;
      const maxPrice =
        newPriceRange.max !== initialPriceRange.max
          ? String(newPriceRange.max)
          : null;

      updateUrlParams({
        minPrice,
        maxPrice,
      });
    }
  };

  // Modified to handle multiple brands
  const handleBrand = (brandName: string) => {
    let updatedBrands: string[];

    if (brands.includes(brandName)) {
      // Remove if already selected
      updatedBrands = brands.filter((b) => b !== brandName);
    } else {
      // Add if not already selected
      updatedBrands = [...brands, brandName];
    }

    setBrands(updatedBrands);

    // Update URL parameter without causing a page reload or revalidation
    if (updatedBrands.length === 0) {
      updateUrlParams({ brand: null });
    } else {
      updateUrlParams({ brand: updatedBrands.join(",") });
    }
  };

  const handleAttributeChange = (
    name: string,
    value: string | string[] | null,
  ) => {
    // Clone the current filters
    const updatedFilters = { ...attributeFilters };

    if (value === null) {
      // Remove the filter if it exists
      if (name in updatedFilters) {
        delete updatedFilters[name];

        // Update state immediately for better responsiveness
        setAttributeFilters(updatedFilters);

        // Then update URL
        updateUrlParams({ [name]: null });
      }
      return;
    }

    if (typeof value === "string") {
      const currentValue = updatedFilters[name];

      if (!currentValue) {
        // If no current value, set as single string (not array)
        updatedFilters[name] = [value];
      } else if (Array.isArray(currentValue)) {
        // If current value is array, toggle the value
        if (currentValue.includes(value)) {
          // Remove the value
          const newValues = currentValue.filter((v) => v !== value);

          if (newValues.length === 0) {
            // If no values left, remove the attribute completely
            delete updatedFilters[name];
          } else {
            // Otherwise keep the remaining values
            updatedFilters[name] = newValues;
          }
        } else {
          // Add the value (no duplicates)
          updatedFilters[name] = [...currentValue, value];
        }
      } else {
        // If current value is a string, toggle it
        if (currentValue === value) {
          // If trying to deselect the only value, remove the attribute entirely
          delete updatedFilters[name];
        } else {
          // Otherwise add the new value to create an array
          updatedFilters[name] = [currentValue, value];
        }
      }
    } else if (Array.isArray(value)) {
      // Direct array assignment (used when loading from URL)
      if (value.length === 0) {
        delete updatedFilters[name];
      } else {
        // Ensure no duplicates
        updatedFilters[name] = [...new Set(value)];
      }
    }

    // Update state immediately for better UI responsiveness
    setAttributeFilters(updatedFilters);

    // Then update URL with the final value
    if (name in updatedFilters) {
      const arrayValue = Array.isArray(updatedFilters[name])
        ? updatedFilters[name]
        : [updatedFilters[name]!];

      // Convert to string for URL param
      const paramValue = arrayValue.join(",");

      // Update URL immediately rather than with a delay
      updateUrlParams({ [name]: paramValue });
    } else {
      // The attribute was removed, so remove it from URL
      updateUrlParams({ [name]: null });
    }
  };

  const clearAttributeFilters = () => {
    // Generate parameters to clear all attribute URL parameters
    const attrParams: Record<string, null> = {};
    Object.keys(attributeFilters).forEach((key) => {
      attrParams[key] = null;
    });

    // Clear attribute filter state
    if (Object.keys(attributeFilters).length > 0) {
      setAttributeFilters({});
    }

    return attrParams;
  };

  const handleStockStatus = (status: string) => {
    let updatedStatus: string[];
    if (stockStatus.includes(status)) {
      updatedStatus = stockStatus.filter((s) => s !== status);
    } else {
      updatedStatus = [...stockStatus, status];
    }
    setStockStatus(updatedStatus);
    if (updatedStatus.length === 0) {
      updateUrlParams({ stockStatus: null });
    } else {
      updateUrlParams({ stockStatus: updatedStatus.join(",") });
    }
  };

  const clearStockStatus = () => {
    if (stockStatus.length > 0) {
      setStockStatus([]);
      updateUrlParams({ stockStatus: null });
    }
  };

  const handleClearAll = () => {
    setBrands([]);
    setPriceRange(initialPriceRange);
    setCategory(null);
    setCurrentSortOption("");
    clearStockStatus();
    const attrParams = clearAttributeFilters();
    updateUrlParams({
      category: null,
      brand: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      page: "0",
      ...attrParams,
      stockStatus: null,
    });
  };

  const handlePageChange = (selected: number) => {
    setCurrentPage(selected);
    updateUrlParams({ page: selected.toString() });
  };

  // Add products per page state and URL param
  const perPageParam = searchParams?.get("perPage")
    ? Number(searchParams.get("perPage"))
    : 20;
  const [productsPerPage, setProductsPerPage] = useState(perPageParam);

  // Update URL when productsPerPage changes
  const handleProductsPerPageChange = (value: number) => {
    setProductsPerPage(value);
    setCurrentPage(0); // Reset to first page
    updateUrlParams({ perPage: value.toString(), page: "0" });
  };

  // Pagination setup
  const offset = currentPage * productsPerPage;
  const totalProducts = safeProducts.length;
  const pageCount = Math.ceil(totalProducts / productsPerPage);

  // Get current page of products
  const currentProducts = useMemo(() => {
    return safeProducts.slice(offset, offset + productsPerPage);
  }, [safeProducts, offset, productsPerPage]);

  // Toggle function for attribute sections
  const toggleAttributeSection = (attrName: string) => {
    setExpandedAttributes((prev) => ({
      ...prev,
      [attrName]: !prev[attrName],
    }));
  };

  // Add effect to update category state with name from categoryData
  useEffect(() => {
    if (
      categoryId &&
      categoryData &&
      (!category || category.name !== categoryData.name)
    ) {
      setCategory({ id: categoryId, name: categoryData.name });
    }
  }, [categoryId, categoryData, category]);

  return (
    <>
      <CategoryBreadcrumb categoryId={category?.id} pageTitle="Shop" />
      <div className="shop-product breadcrumb1 py-10 md:py-14 lg:py-20">
        <div className="container">
          <div className="flex gap-y-8 max-md:flex-col-reverse max-md:flex-wrap">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="sidebar hidden w-full md:block md:w-1/3 md:pr-12 lg:w-1/4">
              {/* Filter sidebar content that's always visible on desktop */}
              {renderFilterContent()}
            </div>

            {/* Main content area */}
            <div className="list-product-block w-full md:w-2/3 md:pl-3 lg:w-3/4">
              <div className="filter-heading flex flex-wrap items-center justify-between gap-5">
                <div className="left has-line flex flex-wrap items-center gap-5">
                  {/* Filter Button - Only show on mobile */}
                  <button
                    className="tool-btn flex items-center gap-1 rounded-md bg-brand-primary px-3 py-2 text-white md:hidden"
                    id="lc-toggle"
                    onClick={toggleMobileFilter}
                    aria-label="Filter products"
                    type="button"
                  >
                    <Funnel size={20} weight="bold" />
                    <span className="ml-1">Filter</span>
                  </button>
                  {/* Remove "Show only products on sale" checkbox */}
                </div>
                <div className="right flex items-center gap-3">
                  {/* Show: Products per page dropdown */}
                  <div className="select-block relative">
                    <label
                      htmlFor="select-per-page"
                      className="mr-2 hidden text-sm text-gray-700 md:inline-block"
                    >
                      Show:
                    </label>
                    <select
                      id="select-per-page"
                      name="select-per-page"
                      className="caption1 rounded-lg border border-gray-200 py-2 pl-3 pr-10 transition-colors focus:border-brand-primary focus:ring focus:ring-brand-primary md:pr-12"
                      onChange={(e) =>
                        handleProductsPerPageChange(Number(e.target.value))
                      }
                      value={productsPerPage}
                    >
                      <option value={20}>20</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={75}>75</option>
                      <option value={90}>90</option>
                    </select>
                    <CaretDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 md:right-4"
                    />
                  </div>
                  {/* Sort dropdown (existing) */}
                  <div className="select-block relative">
                    <label
                      htmlFor="select-filter"
                      className="mr-2 hidden text-sm text-gray-700 md:inline-block"
                    >
                      Sort By:
                    </label>
                    <select
                      id="select-filter"
                      name="select-filter"
                      className="caption1 rounded-lg border border-gray-200 py-2 pl-3 pr-10 transition-colors focus:border-brand-primary focus:ring focus:ring-brand-primary md:pr-20"
                      onChange={(e) => {
                        handleSortChange(e.target.value);
                      }}
                      value={currentSortOption || "Default"}
                    >
                      <option value="Default" disabled>
                        Default
                      </option>

                      <option value="priceLowToHigh">Price Low To High</option>
                      <option value="priceHighToLow">Price High To Low</option>
                    </select>
                    <CaretDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 md:right-4"
                    />
                  </div>
                </div>
              </div>

              <div className="list-filtered mt-4 flex flex-wrap items-center gap-3">
                <div className="total-product">
                  {totalProducts}
                  <span className="pl-1 text-gray-500">Products Found</span>
                </div>
                {(category ??
                  brands.length > 0 ??
                  (Object.keys(attributeFilters).length > 0 ||
                    priceRange.min !== initialPriceRange.min ||
                    priceRange.max !== initialPriceRange.max)) && (
                  <>
                    <div className="list flex flex-wrap items-center gap-3">
                      <div className="h-4 w-px bg-gray-200"></div>
                      {category && (
                        <div
                          className="item flex cursor-pointer items-center gap-1 rounded-full bg-orange-100 px-2 py-1 capitalize text-brand-primary transition-colors hover:bg-orange-200"
                          onClick={() => {
                            setCategory(null);
                            updateUrlParams({ category: null });
                          }}
                        >
                          <X size={16} className="cursor-pointer" />
                          <span>{category.name}</span>
                        </div>
                      )}
                      {/* Modified to show all selected brands */}
                      {brands.map((brandName: string, index: number) => (
                        <div
                          key={`brand-${index}`}
                          className="item flex cursor-pointer items-center gap-1 rounded-full bg-orange-100 px-2 py-1 capitalize text-brand-primary transition-colors hover:bg-orange-200"
                          onClick={() => handleBrand(brandName)}
                        >
                          <X size={16} className="cursor-pointer" />
                          <span>{brandName}</span>
                        </div>
                      ))}
                      {/* Add after brand pills: */}
                      {stockStatus.map((status: string, index: number) => (
                        <div
                          key={`stockStatus-${index}`}
                          className="item flex cursor-pointer items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-brand-primary transition-colors hover:bg-orange-200"
                          onClick={() => handleStockStatus(status)}
                        >
                          <X size={16} className="cursor-pointer" />
                          <span>
                            {status === "IN_STOCK"
                              ? "In Stock"
                              : status === "OUT_OF_STOCK"
                                ? "Out of Stock"
                                : status === "PRE_ORDER"
                                  ? "Pre Order"
                                  : status}
                          </span>
                        </div>
                      ))}
                      {(priceRange.min !== initialPriceRange.min ||
                        priceRange.max !== initialPriceRange.max) && (
                        <div
                          className="item flex cursor-pointer items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-brand-primary transition-colors hover:bg-orange-200"
                          onClick={() => {
                            setPriceRange(initialPriceRange);
                            updateUrlParams({ minPrice: null, maxPrice: null });
                          }}
                        >
                          <X size={16} className="cursor-pointer" />
                          <span>
                            {formatPrice(priceRange.min)} -{" "}
                            {formatPrice(priceRange.max)}
                          </span>
                        </div>
                      )}
                      {/* Attribute filter pills */}
                      {Object.entries(attributeFilters).map(
                        ([key, value]: [string, string | string[]]) => {
                          // Format key for display
                          const displayKey = key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase());

                          // Format value for display
                          const displayValue = Array.isArray(value)
                            ? value.join(", ")
                            : typeof value === "boolean"
                              ? "Yes"
                              : String(value);

                          return (
                            <div
                              key={key}
                              className="item flex cursor-pointer items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-brand-primary transition-colors hover:bg-orange-200"
                              onClick={() => {
                                // Use the handler directly without modifying state again
                                handleAttributeChange(key, null);
                              }}
                            >
                              <X size={16} className="cursor-pointer" />
                              <span>
                                {displayKey}: {displayValue}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div
                      className="clear-btn hover:bg-red-500-50 border-red flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 transition-colors"
                      onClick={handleClearAll}
                    >
                      <X
                        color="rgb(219, 68, 68)"
                        size={16}
                        className="cursor-pointer"
                      />
                      <span className="text-button-uppercase text-red-500">
                        Clear All
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Product list with loading state */}
              {isLoading ? (
                <div className="flex h-60 items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
                </div>
              ) : (
                <ProductList
                  data={currentProducts}
                  layoutCol={4}
                  pageCount={pageCount}
                  handlePageChange={handlePageChange}
                />
              )}
              {/* Category Description for SEO */}
              {categoryData?.description && (
                <div className="mt-10 rounded-lg p-6 text-gray-700 shadow-sm">
                  <h2 className="mb-2 bg-brand-primary p-5 text-lg font-semibold text-white">
                    About this Category
                  </h2>
                  <div
                    className="prose max-w-none bg-white p-5"
                    dangerouslySetInnerHTML={{
                      __html: categoryData.description,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Button - Fixed at bottom right */}
      {/* <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          onClick={toggleMobileFilter}
          className="flex items-center justify-center rounded-full bg-brand-primary p-4 text-white shadow-xl transition-colors hover:bg-brand-primary"
          aria-label="Filter products"
        >
          <Funnel size={24} weight="bold" />
        </button>
      </div> */}

      {/* Mobile Filter Sidebar */}
      {showMobileFilter && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[9999] bg-transparent md:hidden"
            onClick={toggleMobileFilter}
          ></div>

          {/* Sidebar */}
          <div className="fixed right-0 top-0 z-[9999] h-full w-[300px] max-w-[80vw] overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={toggleMobileFilter}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X size={24} className="text-gray-700" />
              </button>
            </div>

            <div className="p-4">{renderFilterContent()}</div>

            <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
              <button
                onClick={() => {
                  handleClearAll();
                  toggleMobileFilter();
                }}
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={toggleMobileFilter}
                className="w-full rounded-lg bg-brand-primary px-4 py-2 text-white transition-colors hover:bg-brand-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Function to render filter content - used by both desktop and mobile views
  function renderFilterContent() {
    return (
      <>
        {/* Price Range Section - Always visible, not collapsible */}
        <div className="filter-section mb-3 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <div className="bg-gray-50 px-3 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-800">
                Price Range
              </h3>
            </div>
          </div>

          {/* Price range content - always shown */}
          <div className="bg-white p-3">
            <Slider
              range
              value={[
                priceRange.min ?? 0,
                priceRange.max ?? initialPriceRange.max,
              ]}
              min={initialPriceRange.min}
              max={initialPriceRange.max}
              onChange={handlePriceChange}
              className="mb-4 mt-2"
              trackStyle={sliderStyle.trackStyle}
              railStyle={sliderStyle.railStyle}
              handleStyle={[sliderStyle.handleStyle, sliderStyle.handleStyle]}
            />
            {/* Responsive, flexible, and single price-block with editable Min/Max */}
            <div className="price-block mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min mb-2 flex w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 sm:mb-0 sm:w-auto">
                <div className="mr-1 whitespace-nowrap text-sm text-gray-500">
                  Min:
                </div>
                <input
                  type="number"
                  value={priceRange.min ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setPriceRange((pr) => ({ ...pr, min: undefined }));
                      updateUrlParams({ minPrice: null });
                      return;
                    }
                    const newMin = Number(val);
                    if (isNaN(newMin)) return;
                    let newMax = priceRange.max ?? newMin;
                    if (newMin > newMax) newMax = newMin;
                    setPriceRange({ min: newMin, max: newMax });
                    const minPrice =
                      newMin !== initialPriceRange.min ? String(newMin) : null;
                    const maxPrice =
                      newMax !== initialPriceRange.max ? String(newMax) : null;
                    updateUrlParams({ minPrice, maxPrice });
                  }}
                  className="w-full min-w-0 max-w-[100px] flex-1 border-none bg-transparent px-1 text-base font-medium text-brand-primary outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
                  aria-label="Minimum price"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="max flex w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 sm:w-auto">
                <div className="mr-1 whitespace-nowrap text-sm text-gray-500">
                  Max:
                </div>
                <input
                  type="number"
                  value={priceRange.max ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setPriceRange((pr) => ({ ...pr, max: undefined }));
                      updateUrlParams({ maxPrice: null });
                      return;
                    }
                    const newMax = Number(val);
                    if (isNaN(newMax)) return;
                    let newMin = priceRange.min ?? newMax;
                    if (newMax < newMin) newMin = newMax;
                    setPriceRange({ min: newMin, max: newMax });
                    const minPrice =
                      newMin !== initialPriceRange.min ? String(newMin) : null;
                    const maxPrice =
                      newMax !== initialPriceRange.max ? String(newMax) : null;
                    updateUrlParams({ minPrice, maxPrice });
                  }}
                  className="w-full min-w-0 max-w-[100px] flex-1 border-none bg-transparent px-1 text-base font-medium text-brand-primary outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
                  aria-label="Maximum price"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Stock Status Section - collapsible with improved styling */}
        <div className="filter-section mb-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <div
            className="cursor-pointer bg-gray-50 px-3 py-2 hover:bg-gray-100"
            onClick={() => toggleAttributeSection("stockStatus")}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-800">
                Stock Status
              </h3>
              {expandedAttributes.stockStatus !== false ? (
                <CaretUp size={16} className="text-gray-600" />
              ) : (
                <CaretDown size={16} className="text-gray-600" />
              )}
            </div>
          </div>
          {expandedAttributes.stockStatus !== false && (
            <div className="bg-white p-1">
              <div className="flex flex-col gap-2">
                {["IN_STOCK", "OUT_OF_STOCK", "PRE_ORDER"].map((status) => (
                  <label
                    key={status}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:text-brand-primary"
                  >
                    <div className="block-input relative">
                      <input
                        type="checkbox"
                        checked={stockStatus.includes(status)}
                        onChange={() => handleStockStatus(status)}
                        className="h-5 w-5 rounded border-gray-300 accent-brand-primary"
                      />
                      <CheckSquare
                        size={20}
                        weight="fill"
                        className="icon-checkbox absolute left-0 top-0 text-brand-primary"
                      />
                    </div>
                    <span className="capitalize">
                      {status === "IN_STOCK"
                        ? "In Stock"
                        : status === "OUT_OF_STOCK"
                          ? "Out of Stock"
                          : status === "PRE_ORDER"
                            ? "Pre Order"
                            : status}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories Section - Collapsible with increased min-height and standardized padding */}
        <div className="filter-section mb-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <div
            className="cursor-pointer bg-gray-50 px-3 py-2 hover:bg-gray-100"
            onClick={() => toggleAttributeSection("categories")}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-800">
                Categories
              </h3>
              {expandedAttributes.categories !== false ? (
                <CaretUp size={16} className="text-gray-600" />
              ) : (
                <CaretDown size={16} className="text-gray-600" />
              )}
            </div>
          </div>

          {/* Categories content - shown when expanded */}
          {expandedAttributes.categories !== false && (
            <div className="bg-white p-1">
              <div className="max-h-[300px] min-h-[180px] overflow-y-auto pr-1">
                <FilterByCategory
                  handleCategory={handleCategory}
                  selectedCategoryId={category?.id ?? categoryId}
                />
              </div>
            </div>
          )}
        </div>

        {/* Brands Section - Only show when a category is selected */}
        {category && categoryId && (
          <div className="filter-section mb-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <div
              className="cursor-pointer bg-gray-50 px-3 py-2 hover:bg-gray-100"
              onClick={() => toggleAttributeSection("brands")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-800">Brands</h3>
                {expandedAttributes.brands !== false ? (
                  <CaretUp size={16} className="text-gray-600" />
                ) : (
                  <CaretDown size={16} className="text-gray-600" />
                )}
              </div>
            </div>

            {/* Brands content - shown when expanded */}
            {expandedAttributes.brands !== false && (
              <div className="bg-white p-1">
                <div className="list-brand">
                  {isLoading && !safeCategoryBrands.length ? (
                    <div className="my-1 text-gray-500">Loading brands...</div>
                  ) : safeCategoryBrands.length === 0 ? (
                    <div className="my-1 text-gray-500">
                      No brands available
                    </div>
                  ) : (
                    <div className="max-h-[250px] min-h-[120px] space-y-0.5 overflow-y-auto pr-1">
                      {safeCategoryBrands.map((item: string, index: number) => (
                        <div key={index} className="brand-item">
                          <div className="left flex w-full cursor-pointer items-center rounded px-2 py-1 transition-colors hover:text-brand-primary">
                            <div className="block-input relative">
                              <input
                                type="checkbox"
                                name={item}
                                id={item}
                                checked={brands.includes(item)}
                                onChange={() => handleBrand(item)}
                                className="h-5 w-5 rounded border-gray-300 accent-orange-500"
                              />
                              <CheckSquare
                                size={20}
                                weight="fill"
                                className="icon-checkbox absolute left-0 top-0 text-brand-primary"
                              />
                            </div>
                            <label
                              htmlFor={item}
                              className="brand-name cursor-pointer pl-3 capitalize"
                            >
                              {item}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Specifications Section - collapsible with improved styling */}
        {category && categoryId && safeCategoryAttributes.length > 0 && (
          <>
            {safeCategoryAttributes.map(
              (attr: CategoryAttribute, index: number) => {
                // Skip if no available options
                const options = attr.options;
                if (options.length === 0) {
                  return null;
                }

                // Format attribute name for display
                const displayName = attr.name
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                const isExpanded = expandedAttributes[attr.name] !== false;

                return (
                  <div
                    key={index}
                    className="filter-section mb-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div
                      className="cursor-pointer bg-gray-50 px-3 py-2 hover:bg-gray-100"
                      onClick={() => toggleAttributeSection(attr.name)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-800">
                          {displayName}
                        </h3>
                        {isExpanded ? (
                          <CaretUp size={16} className="text-gray-600" />
                        ) : (
                          <CaretDown size={16} className="text-gray-600" />
                        )}
                      </div>
                    </div>

                    {/* Content area - shown when expanded with increased min-height */}
                    {isExpanded && (
                      <div className="bg-white py-1">
                        <div className="flex max-h-[250px] min-h-[120px] flex-col overflow-y-auto">
                          {options.map((option: string, idx: number) => {
                            // Check if this option is selected
                            const isSelected = Array.isArray(
                              attributeFilters[attr.name],
                            )
                              ? (
                                  attributeFilters[attr.name] as string[]
                                )?.includes(option)
                              : attributeFilters[attr.name] === option;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded px-2 py-1 transition-colors hover:bg-gray-50"
                              >
                                <div className="left flex w-full cursor-pointer items-center">
                                  <div className="block-input relative">
                                    <input
                                      type="checkbox"
                                      id={`${attr.name}-${option}`}
                                      checked={isSelected}
                                      onChange={() => {
                                        handleAttributeChange(
                                          attr.name,
                                          option,
                                        );
                                      }}
                                      className="h-5 w-5 accent-orange-500"
                                    />
                                    <CheckSquare
                                      size={20}
                                      weight="fill"
                                      className="icon-checkbox absolute left-0 top-0 text-brand-primary"
                                    />
                                  </div>
                                  <label
                                    htmlFor={`${attr.name}-${option}`}
                                    className="cursor-pointer pl-3 capitalize"
                                  >
                                    {option}
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </>
        )}
      </>
    );
  }

  // Type guard for Variant[]
  function isVariantArray(val: unknown): val is Variant[] {
    return (
      Array.isArray(val) &&
      val.every(
        (v) =>
          typeof v === "object" &&
          v !== null &&
          ("price" in v || "color" in v || "size" in v),
      )
    );
  }

  // Type guard for ProductWithCategory
  function isProductWithCategory(val: unknown): val is ProductWithCategory {
    return (
      typeof val === "object" &&
      val !== null &&
      "id" in val &&
      typeof (val as { id: unknown }).id === "string"
    );
  }
}
