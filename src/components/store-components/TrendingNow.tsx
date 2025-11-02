"use client";

import { api } from "@/trpc/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "swiper/css/bundle";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const TrendingNow = () => {
  const [categories] = api.category.getAll.useSuspenseQuery();
  const router = useRouter();

  const handleCategoryClick = (category: {
    id: string;
    slug?: string | null;
  }) => {
    if (category.slug) {
      router.push(`/products/${category.slug}`);
    } else {
      router.push(`/products?category=${category.id}`);
    }
  };

  return (
    <div className="trending-block style-six py-10 md:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="heading3 mb-8 text-center md:mb-12">
          Trending Right Now
        </div>
        <div className="list-trending section-swiper-navigation style-small-border style-outline">
          <Swiper
            spaceBetween={6}
            slidesPerView={2}
            navigation
            loop={true}
            centeredSlides={true}
            modules={[Navigation, Autoplay]}
            breakpoints={{
              400: {
                slidesPerView: 2,
                spaceBetween: 8,
                centeredSlides: true,
              },
              576: {
                slidesPerView: 3,
                spaceBetween: 10,
                centeredSlides: false,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 12,
                centeredSlides: false,
              },
              992: {
                slidesPerView: 5,
                spaceBetween: 14,
                centeredSlides: false,
              },
              1290: {
                slidesPerView: 5,
                spaceBetween: 16,
                centeredSlides: false,
              },
            }}
            className="h-full !overflow-visible"
          >
            {categories.map((category) => (
              <SwiperSlide
                key={category.id}
                className="flex justify-center py-2"
              >
                <div
                  className="trending-item group relative mx-auto block max-w-[150px] cursor-pointer transition-all duration-300 hover:-translate-y-1 md:max-w-[220px]"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="bg-img aspect-square overflow-hidden rounded-full border-4 border-white shadow-lg transition-all duration-300 group-hover:border-brand-primary group-hover:shadow-xl">
                    <Image
                      src={category.image ?? "/images/avatar/1.png"}
                      width={220}
                      height={220}
                      sizes="(max-width: 576px) 150px, (max-width: 768px) 180px, (max-width: 992px) 200px, 220px"
                      alt={category.name}
                      priority={true}
                      className="h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="trending-name mt-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="heading5 mb-1 font-medium transition-colors duration-300 group-hover:text-brand-primary">
                        {category.name}
                      </span>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-brand-primary">
                        {category.subcategories.length}{" "}
                        {category.subcategories.length === 1
                          ? "Subcategory"
                          : "Subcategories"}
                      </span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default TrendingNow;
