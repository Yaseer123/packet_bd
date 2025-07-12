"use client";

import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";
import "swiper/css/bundle";
import "swiper/css/effect-fade";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { SaleBanner } from "./SaleBanner";

// Add a type for the slide data
interface SliderDataType {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  imageId: string;
  link?: string | null;
  autoSlideTime?: number;
}

const Slider = () => {
  const { data: sliderData, isLoading } = api.slider.getAll.useQuery() as {
    data?: SliderDataType[];
    isLoading: boolean;
  };

  if (isLoading) {
    return (
      <div className="slider-block style-two w-full animate-pulse">
        <div className="banner-block mx-auto flex h-full w-full !max-w-[1322px] gap-5 px-4 max-lg:flex-wrap lg:pt-[30px]">
          <div className="slider-main w-full max-lg:h-[300px] max-[420px]:h-[340px] lg:w-2/3">
            <div className="relative h-full w-full overflow-hidden bg-gray-200" />
          </div>
          <div className="banner-ads-block flex w-full flex-col gap-5 max-lg:mt-5 lg:w-1/3">
            <div className="banner-ads-item relative h-[200px] overflow-hidden bg-gray-200" />
            <div className="banner-ads-item relative h-[200px] overflow-hidden bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // Safely get autoSlideTime from the first slide, fallback to 4000
  let autoSlideTime = 4000;
  if (
    Array.isArray(sliderData) &&
    sliderData.length > 0 &&
    typeof sliderData[0]?.autoSlideTime === "number"
  ) {
    autoSlideTime = sliderData[0].autoSlideTime;
  }

  return (
    <div className="slider-block style-two w-full">
      <div className="banner-block mx-auto flex h-full w-full max-w-[1322px] gap-5 max-lg:flex-wrap lg:pt-[30px]">
        {/* Slider */}
        <div className="slider-main relative aspect-[3/2] w-full shadow-lg lg:w-2/3">
          <Swiper
            spaceBetween={0}
            slidesPerView={1}
            loop={true}
            pagination={{ clickable: true }}
            modules={[Pagination, Autoplay]}
            className="relative h-full w-full overflow-hidden"
            autoplay={{
              delay: autoSlideTime,
              disableOnInteraction: false,
            }}
          >
            {(sliderData ?? []).map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="slider-item bg-linear relative flex h-full w-full items-center">
                  {/* Background Image */}
                  <Image
                    src={slide.imageUrl ?? ""}
                    alt={slide.title ?? ""}
                    fill
                    priority={true}
                    className="z-0 object-cover object-center"
                    style={{ position: "absolute" }}
                  />
                  {/* Text Content */}
                  <div className="text-content relative z-10 basis-1/2 pl-5 md:pl-[60px]">
                    <div className="text-sm font-semibold uppercase leading-5 md:text-xs md:leading-4">
                      {slide.subtitle ?? ""}
                    </div>
                    <div className="heading2 mt-2 lg:mt-3">
                      {slide.title ?? ""}
                    </div>
                    <div className="body1 mt-3 lg:mt-4">
                      {slide.description ?? ""}
                    </div>
                    <Link
                      href={slide.link ?? ""}
                      className="button-main mt-3 lg:mt-8"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Swiper pagination dots positioning */}
          <style jsx global>{`
            .swiper-pagination {
              position: absolute !important;
              bottom: 12px !important;
              left: 0;
              right: 0;
              margin: 0 auto;
              z-index: 20;
              text-align: center;
            }
          `}</style>
        </div>

        {/* Sale Banner */}
        <SaleBanner />
      </div>
    </div>
  );
};

export default Slider;
