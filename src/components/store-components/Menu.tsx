"use client";

import { useCartStore } from "@/context/store-context/CartContext";
import { useModalCartStore } from "@/context/store-context/ModalCartContext";
import { useModalWishlistStore } from "@/context/store-context/ModalWishlistContext";
import useLoginPopup from "@/hooks/useLoginPopup";
import useMenuMobile from "@/hooks/useMenuMobile";
import { api } from "@/trpc/react";
import {
  CaretDown,
  Handbag,
  Heart,
  MagnifyingGlass,
  SpinnerGap,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Key, useEffect, useRef, useState } from "react";
import { formatPrice } from "../../utils/format";
import CategoryDropdown from "./Category/CategoryDropdown";
import MobileMenu from "./MobileMenu";
import TopNav from "./TopNav";

export default function Menu({
  isAuthenticated,
  props,
}: {
  isAuthenticated: boolean;
  props?: string;
}) {
  const { openLoginPopup, handleLoginPopup } = useLoginPopup();
  const { openMenuMobile, handleMenuMobile } = useMenuMobile();
  const { openModalCart } = useModalCartStore();
  const { cartArray } = useCartStore();
  const { openModalWishlist } = useModalWishlistStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();

  // Use the useDebounce hook with 300ms delay
  const debouncedSearchTerm = useDebounce(searchKeyword, 300);

  // Simplified sticky header implementation - only for category nav
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Make category navbar sticky when scrolled past the main header
      // We're using a smaller threshold (50px) for just the navbar
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 120); // Adjusted threshold for just the navbar
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    router.push(`/search-result?query=${value}`);
    setSearchKeyword("");
    setShowSearchResults(false);
  };

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

  // Close search results when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     const target = event.target as HTMLElement;
  //     if (!target.closest(".search-container")) {
  //       setShowSearchResults(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  // Keep the lastScrollPosition state for potential future use
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setLastScrollPosition(scrollPosition);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollPosition]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch categories for the navigation menu
  const { data: categories } = api.category.getAll.useQuery(undefined, {
    staleTime: 60000, // Cache for 1 minute
  });

  // Utility function to convert string to title case
  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
    );
  };

  // Add useRef to track the search container
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Add effect to close search when clicking outside
  // useEffect(() => {
  //   if (!isSearchOpen) return;

  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       mobileSearchRef.current &&
  //       !mobileSearchRef.current.contains(event.target as Node)
  //     ) {
  //       setIsSearchOpen(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [isSearchOpen]);

  return (
    <>
      {/* Show TopNav only on mobile and desktop, hide on md and lg (tablets) */}
      <div className="block md:hidden xl:block">
        <TopNav props="style-one bg-black " />
      </div>

      {/* Main header - sticky on mobile */}
      <div className="header-menu w-full bg-white lg:pt-5">
        <div
          className={`header-menu style-eight h-[56px] w-full bg-white md:h-[74px] ${props} max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-40`}
        >
          <div className="mx-auto h-full w-full !max-w-[1322px] px-4">
            <div className="header-main relative flex h-full items-center justify-between">
              <div
                className="menu-mobile-icon flex items-center lg:hidden"
                onClick={handleMenuMobile}
              >
                <i className="icon-category text-2xl"></i>
              </div>
              <Link
                href={"/"}
                className="flex items-center max-lg:absolute max-lg:left-1/2 max-lg:z-10 max-lg:-translate-x-1/2 lg:relative lg:left-0 lg:transform-none"
              >
                <Image
                  src="/light.png"
                  alt="Rinors"
                  width={260}
                  height={80}
                  priority
                  className="ml-[-30px] h-auto w-[300px] object-contain lg:ml-[-40px]"
                />
              </Link>
              <div className="form-search relative flex h-[44px] w-2/3 items-center pl-8 max-lg:hidden">
                <CategoryDropdown />

                <div className="search-container relative flex h-full w-full items-center">
                  <input
                    type="text"
                    className="search-input h-full w-full border border-[#ddd] px-4 focus:border-[#ddd]"
                    placeholder="What are you looking for today?"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearch(searchKeyword)
                    }
                  />
                  <button
                    className="search-button duration-400 md:text-md hover:bg-green !flex h-full cursor-pointer !items-center !justify-center rounded-[.25rem] !rounded-l-none !rounded-r bg-black px-7 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                    onClick={() => handleSearch(searchKeyword)}
                  >
                    Search
                  </button>

                  {/* Search Results Dropdown with Loading State */}
                  {showSearchResults && searchKeyword.length > 1 && (
                    <div className="search-results absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-md border border-[#ddd] bg-white shadow-lg focus:border-[#ddd]">
                      <div className="px-4 py-2 text-sm font-medium text-gray-900">
                        {isSearchLoading ? "Searching..." : "Search Results"}
                      </div>

                      {/* Loading spinner */}
                      {isSearchLoading ? (
                        <div className="flex h-24 w-full items-center justify-center">
                          <SpinnerGap
                            size={24}
                            className="animate-spin text-black"
                          />
                        </div>
                      ) : Array.isArray(searchResults) &&
                        searchResults.length > 0 ? (
                        <>
                          <div className="max-h-[350px] overflow-y-auto">
                            {searchResults.map((product, idx) => {
                              if (
                                typeof product === "object" &&
                                product !== null &&
                                "id" in product &&
                                "title" in product &&
                                "slug" in product &&
                                "images" in product &&
                                Array.isArray(product.images)
                              ) {
                                return (
                                  <div
                                    key={product.id}
                                    className="search-result-item cursor-pointer border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
                                    onClick={() => {
                                      router.push(`/products/${product.slug}`);
                                      setShowSearchResults(false);
                                      setSearchKeyword("");
                                      setIsSearchOpen(false);
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
                                          product.discountedPrice <
                                            product.price ? (
                                            <>
                                              <span className="discounted-price">
                                                {formatPrice(
                                                  product.discountedPrice,
                                                )}
                                              </span>
                                              <span className="ml-2 text-gray-400 line-through">
                                                {formatPrice(product.price)}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-black">
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
              <div className="right flex gap-12">
                <div className="list-action flex items-center gap-4">
                  {/* Add mobile search icon for small screens */}
                  <div
                    className="search-icon flex cursor-pointer items-center lg:hidden"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      setIsSearchOpen(!isSearchOpen); // Use direct variable instead of functional update
                    }}
                  >
                    <MagnifyingGlass size={24} color="black" />
                  </div>
                  <div className="user-icon flex cursor-pointer items-center justify-center">
                    <User size={24} color="black" onClick={handleLoginPopup} />
                    <div
                      className={`login-popup box-shadow-sm absolute top-[74px] w-[320px] rounded-xl bg-white p-7 ${openLoginPopup ? "open" : ""}`}
                    >
                      {isAuthenticated ? (
                        <Link
                          href={"/signout"}
                          className="duration-400 md:text-md hover:bg-green inline-block w-full cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                        >
                          Sign Out
                        </Link>
                      ) : (
                        <Link
                          href={"/login"}
                          className="duration-400 md:text-md hover:bg-green inline-block w-full cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                        >
                          Login
                        </Link>
                      )}
                      {!isAuthenticated ? (
                        <div className="mt-3 pb-4 text-center text-secondary">
                          Don&apos;t have an account?
                          <Link
                            href={"/register"}
                            className="pl-1 text-black hover:underline"
                          >
                            Register
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-3"></div>
                      )}
                      <Link
                        href={"/my-account"}
                        className="button-main w-full border border-black bg-white text-center text-black"
                      >
                        Dashboard
                      </Link>
                    </div>
                  </div>
                  {isAuthenticated && (
                    <div
                      className="wishlist-icon flex cursor-pointer items-center max-md:hidden"
                      onClick={openModalWishlist}
                    >
                      <Heart size={24} color="black" />
                    </div>
                  )}
                  <div
                    className="cart-icon relative flex cursor-pointer items-center"
                    onClick={openModalCart}
                  >
                    <Handbag size={24} color="black" />
                    <span className="quantity cart-quantity absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-xs text-white hover:bg-black/75">
                      {cartArray.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for mobile sticky header */}
      <div className="max-lg:block lg:hidden" style={{ height: 56 }}></div>

      {/* Category navbar - can be sticky */}
      <div
        className={`${
          isSticky ? "fixed top-0 animate-slideDown shadow-lg" : "relative"
        } z-30 w-full border-y border-gray-100 bg-white transition-all duration-300 max-lg:hidden`}
      >
        <div className="mx-auto h-full w-full !max-w-[1322px]">
          <div className="flex h-full items-center justify-between">
            {/* Category navigation menu - left side */}
            <div className="left flex h-full items-center">
              {/* All Products link */}
              <div className="group relative h-full">
                <Link
                  href="/products"
                  className="relative flex h-full items-center px-4 text-sm font-medium text-gray-700 transition-colors hover:text-brand-primary"
                >
                  <span className="py-3.5">All Products</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-primary transition-all duration-300 ease-in-out group-hover:w-full"></span>
                </Link>
              </div>
              {categories?.map(
                (
                  category: {
                    id: Key | null | undefined;
                    name: string;
                    subcategories: {
                      id: Key | null | undefined;
                      name: string;
                      subcategories: {
                        id: Key | null | undefined;
                        name: string;
                      }[];
                    }[];
                  },
                  idx: number,
                ) => (
                  <div key={category.id} className="group relative h-full">
                    <Link
                      href={`/products?category=${category.id}`}
                      className="relative flex h-full items-center px-4 text-sm font-medium text-gray-700 transition-colors hover:text-brand-primary"
                    >
                      <span className="py-3.5">
                        {toTitleCase(category.name)}
                        {category.subcategories?.length > 0 && (
                          <CaretDown className="ml-1 inline-block h-3 w-3 transform text-brand-primary transition-transform duration-200 group-hover:rotate-180" />
                        )}
                      </span>
                      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-primary transition-all duration-300 ease-in-out group-hover:w-full"></span>
                    </Link>
                    {/* Category dropdown */}
                    {category.subcategories?.length > 0 && (
                      <div className="submenu absolute left-0 top-[calc(100%-1px)] z-50 hidden min-w-[240px] rounded-b-md border border-gray-100 bg-white py-2 opacity-0 shadow-lg transition-opacity duration-300 group-hover:block group-hover:opacity-100">
                        {/* Add invisible bridge element to prevent hover gap issues */}
                        <div className="absolute -top-2 left-0 h-2 w-full"></div>
                        {category.subcategories.map(
                          (
                            subcat: {
                              id: Key | null | undefined;
                              name: string;
                              subcategories: {
                                id: Key | null | undefined;
                                name: string;
                              }[];
                            },
                            subIdx: number,
                          ) => (
                            <div key={subcat.id} className="group/sub relative">
                              <Link
                                href={`/products?category=${subcat.id}`}
                                className="flex w-full items-center justify-between whitespace-nowrap px-5 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-primary"
                              >
                                {toTitleCase(subcat.name)}
                                {subcat.subcategories?.length > 0 && (
                                  <span className="ml-1 text-brand-primary">
                                    ›
                                  </span>
                                )}
                              </Link>

                              {subcat.subcategories?.length > 0 && (
                                <div className="nested-submenu absolute left-full top-0 z-50 hidden min-w-[220px] rounded-md border border-gray-100 bg-white py-2 opacity-0 shadow-lg transition-all duration-200 group-hover/sub:block group-hover/sub:opacity-100">
                                  {subcat.subcategories.map(
                                    (
                                      childCat: {
                                        id: Key | null | undefined;
                                        name: string;
                                      },
                                      childIdx: number,
                                    ) => (
                                      <Link
                                        key={childCat.id}
                                        href={`/products?category=${childCat.id}`}
                                        className="block whitespace-nowrap px-5 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-primary"
                                      >
                                        {toTitleCase(childCat.name)}
                                      </Link>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>

            {/* Hotline - right side */}
            <div className="right mr-3 flex items-center gap-2 border-l border-gray-100 pl-4">
              <div className="text-sm text-gray-500">Hotline:</div>
              <div className="text-sm font-semibold transition-colors hover:text-brand-primary">
                +8801824443227
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add placeholder height when navbar is sticky to prevent content jump */}
      {isSticky && <div className="h-[46px] max-lg:hidden"></div>}

      {/* Mobile Search Input - appears below header when search icon is clicked */}
      {isSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="mobile-search-container w-full border-b border-gray-200 bg-white p-3 shadow-sm lg:hidden"
        >
          <div className="relative flex h-10 w-full items-center">
            <input
              type="text"
              className="h-full w-full rounded-l-md border border-r-0 border-gray-300 px-3 text-sm focus:border-gray-400 focus:outline-none"
              placeholder="Search products..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSearch(searchKeyword)
              }
              autoFocus
            />
            {searchKeyword.length > 0 && (
              <button
                className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black"
                onClick={() => {
                  setSearchKeyword("");
                  setShowSearchResults(false);
                }}
                aria-label="Clear search"
                type="button"
              >
                ✕
              </button>
            )}
            <button
              className="h-full rounded-r-md bg-black px-4 text-white hover:bg-black/75"
              onClick={() => handleSearch(searchKeyword)}
            >
              <MagnifyingGlass size={18} />
            </button>
            <button
              className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-gray-500"
              onClick={() => setIsSearchOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Mobile Search Results */}
          {showSearchResults && searchKeyword.length > 1 && (
            <div className="search-results absolute left-0 right-0 z-50 mt-1 max-h-[400px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="px-4 py-2 text-sm font-medium text-gray-900">
                {isSearchLoading ? "Searching..." : "Search Results"}
              </div>

              {/* Loading spinner */}
              {isSearchLoading ? (
                <div className="flex h-24 w-full items-center justify-center">
                  <SpinnerGap size={24} className="animate-spin text-black" />
                </div>
              ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
                <>
                  <div className="max-h-[350px] overflow-y-auto">
                    {searchResults.map((product, idx) => {
                      if (
                        typeof product === "object" &&
                        product !== null &&
                        "id" in product &&
                        "title" in product &&
                        "slug" in product &&
                        "images" in product &&
                        Array.isArray(product.images)
                      ) {
                        return (
                          <div
                            key={product.id}
                            className="search-result-item cursor-pointer border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
                            onClick={() => {
                              router.push(`/products/${product.slug}`);
                              setShowSearchResults(false);
                              setSearchKeyword("");
                              setIsSearchOpen(false);
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
                                    <span className="text-black">
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
                    onClick={() => {
                      handleSearch(searchKeyword);
                      setIsSearchOpen(false);
                    }}
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
      )}

      {/* Mobile Menu Component */}
      <MobileMenu
        openMenuMobile={openMenuMobile}
        handleMenuMobile={handleMenuMobile}
      />
    </>
  );
}
