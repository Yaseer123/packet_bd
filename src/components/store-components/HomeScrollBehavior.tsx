"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function HomeScrollBehavior() {
  const pathname = usePathname();

  useEffect(() => {
    // Only scroll to Featured Products if we're on the homepage and not coming from the same page
    if (pathname === "/") {
      // Add a small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        const featuredProductsSection =
          document.getElementById("featured-products");
        if (featuredProductsSection) {
          // Get the element's position and add some offset to ensure the heading is visible
          const elementTop = featuredProductsSection.offsetTop;
          const offset = 80; // Add some space above the section

          window.scrollTo({
            top: elementTop - offset,
            behavior: "smooth",
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // This component doesn't render anything visible
  return null;
}
