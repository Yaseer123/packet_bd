"use client";

import { DataTableColumnHeader } from "@/components/admin-components/DataTableColumnHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import type { Category, Product } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { formatPrice } from "../../../utils/format";
import { FeaturedProductModal } from "./FeaturedProductModal";
import { StockStatusModal } from "./StockStatusModal";

// Create a separate component for the actions cell
function ActionCell({ product }: { product: ProductColumns }) {
  const [isStockModalOpen, setIsStockModalOpen] = React.useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const utils = api.useUtils();

  const deleteProduct = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted", {
        description: `The product "${product.title}" was successfully deleted.`,
      });
      void utils.product.getAll.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Error", {
        description: `Failed to delete product: ${error.message}`,
      });
    },
  });

  const handleDelete = () => {
    deleteProduct.mutate({ id: product.id });
    setIsDeleteAlertOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={async () =>
              await navigator.clipboard.writeText(product.id)
            }
          >
            Copy product ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsStockModalOpen(true)}>
            Change Stock Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsFeaturedModalOpen(true)}>
            {product.featured ? "Remove from Featured" : "Add to Featured"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={`/admin/product/edit/${product.id}`}>Edit product</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteAlertOpen(true)}
            className="text-red-600"
          >
            Delete product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StockStatusModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        productId={product.id}
        currentStatus={product.stockStatus}
      />

      <FeaturedProductModal
        isOpen={isFeaturedModalOpen}
        onClose={() => setIsFeaturedModalOpen(false)}
        productId={product.id}
        currentFeaturedStatus={product.featured}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product &quot;{product.title}&quot; and remove it from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/90 hover:bg-red-500/100"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Create a separate component for the stock status cell
function StockStatusCell({ product }: { product: ProductColumns }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const status = product.stockStatus;

  // Define styles based on status
  let badgeStyle = {};
  let dotStyle = {};
  let label = "Unknown";

  if (status === "IN_STOCK") {
    badgeStyle = {
      backgroundColor: "rgba(220, 252, 231, 1)", // light green
      color: "rgba(22, 101, 52, 1)", // dark green
    };
    dotStyle = { backgroundColor: "rgba(34, 197, 94, 1)" }; // green-500
    label = "In Stock";
  } else if (status === "OUT_OF_STOCK") {
    badgeStyle = {
      backgroundColor: "rgba(254, 226, 226, 1)", // light red
      color: "rgba(153, 27, 27, 1)", // dark red
    };
    dotStyle = { backgroundColor: "rgba(239, 68, 68, 1)" }; // red-500
    label = "Out of Stock";
  } else if (status === "PRE_ORDER") {
    badgeStyle = {
      backgroundColor: "rgba(219, 234, 254, 1)", // light blue
      color: "rgba(30, 64, 175, 1)", // dark blue
    };
    dotStyle = { backgroundColor: "rgba(59, 130, 246, 1)" }; // blue-500
    label = "Pre Order";
  }

  const badgeContainerStyle = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "9999px",
    padding: "0.125rem 0.625rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
    ...badgeStyle,
  };

  const dotContainerStyle = {
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "9999px",
    marginRight: "0.25rem",
    ...dotStyle,
  };

  return (
    <>
      <div
        style={badgeContainerStyle}
        onClick={() => setIsModalOpen(true)}
        className="transition-opacity hover:opacity-80"
      >
        <span style={dotContainerStyle}></span>
        {label}
      </div>

      <StockStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={product.id}
        currentStatus={product.stockStatus}
      />
    </>
  );
}

// Create a separate component for the featured status cell
function FeaturedStatusCell({ product }: { product: ProductColumns }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const featured = product.featured;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer transition-opacity hover:opacity-80"
      >
        {featured ? (
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Featured
          </div>
        ) : (
          <div className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
            Not Featured
          </div>
        )}
      </div>

      <FeaturedProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={product.id}
        currentFeaturedStatus={product.featured}
      />
    </>
  );
}

export interface ProductColumns extends Product {
  category: Category | null;
}

export const DRAG_HANDLE_ID = "drag-handle";

export const columns: ColumnDef<ProductColumns>[] = [
  {
    id: DRAG_HANDLE_ID,
    header: () => null,
    cell: () => (
      <span
        style={{ cursor: "grab", display: "flex", justifyContent: "center" }}
      >
        <MoreHorizontal className="text-gray-400" />
      </span>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
    minSize: 32,
    maxSize: 32,
  },
  {
    id: "thumbnail",
    header: () => <span className="min-w-[56px]">Thumbnail</span>,
    cell: ({ row }) => {
      const images = row.original.images;
      const title = row.original.title;
      return (
        <div className="h-12 w-12 overflow-hidden rounded-md">
          <Image
            src={
              Array.isArray(images) && images[0]
                ? images[0]
                : "/images/product/1000x1000.png"
            }
            alt={title}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 56,
    minSize: 56,
    maxSize: 56,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title="Price"
          className="min-w-[100px] text-right"
        />
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return (
        <div className="min-w-[100px] text-right font-medium">
          {formatPrice(price)}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: () => <span className="min-w-[140px]">Category</span>,
    accessorFn: (row: { category: { name?: string } | null }) =>
      typeof row.category === "object" &&
      row.category !== null &&
      "name" in row.category
        ? ((row.category as { name?: string }).name ?? "No Category")
        : "No Category",
    cell: ({ row }) => {
      const cat = row.original.category;
      return (
        <div className="min-w-[140px]">
          {cat && typeof cat === "object" && typeof cat.name === "string"
            ? cat.name
            : "No Category"}
        </div>
      );
    },
  },
  {
    accessorKey: "stockStatus",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Stock Status" />;
    },
    cell: ({ row }) => {
      const product = row.original;
      return <StockStatusCell product={product} />;
    },
  },
  {
    accessorKey: "featured",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Featured" />;
    },
    cell: ({ row }) => {
      const product = row.original;
      return <FeaturedStatusCell product={product} />;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;
      return <ActionCell product={product} />;
    },
  },
];
