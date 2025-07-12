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
                <h1 className="text-center text-[36px] font-semibold capitalize leading-[40px] md:text-[20px] md:leading-[28px] lg:text-[30px] lg:leading-[38px]">
                  Welcome to Packet BD
                </h1>
                <div className="mt-5 text-center text-lg font-normal leading-7 md:mt-7">
                  <p>
                    <strong>Packet BD</strong> is your trusted partner for high-quality, customizable packaging solutions — proudly serving businesses across Bangladesh. Whether you're an emerging online store or an established retailer, we help elevate your brand with secure and professional packaging.
                  </p>

                  <h2 className="mt-8 text-2xl font-semibold">Our Mission</h2>
                  <p>
                    Our mission is to make premium packaging accessible and affordable for businesses of all sizes. We aim to help brands stand out, protect their products during transit, and leave a lasting impression on their customers.
                  </p>

                  <h2 className="mt-8 text-2xl font-semibold">What We Offer</h2>
                  <p>We provide a wide range of packaging materials tailored to your brand and shipping needs:</p>

                  <div className="flex justify-center">
                    <ul className="text-left list-disc list-inside mt-4 inline-block text-start">
                      <li>Custom Courier Polybags (Printed & Plain)</li>
                      <li>Waterproof Self-Sealing Mailers</li>
                      <li>Bubble Wrappers for fragile items</li>
                      <li>Courier Boxes of various sizes</li>
                      <li>Cellophane Tapes (Clear & Custom Printed)</li>
                      <li>Printed Polybags with your brand logo</li>
                      <li>Non-woven and Die-cut Handle Bags</li>
                      <li>Customized Product Packaging Pouches</li>
                      <li>Gift Wrappers & Specialty Packaging</li>
                      <li>Custom Stickers & Labels</li>
                      <li>Delivery/Customer Info Stickers</li>
                      <li>Customized Visiting Cards</li>
                    </ul>
                  </div>

                  <h2 className="mt-8 text-2xl font-semibold">Why Choose Us?</h2>
                  <div className="flex justify-center">
                    <ul className="text-left list-disc list-inside mt-4 inline-block text-start">
                      <li>Premium packaging materials that reflect your brand quality</li>
                      <li>Affordable pricing with small MOQ (minimum order quantity)</li>
                      <li>Custom branding options for most products</li>
                      <li>Fast, reliable delivery across Bangladesh</li>
                      <li>Dedicated support team to guide you</li>
                    </ul>
                  </div>

                  <h3 className="mt-8 text-xl font-semibold">Let’s Grow Together</h3>
                  <p>
                    From small startups to large e-commerce retailers, Packet BD is here to help your packaging speak louder than words. Whether you need 100 pieces or 10,000 — we’ve got you covered.
                  </p>

                  <p className="mt-4">
                    <strong>At Packet BD, packaging is more than protection — it’s presentation.</strong>
                    <br />
                    Let us help your brand make the best first impression.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Benefit props="md:pt-20 pt-10" />
      <div className="newsletter-section my-10 md:my-20">
        <Newsletter />
      </div>
    </>
  );
};

export default AboutUs;
