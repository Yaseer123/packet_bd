"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { CheckSquare, GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function Register() {
  const breadcrumbItems = [
    { label: <HomeIcon size={16} />, href: "/" },
    { label: "Register", href: "/register" },
  ];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        function hasErrorProp(obj: unknown): obj is { error: string } {
          return (
            typeof obj === "object" &&
            obj !== null &&
            "error" in obj &&
            typeof (obj as { error: unknown }).error === "string"
          );
        }
        if (hasErrorProp(data)) {
          setError(data.error);
        } else {
          setError("Registration failed");
        }
      } else {
        setSuccess("Registration successful! You can now log in.");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Create An Account" />
      </div>
      <div className="py-10 md:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-4">
          <div className="flex gap-y-8 max-md:flex-col">
            <div className="left w-full border-[#ddd] focus:border-[#ddd] md:w-1/2 md:border-r md:pr-[40px] lg:pr-[60px]">
              <div className="text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                Register
              </div>
              <form className="mt-4 md:mt-7" onSubmit={handleSubmit}>
                <Link href="/api/auth/signin">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-white hover:bg-black/75"
                  >
                    <GoogleLogo weight="bold" />
                    <span>Login with Google</span>
                  </button>
                </Link>
                <div className="relative my-5 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border-border">
                  <span className="relative z-30 bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
                <div className="email">
                  <input
                    className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                    id="username"
                    type="email"
                    placeholder="Email address *"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="pass mt-5">
                  <input
                    className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                    id="password"
                    type="password"
                    placeholder="Password *"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="mt-5">
                  <input
                    className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm Password *"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="mt-5">
                  <input
                    className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                    id="name"
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="mt-5 flex items-center">
                  <div className="block-input">
                    <input type="checkbox" name="remember" id="remember" />
                    <CheckSquare
                      size={20}
                      weight="fill"
                      className="icon-checkbox"
                    />
                  </div>
                  <label
                    htmlFor="remember"
                    className="text-secondary2 cursor-pointer pl-2"
                  >
                    I agree to the
                    <Link
                      href={"#!"}
                      className="pl-1 text-black hover:underline"
                    >
                      Terms of User
                    </Link>
                  </label>
                </div>
                {error && <div className="mt-2 text-red-500">{error}</div>}
                {success && (
                  <div className="mt-2 text-green-600">{success}</div>
                )}
                <div className="mt-4 md:mt-7">
                  <button
                    className="duration-400 md:text-md hover:bg-green inline-block cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
            </div>
            <div className="right flex w-full items-center md:w-1/2 md:pl-[40px] lg:pl-[60px]">
              <div className="text-content">
                <div className="text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                  Already have an account?
                </div>
                <div className="mt-2 text-secondary">
                  Welcome back. Sign in to access your personalized experience,
                  saved preferences, and more. We{"'"}re thrilled to have you
                  with us again!
                </div>
                <div className="mt-4 md:mt-7">
                  <Link
                    href={"/login"}
                    className="duration-400 md:text-md hover:bg-green inline-block cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
