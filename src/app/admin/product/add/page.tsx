export const dynamic = "force-dynamic";
import AddProductForm from "@/components/admin-components/AddProduct";

export default function AddProduct() {
  return (
    <div className="min-h-[80vh] w-full p-2 md:flex md:items-center md:justify-center md:p-10">
      <AddProductForm />
    </div>
  );
}
