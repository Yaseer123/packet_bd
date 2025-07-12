"use client";

import { type BlogType } from "@/types/BlogType";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BlogProps {
  data: BlogType;
  type: string;
}
export default function NewsInsightItem({ data, type }: BlogProps) {
  const router = useRouter();
  const handleBlogClick = (blogId: string) => {
    // Go to blog detail with blogId selected
    router.push(`/blog/detail1?id=${blogId}`);
  };
  return (
    <>
      {type === "style-one" ? (
        <div
          className="blog-item style-one h-full cursor-pointer bg-white p-5 transition-transform hover:scale-[1.02]"
          onClick={() => handleBlogClick(data.id)}
        >
          <div className="blog-main block h-full">
            <div className="blog-thumb overflow-hidden rounded-[10px] sm:rounded-[15px] md:rounded-[20px]">
              <Image
                src={data.coverImageUrl}
                width={2000}
                height={1500}
                alt="blog-img"
                className="w-full object-cover transition-all duration-500 hover:scale-105"
              />
            </div>
            <div className="blog-infor mt-4 sm:mt-5 md:mt-7">
              <div className="blog-tag bg-green_custom inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase leading-4 sm:px-2.5 sm:py-1 sm:text-sm sm:leading-5">
                {data.tags.map((tag) => tag.name).join(", ")}
              </div>
              <div className="blog-title mt-2 text-base font-medium leading-tight duration-300 sm:mt-3 sm:text-lg md:text-xl">
                {data.title}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
                <div className="blog-author text-xs font-normal text-secondary sm:text-sm md:text-base md:leading-[22px]">
                  by {data.createdBy.name}
                </div>
                <span className="h-[1px] w-[15px] bg-black hover:bg-black/75 sm:w-[20px]"></span>
                <div className="blog-date text-xs font-normal text-secondary sm:text-sm md:text-base md:leading-[22px]">
                  {new Date(data.updatedAt)
                    .toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {type === "style-list" ? (
            <div
              className="blog-item style-list h-full cursor-pointer bg-white transition-all hover:opacity-95"
              onClick={() => handleBlogClick(data.id)}
            >
              <div className="blog-main flex h-full flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:gap-9">
                <div className="blog-thumb w-full overflow-hidden rounded-[10px] sm:rounded-[15px] md:w-1/2 md:rounded-[20px]">
                  <Image
                    src={data.coverImageUrl}
                    width={2000}
                    height={1500}
                    alt="blog-img"
                    className="w-full object-cover transition-all duration-500 hover:scale-105"
                  />
                </div>
                <div className="blog-infor flex-1">
                  <div className="blog-tag bg-green_custom inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase leading-4 sm:px-2.5 sm:py-1 sm:text-sm sm:leading-5">
                    {data.tags.map((tag) => tag.name).join(", ")}
                  </div>
                  <div className="blog-title mt-2 text-base font-medium leading-tight duration-300 sm:mt-3 sm:text-lg md:text-xl">
                    {data.title}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
                    <div className="blog-author text-xs font-normal text-secondary sm:text-sm md:text-base md:leading-[22px]">
                      by {data.createdBy.name}
                    </div>
                    <span className="h-[1px] w-[15px] bg-black hover:bg-black/75 sm:w-[20px]"></span>
                    <div className="blog-date text-xs font-normal text-secondary sm:text-sm md:text-base md:leading-[22px]">
                      {new Date(data.updatedAt)
                        .toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        .toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-secondary sm:mt-3 md:mt-4 md:text-base">
                    {data.shortDescription}
                  </div>
                  <div className="mt-3 text-sm font-semibold capitalize leading-tight underline sm:mt-4 sm:text-base md:leading-6">
                    Read More
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {type === "style-default" && (
                <div
                  className="blog-item style-default h-full cursor-pointer bg-white transition-all hover:opacity-95"
                  onClick={() => handleBlogClick(data.id)}
                >
                  <div className="blog-main block h-full border-b border-[#ddd] pb-4 focus:border-[#ddd] sm:pb-6 md:pb-8">
                    <div className="blog-thumb overflow-hidden rounded-[10px] sm:rounded-[15px] md:rounded-[20px]">
                      <Image
                        src={data.coverImageUrl}
                        width={2000}
                        height={1500}
                        alt="blog-img"
                        className="w-full object-cover transition-all duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="blog-infor mt-4 sm:mt-5 md:mt-7">
                      <div className="blog-tag bg-green_custom inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase leading-4 sm:px-2.5 sm:py-1 sm:text-sm sm:leading-5">
                        {data.tags.map((tag) => tag.name).join(", ")}
                      </div>
                      <div className="blog-title mt-2 text-base font-medium leading-tight duration-300 sm:mt-3 sm:text-lg md:text-xl">
                        {data.title}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
                        <div className="blog-author text-xs font-normal text-secondary sm:text-sm md:text-base md:leading-[22px]">
                          by {data.createdBy.name}
                        </div>
                        <span className="h-[1px] w-[15px] bg-black hover:bg-black/75 sm:w-[20px]"></span>
                        <div className="blog-date text-xs font-normal text-secondary sm:text-sm md:text-base md:leading-[22px]">
                          {new Date(data.updatedAt)
                            .toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                            .toUpperCase()}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-secondary sm:mt-3 md:mt-4 md:text-base">
                        {data.shortDescription}
                      </div>
                      <div className="mt-3 text-sm font-semibold underline sm:mt-4 sm:text-base">
                        Read More
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
