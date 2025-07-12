export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { HydrateClient } from "@/trpc/server";
import Link from "next/link";
import ProductDataTable from "./ProductDataTable";

export default function EditProductPage() {
  return (
    <HydrateClient>
      <div className="p-4 md:p-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex-1 text-center text-2xl font-semibold">
            Product Information
          </p>
          <Button asChild variant="outline" size="sm" className="ml-4">
            <Link href="/admin/featured-products">Featured Products</Link>
          </Button>
        </div>
        <ProductDataTable />
      </div>
    </HydrateClient>
  );
}
