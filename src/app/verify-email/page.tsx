"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        setStatus("success");
        setMessage(
          "Your email has been verified! You can now log in and use all features.",
        );
      } else {
        setStatus("error");
        setMessage(data.error ?? "Verification failed.");
      }
    }
    void verify();
  }, [token]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Email Verification</h1>
        {status === "loading" && <p>Verifying your email...</p>}
        {status !== "loading" && <p>{message}</p>}
        {status === "success" && (
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
