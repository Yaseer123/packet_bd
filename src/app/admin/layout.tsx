"use client";

import "@/styles/admin-styles.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/admin-components/Navbar";
import AdminRouteGuard from "@/components/admin-components/AdminRouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // Not authenticated, redirect to login
      console.log("No session found, redirecting to login");
      router.push("/login");
      return;
    }

    if (session.user.role !== "ADMIN") {
      // Not admin, redirect to home
      console.log("User is not admin, redirecting to home:", {
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role
      });
      router.push("/");
      return;
    }

    console.log("Admin session verified:", {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role
    });
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="bg-white">
        <Navbar />
        {children}
      </div>
    </AdminRouteGuard>
  );
}
