import React from "react";

import { api } from "@/trpc/server";
import NewsInsightItem from "./NewsInsightItem";

interface Props {
  start: number;
  limit: number;
}
export default async function NewsInsight({ start, limit }: Props) {
  const blogData = await api.post.getAllPretty();

  if (blogData.length === 0) return null;
  return (
    <>
      <div className="news-block px-4 py-6 sm:py-8 md:pt-20">
        <div className="mx-auto w-full !max-w-[1322px] px-2 sm:px-4">
          <div className="text-center text-2xl font-semibold capitalize leading-tight sm:text-[28px] md:text-[30px] lg:text-[36px] lg:leading-[40px]">
            News insight
          </div>
          <div className="list-blog mt-4 grid grid-cols-1 gap-5 sm:mt-6 sm:grid-cols-2 sm:gap-6 md:mt-10 md:grid-cols-3 md:gap-[30px]">
            {blogData.slice(start, limit).map((prd, index) => (
              <NewsInsightItem key={index} data={prd} type="style-one" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
