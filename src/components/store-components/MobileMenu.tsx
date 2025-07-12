import { api } from "@/trpc/react";
import { CaretDown, CaretRight, X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaXTwitter } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import MobileSearch from "./MobileSearch";

interface MobileMenuProps {
  openMenuMobile: boolean;
  handleMenuMobile: () => void;
}

const MobileMenu = ({ openMenuMobile, handleMenuMobile }: MobileMenuProps) => {
  const router = useRouter();
  const [categories] = api.category.getAll.useSuspenseQuery();
  const [productsExpanded, setProductsExpanded] = useState(true);

  // Function to handle navigation and close menu
  const handleNavigation = (path: string) => {
    handleMenuMobile(); // First close the menu
    router.push(path); // Then navigate to the path
  };

  // Only top-level categories (no subcategories)
  const topCategories = categories.filter((cat) => !cat.parentId);

  return (
    <div id="menu-mobile" className={`${openMenuMobile ? "open" : ""}`}>
      <div className="menu-w-full mx-auto h-full !max-w-[1322px] bg-white px-4">
        <div className="mx-auto h-full w-full !max-w-[1322px] px-4">
          <div className="menu-main h-full overflow-hidden">
            <div className="heading relative flex items-center justify-center py-2">
              <div
                className="close-menu-mobile-btn bg-surface absolute left-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full"
                onClick={handleMenuMobile}
              >
                <X size={14} />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation("/");
                }}
                className="logo cursor-pointer text-center"
              >
                <Image
                  src="/images/brand/RINORS.png"
                  alt="Rinors"
                  width={120}
                  height={40}
                  priority
                  className="mx-auto h-auto w-[120px] object-contain"
                />
              </div>
            </div>
            <MobileSearch />

            <div className="list-nav mt-6">
              <ul>
                <li>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("/products");
                    }}
                    className="mt-5 flex cursor-pointer items-center justify-between text-xl font-semibold"
                  >
                    All Products
                  </div>
                </li>

                <li>
                  <div
                    className="mt-5 flex cursor-pointer items-center justify-between text-xl font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductsExpanded((prev) => !prev);
                    }}
                  >
                    Categories
                    <span className="text-right">
                      {productsExpanded ? (
                        <CaretDown size={20} />
                      ) : (
                        <CaretRight size={20} />
                      )}
                    </span>
                  </div>
                  {productsExpanded && (
                    <ul className="mt-2 pl-4">
                      {topCategories.map((cat) => (
                        <li key={cat.id} className="mb-1">
                          <Link
                            href={`/products?category=${cat.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuMobile();
                            }}
                            className="block py-1 text-base text-gray-700 hover:text-brand-primary"
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                <li>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("/blog");
                    }}
                    className="mt-5 flex cursor-pointer items-center justify-between text-xl font-semibold"
                  >
                    Blog
                  </div>
                </li>
                <li>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("/about");
                    }}
                    className="mt-5 flex cursor-pointer items-center justify-between text-xl font-semibold"
                  >
                    About Us
                  </div>
                </li>
                <li>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("/faqs");
                    }}
                    className="mt-5 flex cursor-pointer items-center justify-between text-xl font-semibold"
                  >
                    FAQ
                  </div>
                </li>
                <li>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation("/contact");
                    }}
                    className="mt-5 flex cursor-pointer items-center justify-between text-xl font-semibold"
                  >
                    Contact Us
                  </div>
                  <div className="list-social mt-4 flex items-center gap-6">
                    <Link
                      href={
                        "https://www.facebook.com/profile.php?id=61572946813700"
                      }
                      target="_blank"
                    >
                      <div className="icon-facebook text-2xl text-black"></div>
                    </Link>
                    <Link
                      href={
                        "https://www.instagram.com/rinors_electronic_store/"
                      }
                      target="_blank"
                    >
                      <div className="icon-instagram text-2xl text-black"></div>
                    </Link>
                    <Link href={"https://x.com/Rinors_Corpor"} target="_blank">
                      <FaXTwitter className="text-xl text-black" />
                    </Link>
                    <Link
                      href={"https://www.tiktok.com/@rinors_ecommerce"}
                      target="_blank"
                    >
                      <SiTiktok className="text-xl text-black" />
                    </Link>
                    <Link
                      href={"https://www.youtube.com/@rinorsecommerce"}
                      target="_blank"
                    >
                      <div className="icon-youtube text-3xl text-black"></div>
                    </Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
