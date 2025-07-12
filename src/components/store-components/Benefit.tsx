export default function Benefit({ props }: { props: string }) {
  return (
    <>
      <div className="mx-auto w-full !max-w-[1322px] px-4 py-6 sm:py-8 md:py-10">
        <div className={`benefit-block ${props}`}>
          <div className="list-benefit xs:grid-cols-2 grid grid-cols-1 items-start gap-5 sm:gap-6 md:grid-cols-2 md:gap-[20px] lg:grid-cols-4 lg:gap-[30px]">
            <div className="benefit-item flex flex-col items-center justify-center bg-white p-3 sm:p-4">
              <i className="icon-phone-call text-4xl sm:text-5xl lg:text-7xl"></i>
              <div className="heading6 mt-3 text-center text-base sm:mt-4 sm:text-lg lg:mt-5">
                24/7 Customer Service
              </div>
              <div className="mt-2 text-center text-sm font-normal leading-tight text-secondary sm:mt-3 sm:text-base sm:leading-[22px] md:text-[13px] md:leading-5">
                We&apos;re here to help you with any questions or concerns you
                have, 24/7.
              </div>
            </div>
            <div className="benefit-item flex flex-col items-center justify-center bg-white p-3 sm:p-4">
              <i className="icon-return text-4xl sm:text-5xl lg:text-7xl"></i>
              <div className="heading6 mt-3 text-center text-base sm:mt-4 sm:text-lg lg:mt-5">
                3-Day Money Back
              </div>
              <div className="mt-2 text-center text-sm font-normal leading-tight text-secondary sm:mt-3 sm:text-base sm:leading-[22px] md:text-[13px] md:leading-5">
                If you&apos;re not satisfied with your purchase, simply return
                it within 3 days for a refund.
              </div>
            </div>
            <div className="benefit-item flex flex-col items-center justify-center bg-white p-3 sm:p-4">
              <i className="icon-guarantee text-4xl sm:text-5xl lg:text-7xl"></i>
              <div className="heading6 mt-3 text-center text-base sm:mt-4 sm:text-lg lg:mt-5">
                Our Guarantee
              </div>
              <div className="mt-2 text-center text-sm font-normal leading-tight text-secondary sm:mt-3 sm:text-base sm:leading-[22px] md:text-[13px] md:leading-5">
                We stand behind our products and services and guarantee your
                satisfaction.
              </div>
            </div>
            <div className="benefit-item flex flex-col items-center justify-center bg-white p-3 sm:p-4">
              <i className="icon-delivery-truck text-4xl sm:text-5xl lg:text-7xl"></i>
              <div className="heading6 mt-3 text-center text-base sm:mt-4 sm:text-lg lg:mt-5">
                Shipping worldwide
              </div>
              <div className="mt-2 text-center text-sm font-normal leading-tight text-secondary sm:mt-3 sm:text-base sm:leading-[22px] md:text-[13px] md:leading-5">
                We ship our products worldwide, making them accessible to
                customers everywhere.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
