"use client";

import { type BlogType } from "@/types/BlogType";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface BlogProps {
  data: BlogType;
}

const BlogItem: React.FC<BlogProps> = ({ data }) => {
  const router = useRouter();
  const handleBlogClick = (blogId: string, slug: string) => {
    // Go to blog detail with blogId selected
    router.push(`/blog/${slug}?id=${blogId}`);
  };

  return (
    <div
      className="blog-item style-list h-full cursor-pointer"
      onClick={() => handleBlogClick(data.id, data.slug)}
    >
      <div className="blog-main flex h-full gap-6 max-md:flex-col md:items-center md:gap-9">
        <div className="blog-thumb w-full flex-shrink-0 overflow-hidden rounded-[20px] md:w-1/2">
          <Image
            src={data.coverImageUrl}
            width={2000}
            height={1500}
            alt="blog-img"
            className="w-full flex-shrink-0 duration-500"
          />
        </div>
        <div>
          <div className="blog-tag bg-green inline-block rounded-full px-2.5 py-1 text-sm font-semibold uppercase leading-5 md:text-xs md:leading-4">
            {data.tags.map((tag) => tag.name).join(", ")}
          </div>
          <div className="heading6 blog-title mt-3 duration-300">
            {data.title}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="blog-author text-base font-normal leading-[22] text-secondary md:text-[13px] md:leading-5">
              by {data.createdBy.name}
            </div>
            <span className="h-[1px] w-[20px] bg-black hover:bg-black/75"></span>
            <div className="blog-date text-base font-normal leading-[22] text-secondary md:text-[13px] md:leading-5">
              {" "}
              {new Date(data.updatedAt)
                .toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                .toUpperCase()}
            </div>
          </div>
          <div className="mt-4 text-lg font-normal text-secondary">
            {data.shortDescription}
          </div>
          <div className="mt-4 text-base font-semibold capitalize leading-[26px] underline md:text-base md:leading-6">
            Read More
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogItem;
