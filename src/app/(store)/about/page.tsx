"use client";
import Benefit from "@/components/store-components/Benefit";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import Newsletter from "@/components/store-components/Newsletter";
const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
];
const AboutUs = () => {
  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="About Us" />
      </div>
      <div className="pt-10 md:pt-20">
        <div>
          <div className="mx-auto w-full max-w-[1322px] pl-4 pr-4">
            <div className="flex items-center justify-center">
              <div className="w-full md:w-5/6">
                <div className="text-center text-[36px] font-semibold capitalize leading-[40px] md:text-[20px] md:leading-[28px] lg:text-[30px] lg:leading-[38px]">
                  Welcome to Rinors
                </div>
                <div className="mt-5 text-center text-lg font-normal leading-7 md:mt-7">
                  your trusted partner in modern, sustainable renewable energy
                  and social innovation.
                  <br />
                  Founded in 2022, Rinors is more than just a company. We are a
                  non-profit organization dedicated to driving positive change
                  through clean energy, research and development, and a bold
                  vision for the future.
                  <br />
                  Inspired by professor Dr. Muhammad Yunus, we are committed to
                  helping build a 3-Zero World:
                  <br />
                  Zero Unemployment
                  <br />
                  Zero Environmental Harm
                  <br />
                  Zero Wealth Concentration
                  <br />
                  <br />
                  Our mission is to make renewable energy affordable,
                  accessible, and transformative—not only for individuals and
                  businesses but for entire communities.
                  <br />
                  Every taka we earn is reinvested into: Cutting-edge research
                  and development Supporting green jobs and skill-building
                  Expanding access to clean, reliable energy in underserved
                  areas At Rinors, we believe in a future where innovation
                  serves people and the planet. Join us as we light the way
                  toward a cleaner, fairer, and more sustainable world.
                  <br />
                  Rinors – The Smart Choice for renewable energy , and the Right
                  Choice for Humanity.
                </div>
              </div>
            </div>
            {/* <div className="grid gap-[30px] pt-10 sm:grid-cols-3 md:pt-20">
              <div className="bg-img">
                <Image
                  src={"/images/other/about-team.jpg"}
                  width={2000}
                  height={3000}
                  alt="Our Team"
                  className="w-full rounded-[30px]"
                />
              </div>
              <div className="bg-img">
                <Image
                  src={"/images/other/about-store.jpg"}
                  width={2000}
                  height={3000}
                  alt="Our Store"
                  className="w-full rounded-[30px]"
                />
              </div>
              <div className="bg-img">
                <Image
                  src={"/images/other/about-values.jpg"}
                  width={2000}
                  height={3000}
                  alt="Our Values"
                  className="w-full rounded-[30px]"
                />
              </div>
            </div> */}
          </div>
        </div>
      </div>
      <Benefit props="md:pt-20 pt-10" /> {/* Newsletter */}
      <div className="newsletter-section my-10 md:my-20">
        <Newsletter />
      </div>
      {/* <Instagram /> */}
      {/* <Brand /> */}
    </>
  );
};

export default AboutUs;
