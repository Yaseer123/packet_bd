import AdminDashboard from "@/components/admin-components/AdminDashboard";
import Link from "next/link";

export default async function AdminPage() {
  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center">
      <AdminDashboard />
      {/* <p className="text-center text-2xl font-semibold">Product Information</p> */}
      <div className="mt-4 flex justify-center">
        <Link
          href="/admin/orders"
          className="hover:bg-black/75/80 rounded bg-black px-4 py-2 text-white transition hover:bg-black hover:bg-black/75"
        >
          Go to Orders Management
        </Link>
      </div>
    </div>
  );
}
