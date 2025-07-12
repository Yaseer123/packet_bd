"use client";

import { api } from "@/trpc/react";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const SaleBanner = () => {
  const router = useRouter();
  const { data: banners } = api.saleBanner.getAll.useQuery();

  const handleClick = (link: string | null) => {
    if (link) router.push(link);
  };

  const activeBanners = banners?.filter(
    (banner: {
      isActive: boolean;
      startDate: string | number | Date;
      endDate: string | number | Date;
    }) =>
      banner.isActive &&
      new Date(banner.startDate) <= new Date() &&
      new Date(banner.endDate) >= new Date(),
  );

  if (!activeBanners?.length) return null;

  return (
    <div className="banner-ads-block w-full bg-transparent shadow-lg max-lg:mt-4 lg:w-1/3">
      <div className="grid h-full w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-1 lg:gap-5">
        {activeBanners
          .slice(0, 2)
          .map(
            (banner: {
              id: string | number;
              link: string | null;
              title: string | null;
              subtitle: string | null;
              description: string | null;
              imageUrl: string | StaticImport;
            }) => (
              <div
                key={banner.id}
                className="banner-ads-item bg-linear relative cursor-pointer overflow-hidden"
                style={{
                  aspectRatio: "3/2",
                  minHeight: "160px",
                }}
                onClick={() => handleClick(banner.link)}
              >
                <div className="text-content relative z-[1] p-4 sm:p-6 md:py-6 md:pl-7 lg:py-8 lg:pl-8">
                  {banner.title && banner.title.trim() !== "" && (
                    <div className="inline-block rounded-sm bg-red-500 px-2 py-0.5 text-xs font-semibold uppercase leading-4 text-white sm:text-sm sm:leading-5 md:text-xs md:leading-4">
                      {banner.title}
                    </div>
                  )}
                  <div className="heading6 mt-1 text-sm sm:mt-2 sm:text-base">
                    {banner.subtitle ?? ""}
                  </div>
                  <div className="body1 mt-1 line-clamp-2 max-w-[70%] text-xs text-secondary sm:mt-2 sm:line-clamp-none sm:max-w-[80%] sm:text-sm">
                    {banner.description ?? ""}
                  </div>
                </div>
                <Image
                  src={banner.imageUrl}
                  width={600}
                  height={400}
                  alt={banner.title ?? ""}
                  priority={true}
                  className="absolute right-0 top-0 h-full w-full object-cover object-right-top sm:max-w-none"
                />
              </div>
            ),
          )}
      </div>
    </div>
  );
};
