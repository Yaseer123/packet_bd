"use client";

import Image from "next/image";
import Link from "next/link";
import "swiper/css/bundle";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
export default function Instagram() {
  return (
    <>
      <div className="instagram-block pt-10 md:pt-20">
        <div className="heading">
          <div className="text-center text-[36px] font-semibold capitalize leading-[40px] md:text-[20px] md:leading-[28px] lg:text-[30px] lg:leading-[38px]">
            Rinors On Instagram
          </div>
          <div className="mt-3 text-center">#Anvougetheme</div>
        </div>
        <div className="list-instagram mt-4 md:mt-7">
          <Swiper
            slidesPerView={2}
            loop={true}
            modules={[Autoplay]}
            autoplay={{
              delay: 4000,
            }}
            breakpoints={{
              500: {
                slidesPerView: 2,
              },
              680: {
                slidesPerView: 3,
              },
              992: {
                slidesPerView: 4,
              },
              1200: {
                slidesPerView: 5,
              },
            }}
          >
            <SwiperSlide>
              <Link
                href={"https://www.instagram.com/"}
                target="_blank"
                className="item relative block overflow-hidden"
              >
                <Image
                  src={"/images/instagram/1.png"}
                  width={500}
                  height={500}
                  alt="1"
                  className="relative h-full w-full duration-500"
                />
                <div className="icon absolute left-1/2 top-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white duration-500 hover:bg-black hover:bg-black/75">
                  <div className="icon-instagram text-2xl text-black"></div>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link
                href={"https://www.instagram.com/"}
                target="_blank"
                className="item relative block overflow-hidden"
              >
                <Image
                  src={"/images/instagram/2.png"}
                  width={500}
                  height={500}
                  alt="1"
                  className="relative h-full w-full duration-500"
                />
                <div className="icon absolute left-1/2 top-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white duration-500 hover:bg-black hover:bg-black/75">
                  <div className="icon-instagram text-2xl text-black"></div>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link
                href={"https://www.instagram.com/"}
                target="_blank"
                className="item relative block overflow-hidden"
              >
                <Image
                  src={"/images/instagram/3.png"}
                  width={500}
                  height={500}
                  alt="1"
                  className="relative h-full w-full duration-500"
                />
                <div className="icon absolute left-1/2 top-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white duration-500 hover:bg-black hover:bg-black/75">
                  <div className="icon-instagram text-2xl text-black"></div>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link
                href={"https://www.instagram.com/"}
                target="_blank"
                className="item relative block overflow-hidden"
              >
                <Image
                  src={"/images/instagram/4.png"}
                  width={500}
                  height={500}
                  alt="1"
                  className="relative h-full w-full duration-500"
                />
                <div className="icon absolute left-1/2 top-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white duration-500 hover:bg-black hover:bg-black/75">
                  <div className="icon-instagram text-2xl text-black"></div>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link
                href={"https://www.instagram.com/"}
                target="_blank"
                className="item relative block overflow-hidden"
              >
                <Image
                  src={"/images/instagram/5.png"}
                  width={500}
                  height={500}
                  alt="1"
                  className="relative h-full w-full duration-500"
                />
                <div className="icon absolute left-1/2 top-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white duration-500 hover:bg-black hover:bg-black/75">
                  <div className="icon-instagram text-2xl text-black"></div>
                </div>
              </Link>
            </SwiperSlide>
            <SwiperSlide>
              <Link
                href={"https://www.instagram.com/"}
                target="_blank"
                className="item relative block overflow-hidden"
              >
                <Image
                  src={"/images/instagram/0.png"}
                  width={500}
                  height={500}
                  alt="1"
                  className="relative h-full w-full duration-500"
                />
                <div className="icon absolute left-1/2 top-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white duration-500 hover:bg-black hover:bg-black/75">
                  <div className="icon-instagram text-2xl text-black"></div>
                </div>
              </Link>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </>
  );
}
