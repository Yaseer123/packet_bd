import Benefit from "@/components/store-components/Benefit";
// import ModalNewsletter from "@/components/store-components/Modal/ModalNewsletter";
import RecentlyAdded from "@/components/store-components/Fashion";
import FeaturedProducts from "@/components/store-components/FeaturedProducts";
import NewsInsight from "@/components/store-components/NewsInsight";
import Newsletter from "@/components/store-components/Newsletter";
import Slider from "@/components/store-components/Slider";
import TrendingNow from "@/components/store-components/TrendingNow";

export default function HomeEleven() {
  return (
    <>
      <div id="header" className="relative w-full">
        <Slider />
      </div>
      <TrendingNow />
      <FeaturedProducts />
      <RecentlyAdded />
      <Benefit props="md:mt-20 mt-10 py-10 px-2.5 bg-surface rounded-[32px]" />
      <NewsInsight start={0} limit={3} />
      <Newsletter />
      {/* <ModalNewsletter /> */}
    </>
  );
}
