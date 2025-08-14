"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function HomeScrollBehavior() {
  const pathname = usePathname();

  useEffect(() => {
    // Only scroll to Featured Products if we're on the homepage
    if (pathname === "/") {
      // Function to scroll to Featured Products title
      const scrollToFeaturedProducts = () => {
        const featuredProductsTitle = document.querySelector(
          "#featured-products h2",
        );
        if (featuredProductsTitle) {
          // Get the element's position and add some offset to ensure the heading is visible
          const elementTop =
            featuredProductsTitle.getBoundingClientRect().top +
            window.pageYOffset;
          const offset = 100; // Add some space above the title

          window.scrollTo({
            top: elementTop - offset,
            behavior: "smooth",
          });
          return true; // Successfully scrolled
        }
        return false; // Element not found
      };

      // Wait for DOM to be ready and then try to scroll
      const waitForElement = () => {
        // Try to scroll immediately
        if (scrollToFeaturedProducts()) {
          return; // Successfully scrolled
        }

        // If element not found, try again after a short delay
        const retryTimer = setTimeout(() => {
          if (scrollToFeaturedProducts()) {
            return; // Successfully scrolled
          }

          // If still not found, try one more time
          const finalTimer = setTimeout(() => {
            scrollToFeaturedProducts();
          }, 500);

          return () => clearTimeout(finalTimer);
        }, 500);

        return () => clearTimeout(retryTimer);
      };

      // Add a delay to ensure the page is fully loaded
      const timer = setTimeout(waitForElement, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // This component doesn't render anything visible
  return null;
}
