import { useCallback, useEffect, useState } from "react";

const useMenuMobile = () => {
  const [openMenuMobile, setOpenMenuMobile] = useState(false);

  const handleMenuMobile = () => {
    console.log("Toggling Menu:", !openMenuMobile);
    setOpenMenuMobile((prevState) => !prevState);
  };

  const handleClickOutsideMenuMobile = useCallback((event: Event) => {
    // Use composedPath for better event path detection
    const path = event.composedPath?.() || [];
    const isInsideMenu = path.some((el) => {
      if (el instanceof Element) {
        return (
          el.id === "menu-mobile" || el.classList?.contains("menu-mobile-icon")
        );
      }
      return false;
    });
    if (!isInsideMenu) {
      setOpenMenuMobile(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutsideMenuMobile);
    return () => {
      document.removeEventListener("click", handleClickOutsideMenuMobile);
    };
  }, [handleClickOutsideMenuMobile]);

  useEffect(() => {
    console.log("Menu Open State:", openMenuMobile);
  }, [openMenuMobile]);

  return { openMenuMobile, handleMenuMobile };
};

export default useMenuMobile;
