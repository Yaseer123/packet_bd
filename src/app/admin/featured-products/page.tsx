"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Loader2, MoreHorizontal, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { formatPrice } from "../../../utils/format";

type FeaturedProduct = RouterOutputs["product"]["getFeaturedProducts"][number];

const SortableRow = ({
  product,
  onRemove,
}: {
  product: FeaturedProduct;
  onRemove: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell
        {...listeners}
        style={{ cursor: "grab", width: 32, textAlign: "center" }}
      >
        <MoreHorizontal className="text-gray-400" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-md">
            <Image
              src={product.images[0] ?? "/placeholder.png"}
              alt={product.title}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium">{product.title}</p>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>{formatPrice(product.price)}</TableCell>
      <TableCell>
        <Badge
          variant={
            product.stockStatus === "IN_STOCK"
              ? "success"
              : product.stockStatus === "OUT_OF_STOCK"
                ? "destructive"
                : "outline"
          }
        >
          {product.stockStatus.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell>{`${product.category?.name ?? "Uncategorized"}`}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/admin/product/edit/${product.id}`}>
                Edit product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRemove(product.id)}>
              Remove from featured
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.slug}`} target="_blank">
                View on site
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function FeaturedProductsPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [search, setSearch] = React.useState("");
  const [dragItems, setDragItems] = React.useState<FeaturedProduct[]>();

  const { data: featuredProducts, isLoading } =
    api.product.getFeaturedProducts.useQuery({ limit: 100 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filteredProducts = React.useMemo(() => {
    if (!featuredProducts) return [];
    const base = dragItems ?? featuredProducts;
    if (!search.trim()) return base;
    return base.filter(
      (product: FeaturedProduct) =>
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()),
    );
  }, [featuredProducts, search, dragItems]);

  const updatePositions = api.product.updateProductPositions.useMutation({
    onSuccess: () => {
      void utils.product.getFeaturedProducts.invalidate();
    },
  });

  const updateFeatureMutation = api.product.updateFeaturedStatus.useMutation({
    onSuccess: () => {
      void utils.product.getFeaturedProducts.invalidate();
    },
  });

  const handleRemoveFromFeatured = (productId: string) => {
    updateFeatureMutation.mutate({
      id: productId,
      featured: false,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!featuredProducts || !over) return;

    if (active.id !== over.id) {
      const oldIndex = featuredProducts.findIndex(
        (item: FeaturedProduct) => item.id === active.id,
      );
      const newIndex = featuredProducts.findIndex(
        (item: FeaturedProduct) => item.id === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(featuredProducts, oldIndex, newIndex);
      setDragItems(newItems);

      updatePositions.mutate({
        positions: newItems.map((item, idx) => ({
          id: item.id,
          position: idx,
        })),
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-6 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Featured Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your featured products displayed on the homepage
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/product")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> All Products
        </Button>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Featured Products ({filteredProducts.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => router.push("/admin/product")} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Featured
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-96 w-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-96 w-full flex-col items-center justify-center gap-2">
              <Star className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {search
                  ? "No products match your search"
                  : "No featured products found"}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/product")}
                className="mt-2"
              >
                Add Featured Products
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredProducts.map(
                    (item: FeaturedProduct) => item.id,
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: 32 }}></TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: FeaturedProduct) => (
                        <SortableRow
                          key={product.id}
                          product={product}
                          onRemove={handleRemoveFromFeatured}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
