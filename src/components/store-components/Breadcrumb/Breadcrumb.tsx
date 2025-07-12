"use client";

import React from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  pageTitle?: string;
  children?: React.ReactNode;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  pageTitle,
  children,
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-white px-4 py-8 sm:py-10 lg:py-16">
      <div className="container mx-auto max-w-screen-xl">
        <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center">
          <div className="text-content w-full text-center">
            {pageTitle && (
              <h1 className="text-2xl font-semibold capitalize leading-tight sm:text-3xl md:text-4xl lg:text-[32px]">
                {pageTitle}
              </h1>
            )}
            <nav aria-label="Breadcrumb" className="mt-2 md:mt-3">
              <div className="flex flex-wrap items-center justify-center gap-1 text-sm font-normal sm:text-base">
                {items?.map((item, index) => (
                  <React.Fragment key={`breadcrumb-${index}`}>
                    {index > 0 && (
                      <CaretRight
                        size={14}
                        className="text-gray-600 transition-all duration-300 ease-in-out"
                      />
                    )}
                    {index === items.length - 1 ? (
                      <span className="capitalize text-black transition-all duration-300 ease-in-out">
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href ?? "/"}
                        className="capitalize text-gray-700 transition-all duration-300 ease-in-out hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </nav>
          </div>

          {children && (
            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-4 sm:gap-5 md:mt-8 lg:mt-10 lg:gap-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
