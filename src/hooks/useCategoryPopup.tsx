"use client";
import { useState, useEffect, useCallback } from "react";
export default function useCategoryPopup() {
  const [openCategoryPopup, setOpenCategoryPopup] = useState(false);

  const handleCategoryPopup = () => {
    setOpenCategoryPopup((prevState) => !prevState);
  };

  const handleClickOutsideCategoryPopup = useCallback(
    (event: Event) => {
      const targetElement = event.target as Element;
      if (openCategoryPopup && !targetElement.closest(".category-popup")) {
        setOpenCategoryPopup(false);
      }
    },
    [openCategoryPopup],
  );

  useEffect(() => {
    document.addEventListener("click", handleClickOutsideCategoryPopup);
    return () => {
      document.removeEventListener("click", handleClickOutsideCategoryPopup);
    };
  }, [handleClickOutsideCategoryPopup]);

  return {
    openCategoryPopup,
    handleCategoryPopup,
  };
}
