"use client";

import BlogList from "@/components/store-components/Blog/BlogList";
import BlogSkeleton from "@/components/store-components/Blog/BlogSkeleton";
import RecentPosts from "@/components/store-components/Blog/RecentPosts";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { api } from "@/trpc/react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const BlogsPage = () => {
  const searchParams = useSearchParams();
  const dataCategory = searchParams?.get("category");
  const [category, setCategory] = useState<string | null | undefined>(
    dataCategory,
  );
  const [tags] = api.post.getAllTags.useSuspenseQuery();

  const handleCategory = (category: string) => {
    setCategory((prevCategory) =>
      prevCategory === category ? null : category,
    );
  };

  const breadcrumbItems = [
    { label: <HomeIcon size={16} />, href: "/" },
    { label: "Categories", href: "/categories" },
  ];
  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Blogs" />
      </div>
      <div className="blog list py-10 md:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-4">
          <div className="flex justify-between gap-y-12 max-xl:flex-col">
            <div className="left xl:w-3/4 xl:pr-2">
              <Suspense fallback={<BlogSkeleton />}>
                <BlogList tag={category} />
              </Suspense>
            </div>
            <div className="right xl:w-1/4 xl:pl-[52px]">
              <form className="form-search relative h-12 w-full">
                <input
                  className="h-full w-full rounded-lg border border-[#ddd] px-4 py-2 focus:border-[#ddd]"
                  type="text"
                  placeholder="Search"
                />
                <button type="submit">
                  <MagnifyingGlass className="heading6 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-secondary duration-300" />
                </button>
              </form>
              <Suspense
                fallback={<div className="animate-pulse">Loading...</div>}
              >
                <RecentPosts />
              </Suspense>
              <div className="filter-tags mt-6 md:mt-10">
                <div className="heading6">Tags Cloud</div>
                <div className="list-tags mt-4 flex flex-wrap items-center gap-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`tags cursor-pointer rounded-full border border-[#ddd] bg-white px-4 py-1.5 text-sm font-semibold uppercase leading-5 text-secondary duration-300 hover:bg-black hover:bg-black/75 hover:text-white focus:border-[#ddd] ${
                        category === tag.slug
                          ? "active bg-black text-white hover:bg-black/75"
                          : ""
                      }`}
                      onClick={() => handleCategory(tag.slug)}
                    >
                      {tag.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogsPage;
