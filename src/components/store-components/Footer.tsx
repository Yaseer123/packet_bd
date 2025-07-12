"use client";

import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const [categories] = api.category.getAll.useSuspenseQuery();
  // Get first 5 top-level categories
  const topCategories = categories.filter((cat) => !cat.parentId).slice(0, 5);

  return (
    <>
      <div id="footer" className="footer mt-5 bg-white">
        <div className="footer-main bg-surface">
          <div className="container">
            <div className="content-footer flex flex-wrap justify-between gap-y-8 pt-[60px]">
              <div className="company-infor basis-1/4 pr-7 max-lg:basis-full">
                <Link href={"/"} className="logo">
                  <Image
                    src="/light.png"
                    alt="Rinors"
                    width={120}
                    height={40}
                    priority
                    className="h-auto w-[220px] object-contain"
                  />
                </Link>
                <div className="mt-3 flex gap-3">
                  <div className="flex flex-col">
                    <span className="text-button">Mail:</span>
                    <span className="text-button mt-3">Phone:</span>
                    <span className="text-button mt-3">Address:</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="">contact@packetbd.com</span>
                    <span className="mt-3">01824443227</span>
                    <span className="mt-3 pt-px">
                      Plot-1832, Bir Uttam Rafiqul Islam Ave, Dhaka, Bangladesh
                    </span>
                  </div>
                </div>
              </div>
              <div className="list-nav flex basis-2/4 justify-between gap-4 max-lg:basis-full">
                <div className="item flex basis-1/3 flex-col">
                  <div className="text-button-uppercase pb-3">Infomation</div>
                  <Link
                    className="caption1 has-line-before w-fit duration-300"
                    href={"/contact"}
                  >
                    Contact us
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/contact"}
                  >
                    Career
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/my-account"}
                  >
                    My Account
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/order-tracking"}
                  >
                    Order Tracking
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/faqs"}
                  >
                    FAQs
                  </Link>
                </div>
                <div className="item flex basis-1/3 flex-col">
                  <div className="text-button-uppercase pb-3">Quick Shop</div>
                  {topCategories.map((cat, idx) => (
                    <Link
                      key={cat.id}
                      className={`caption1 has-line-before w-fit${idx !== 0 ? "pt-2" : ""} duration-300`}
                      href={`/products?category=${cat.id}&page=0`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                <div className="item flex basis-1/3 flex-col">
                  <div className="text-button-uppercase pb-3">
                    Customer Services
                  </div>
                  <Link
                    className="caption1 has-line-before w-fit duration-300"
                    href={"/faqs"}
                  >
                    Orders FAQs
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/pages/faqs"}
                  >
                    Shipping
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/privacy-policy"}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    className="caption1 has-line-before w-fit pt-2 duration-300"
                    href={"/order-tracking"}
                  >
                    Return & Refund
                  </Link>
                </div>
              </div>
              <div className="support-block mb-8 flex basis-1/4 flex-col pr-12 max-lg:basis-full">
                <div>
                  <h4 className="mb-4 text-lg font-semibold">Support</h4>
                  <Link
                    href="tel:01824443227"
                    className="helpline-btn footer-big-btn mb-4 flex items-center gap-4 rounded-3xl border border-[#ddd] bg-[#f2f4f8] p-4 transition hover:bg-[#e6e8ee] focus:border-[#ddd]"
                  >
                    <div className="ic border- border-[#ddd] text-2xl text-[#ef4a23]">
                      <i className="icon-phone-call"></i>
                    </div>
                    <div className="flex flex-col border-l-2 border-[#ddd] pl-4">
                      <p className="text-xs text-[#838383]">9 AM - 8 PM</p>
                      <h5 className="text-lg font-bold text-[#081621]">
                        01824443227
                      </h5>
                    </div>
                  </Link>
                </div>
                {/* <a
                  href="https://g.co/kgs/MX7BqyL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-locator-btn footer-big-btn flex items-center gap-4 rounded-3xl border border-[#ddd] bg-[#f2f4f8] p-4 transition hover:bg-[#e6e8ee] focus:border-[#ddd]"
                >
                  <div className="ic text-2xl text-[#3749bb]">
                    <FaLocationDot />
                  </div>
                  <div className="flex flex-col border-l-2 border-[#ddd] pl-4">
                    <p className="text-xs text-[#838383]">Store Locator</p>
                    <h3 className="whitespace-nowrap text-lg font-bold text-[#081621]">
                      Find Our Store
                    </h3>
                  </div>
                </a> */}
              </div>
            </div>
            <div className="footer-bottom flex items-center justify-between gap-5 border-t border-[#ddd] py-3 focus:border-[#ddd] max-lg:flex-col max-lg:justify-center">
              <div className="copyright caption1 text-secondary">
                ©{new Date().getFullYear()} Packet BD. All Rights Reserved.
              </div>
              <div className="list-social flex items-center gap-4">
                <Link
                  href={
                    "https://www.facebook.com/people/Packet-BD/61578171175015/"
                  }
                  target="_blank"
                >
                  <div className="icon-facebook text-2xl text-black transition hover:text-[#1877f3]"></div>
                </Link>
                <Link
                  href={"https://www.instagram.com/packetbd3"}
                  target="_blank"
                >
                  <div className="icon-instagram text-2xl text-black transition hover:text-[#e4405f]"></div>
                </Link>

                {/* <Link href={"https://x.com/Rinors_Corpor"} target="_blank">
                  <FaXTwitter className="text-xl text-black transition hover:text-[#1da1f2]" />
                </Link>
                <Link
                  href={"https://www.tiktok.com/@rinors_ecommerce"}
                  target="_blank"
                >
                  <SiTiktok className="text-xl text-black transition hover:text-[#010101]" />
                </Link>
                <Link
                  href={"https://www.youtube.com/@rinorsecommerce"}
                  target="_blank"
                >
                  <div className="icon-youtube text-3xl text-black transition hover:text-[#ff0000]"></div>
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
