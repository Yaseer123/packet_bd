"use client";

import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

export default function Navbar() {
  const session = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/admin/user", label: "Users" },
    { href: "/admin/category", label: "Categories" },
    { href: "/admin/product", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/blog", label: "Blogs" },
    { href: "/admin/slider", label: "Slider" },
    { href: "/admin/faq", label: "FAQ" },
    { href: "/admin/questions", label: "Questions" },
  ];

  return (
    <div className="relative">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-7 py-3 shadow-md">
        <Link
          href="/admin"
          className="text-xl font-extrabold tracking-tight text-gray-900"
        >
          Admin Panel
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-x-2 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
              className={`rounded-lg px-4 py-2 font-medium transition-colors duration-200 ${pathname.startsWith(link.href) ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}

          {session && (
            <Button asChild variant="outline" className="ml-2">
              <Link href="/signout">Sign out</Link>
            </Button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          ref={menuButtonRef}
          className="p-2 md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white px-5 py-3 shadow-md md:hidden"
        >
          <div className="flex flex-col gap-y-2">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                className={`w-full justify-start rounded-lg px-4 py-2 font-medium transition-colors duration-200 ${pathname.startsWith(link.href) ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}

            {session && (
              <Button
                asChild
                variant="outline"
                className="mt-2 w-full justify-start"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href="/signout">Sign out</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
