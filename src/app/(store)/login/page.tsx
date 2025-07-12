"use client";

import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { CheckSquare, GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const Login = () => {
  const breadcrumbItems = [
    { label: <HomeIcon size={16} />, href: "/" },
    { label: "Login", href: "/login" },
  ];
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: redirect,
    });
    if (res?.error) {
      setError("Invalid email or password");
    } else if (res?.ok) {
      window.location.href = redirect;
    }
    setLoading(false);
  };

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Login" />
      </div>
      <div className="py-10 md:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-4">
          <div className="flex gap-y-8 max-md:flex-col">
            <div className="left w-full border-[#ddd] focus:border-[#ddd] md:w-1/2 md:border-r md:pr-[40px] lg:pr-[60px]">
              <div className="text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                Login
              </div>
              <form className="mt-4 md:mt-7" onSubmit={handleSubmit}>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-white hover:bg-black/75"
                  onClick={() => signIn("google", { callbackUrl: redirect })}
                >
                  <GoogleLogo weight="bold" />
                  <span>Login with Google</span>
                </button>
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
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="block-input">
                      <input type="checkbox" name="remember" id="remember" />
                      <CheckSquare
                        size={20}
                        weight="fill"
                        className="icon-checkbox"
                      />
                    </div>
                    <label htmlFor="remember" className="cursor-pointer pl-2">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href={"/forgot-password"}
                    className="font-semibold hover:underline"
                  >
                    Forgot Your Password?
                  </Link>
                </div>
                {error && <div className="mt-2 text-red-500">{error}</div>}
                <div className="mt-4 md:mt-7">
                  <button
                    className="duration-400 md:text-md hover:bg-green inline-block cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </div>
              </form>
            </div>
            <div className="right flex w-full items-center md:w-1/2 md:pl-[40px] lg:pl-[60px]">
              <div className="text-content">
                <div className="text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                  New Customer
                </div>
                <div className="mt-2 text-secondary">
                  Be part of our growing family of new customers! Join us today
                  and unlock a world of exclusive benefits, offers, and
                  personalized experiences.
                </div>
                <div className="mt-4 md:mt-7">
                  <Link
                    href={"/register"}
                    className="duration-400 md:text-md hover:bg-green inline-block cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
