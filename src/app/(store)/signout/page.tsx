"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignoutPage() {
  const searchParams = useSearchParams();
  const done = searchParams.get("done");

  useEffect(() => {
    if (!done) {
      // Actually sign out, then redirect back to this page with ?done=1
      void signOut({ callbackUrl: "/signout?done=1" });
    }
  }, [done]);

  if (!done) {
    // Optionally, show a loading spinner or nothing while signing out
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4">
        <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-white p-8 shadow-md">
          <svg
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 24 24"
            className="mb-4 animate-spin text-gray-400"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.2"
            />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-center text-gray-500">Signing you out...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-white p-8 shadow-md">
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
          className="mb-4 text-green-600"
        >
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 14.59L8.7 12.3a1 1 0 1 1 1.41-1.41l1.89 1.88 3.89-3.88a1 1 0 1 1 1.41 1.41l-4.59 4.59Z"
          />
        </svg>
        <h1 className="mb-2 text-center text-2xl font-bold">
          You have been signed out
        </h1>
        <p className="mb-6 text-center text-gray-600">
          Thank you for visiting. You have successfully signed out of your
          account.
        </p>
        <div className="flex w-full flex-col gap-3">
          <Button asChild variant="black" className="w-full">
            <Link href="/login">Sign in again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
