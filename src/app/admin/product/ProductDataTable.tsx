"use client";

import { DataTable } from "@/components/admin-components/DataTable";
import { api } from "@/trpc/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import React, { useCallback } from "react";
import { columns, type ProductColumns } from "./Columns";

export default function ProductDataTable() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search input with a longer delay to prevent interruptions
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 800); // Increased to 800ms for better UX

    return () => clearTimeout(timer);
  }, [search]);

  const { data: productsWithCategory, isLoading } = api.product.getAll.useQuery(
    {
      page,
      limit,
      search: debouncedSearch.trim() ?? undefined,
    },
  );

  const [items, setItems] = React.useState(
    productsWithCategory?.products ?? [],
  );

  React.useEffect(() => {
    if (productsWithCategory?.products) {
      setItems(productsWithCategory.products);
    }
  }, [productsWithCategory?.products]);

  const utils = api.useUtils();
  const updatePositions = api.product.updateProductPositions.useMutation({
    onSuccess: () => {
      void utils.product.getAll.invalidate();
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    updatePositions.mutate({
      positions: newItems.map((item, idx) => ({ id: item.id, position: idx })),
    });
  };

  const mappedData = items.map((product) => ({
    ...product,
    descriptionImageId: product.descriptionImageId ?? null,
  }));

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page when searching
  }, []);

  return (
    <DataTable<ProductColumns>
      columns={columns}
      data={mappedData}
      addButton={{ name: "Add Product", href: "/admin/product/add" }}
      filterBy="title"
      searchPlaceHolder="Filter products by title"
      dragEnabled
      rowIdKey="id"
      onDragEnd={handleDragEnd}
      page={page}
      limit={limit}
      total={productsWithCategory?.total ?? 0}
      onPageChange={handlePageChange}
      onLimitChange={handleLimitChange}
      onSearch={handleSearch}
      searchValue={search}
      isSearching={isLoading && search !== debouncedSearch}
      isLoading={isLoading}
    />
  );
}
