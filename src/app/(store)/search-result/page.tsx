"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import HandlePagination from "@/components/store-components/HandlePagination";
import Product from "@/components/store-components/Product/Product";
import { api } from "@/trpc/react";
import { type ProductWithCategory } from "@/types/ProductType";
import { HomeIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 8;
  const offset = currentPage * productsPerPage;

  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get("query") ?? "";

  // Use the search endpoint with suspense
  const { data: products, isLoading } = api.product.search.useQuery(
    { query: query.length > 0 ? query : "default" },
    {
      enabled: query.length > 0,
      // If no query, return an empty array
      initialData: [],
    },
  );

  // Find page number based on filteredData
  const pageCount = Math.ceil((products?.length || 0) / productsPerPage);

  // Get product data for current page
  const currentProducts =
    products?.slice(offset, offset + productsPerPage) || [];

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/search-result?query=${encodeURIComponent(value.trim())}`);
      setSearchKeyword("");
    }
  };

  const handlePageChange = (selected: number) => {
    setCurrentPage(selected);
  };

  const breadcrumbItems = [
    {
      label: <HomeIcon size={16} />,
      href: "/",
    },
    {
      label: "Search Result",
    },
  ];

  // Type guard for ProductWithCategory
  function isProductWithCategory(val: unknown): val is ProductWithCategory {
    return (
      typeof val === "object" &&
      val !== null &&
      "id" in val &&
      "title" in val &&
      "images" in val &&
      "price" in val &&
      "discountedPrice" in val
    );
  }

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Search Result" />
      </div>
      <div className="py-10 md:py-14 lg:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-4">
          <div className="flex flex-col items-center">
            <div className="text-center text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
              {isLoading ? (
                "Searching..."
              ) : query ? (
                <>
                  Found {products.length} results for {String.raw`"`}
                  {query}
                  {String.raw`"`}
                </>
              ) : (
                "Search for products"
              )}
            </div>
            <div className="mt-5 h-[44px] w-full sm:mt-8 sm:w-3/5 md:h-[52px] lg:w-1/2">
              <div className="relative h-full w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-full w-full rounded-xl border border-[#ddd] pl-4 pr-32 text-base font-normal leading-[22] focus:border-[#ddd] md:pr-[150px] md:text-[13px] md:leading-5"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSearch(searchKeyword)
                  }
                />
                <button
                  className="duration-400 md:text-md hover:bg-green absolute bottom-1 right-1 top-1 flex cursor-pointer items-center justify-center rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                  onClick={() => handleSearch(searchKeyword)}
                >
                  search
                </button>
              </div>
            </div>
          </div>
          <div className="list-product-block relative pt-6 md:pt-10">
            {query && <div className="heading6">product Search: {query}</div>}

            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {products.length === 0 && query ? (
                  <div className="my-10 text-center">
                    No products match your search criteria.
                  </div>
                ) : (
                  <div
                    className={`list-product hide-product-sold mt-5 grid grid-cols-2 gap-[20px] sm:grid-cols-3 sm:gap-[30px] lg:grid-cols-4`}
                  >
                    {currentProducts
                      .filter(isProductWithCategory)
                      .map((item) => (
                        <Product key={item.id} data={item} />
                      ))}
                  </div>
                )}

                {pageCount > 1 && (
                  <div className="list-pagination mt-7 flex items-center justify-center md:mt-10">
                    <HandlePagination
                      pageCount={pageCount}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
