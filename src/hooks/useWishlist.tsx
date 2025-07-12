import { useState } from "react";
import { type ProductType } from "@/types/ProductType";

const useWishlist = () => {
  const [wishlist, setWishlist] = useState<ProductType[]>([]);

  // Add a product to wishlist
  const addToWishlist = (product: ProductType) => {
    setWishlist((prevWishlist) => [...prevWishlist, product]);
  };

  // Remove a product from wishlist by ID
  const removeFromWishlist = (productId: string) => {
    setWishlist((prevWishlist) =>
      prevWishlist.filter((item) => item.id !== productId),
    );
  };

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
  };
};

export default useWishlist;
