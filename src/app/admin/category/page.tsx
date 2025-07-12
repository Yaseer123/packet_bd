export const dynamic = "force-dynamic";
import AddCategoryForm from "@/components/admin-components/AddCategory";
import CategoryAccordionManager from "@/components/admin-components/CategoryAccordionManager";

export default function Categories() {
  return (
    <div className="flex min-h-[80vh] flex-wrap items-start justify-center gap-x-10 gap-y-5 p-10">
      <CategoryAccordionManager />
      <AddCategoryForm />
    </div>
  );
}
