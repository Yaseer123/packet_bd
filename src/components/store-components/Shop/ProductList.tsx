import React from "react";
import Product from "../Product/Product";
import HandlePagination from "../HandlePagination";
import type { ProductWithCategory } from "@/types/ProductType";

interface ProductListProps {
  data: Array<ProductWithCategory>;
  layoutCol: number | null;
  pageCount: number;
  handlePageChange: (selected: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  data,
  layoutCol,
  pageCount,
  handlePageChange,
}) => {
  return (
    <>
      <div
        className={`list-product hide-product-sold grid lg:grid-cols-${layoutCol} md:gird-cols-3 mt-7 grid-cols-1 gap-[10px] sm:grid-cols-2 sm:gap-[20px]`}
      >
        {data.map((item) =>
          item.id === "no-data" ? (
            <div key={item.id} className="no-data-product">
              No products match the selected criteria.
            </div>
          ) : (
            <Product key={item.id} data={item} />
          ),
        )}
      </div>

      {pageCount > 1 && (
        <div className="list-pagination mt-7 flex items-center justify-center md:mt-10">
          <HandlePagination
            pageCount={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default ProductList;
