"use client";
import { api } from "@/trpc/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button } from "../ui/button";

interface NewsletterProps {
  variant?: "default" | "footer";
}

export default function Newsletter({ variant = "default" }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const newsletterMutation = api.newsletter.subscribe.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      await newsletterMutation.mutateAsync({ email });
      setSuccess("Thank you for subscribing to our newsletter!");
      setEmail("");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
      ) {
        setError((err as { message: string }).message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      {variant === "default" ? (
        <div className="newsletter-block bg-green bg-green-300 py-7">
          <div className="mx-auto flex w-full !max-w-[1322px] items-center justify-center gap-8 gap-y-4 px-4 max-lg:flex-col lg:justify-between">
            <div className="text-content">
              <div className="text-[36px] font-semibold capitalize leading-[40px] max-lg:text-center md:text-[20px] md:leading-[28px] lg:text-[30px] lg:leading-[38px]">
                Subscribe to our newsletter
              </div>
              <div className="mt-2 max-lg:text-center">
                Sign up for updates, early sale access, promotions and more
              </div>
            </div>
            <div className="input-block h-[52px] w-full sm:w-3/5 md:w-1/2 xl:w-5/12">
              <form className="relative h-full w-full" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Enter your e-mail"
                  className="h-full w-full rounded-xl border border-[#ddd] pl-4 pr-14 focus:border-[#ddd]"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={newsletterMutation.isPending}
                />
                <Button
                  variant="black"
                  className="absolute right-1 top-1 flex h-[44px] w-[100px] items-center justify-center rounded-xl bg-black !text-white"
                  type="submit"
                  disabled={newsletterMutation.isPending}
                >
                  {newsletterMutation.isPending ? "..." : "Subscribe"}
                </Button>
              </form>
              {success && (
                <div className="mt-2 text-sm text-green-800">{success}</div>
              )}
              {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-button-uppercase">Newsletter</div>
          <div className="caption1 mt-3">
            Subscribe to our newsletter for updates and offers
          </div>
          <div className="input-block mt-4 h-[52px] w-full">
            <form className="relative h-full w-full" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter your e-mail"
                className="caption1 h-full w-full rounded-xl border border-[#ddd] pl-4 pr-14 focus:border-[#ddd]"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={newsletterMutation.isPending}
              />
              <button
                className="absolute right-1 top-1 flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-black"
                type="submit"
                disabled={newsletterMutation.isPending}
              >
                <ArrowRight size={24} color="#fff" />
              </button>
            </form>
            {success && (
              <div className="mt-2 text-sm text-green-800">{success}</div>
            )}
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>
        </>
      )}
    </>
  );
}
