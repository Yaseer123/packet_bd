import { type TestimonialType } from "@/types/TestimonialType";
import Image from "next/image";
import Rate from "./Rate";
interface TestimonialProps {
  data: TestimonialType;
  type: string;
}
export default function TestimonialItem({ data, type }: TestimonialProps) {
  return (
    <>
      {type === "style-one" ? (
        <div className="testimonial-item style-one h-full bg-white">
          <div className="testimonial-main h-full rounded-2xl bg-white p-8">
            <Rate currentRate={data.star} size={14} />
            <div className="heading6 title mt-4">{data.title}</div>
            <div className="desc mt-2">{data.description}</div>
            <div className="name mt-4 text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
              {data.name}
            </div>
            <div className="caption2 date text-secondary2 mt-1">
              {data.date}
            </div>
          </div>
        </div>
      ) : (
        <>
          {type === "style-four" ? (
            <div className="testimonial-item style-four h-full bg-white">
              <div className="testimonial-main h-full">
                <Rate currentRate={data.star} size={14} />
                <div className="mt-4 text-sm font-semibold uppercase leading-5 text-secondary md:text-xs md:leading-4">
                  Customer reviews
                </div>
                <div className="desc mt-2 text-[30px] font-normal font-semibold capitalize normal-case leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                  {data.description}
                </div>
                <div className="name mt-4 text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
                  {data.name}
                </div>
                <div className="caption2 date text-secondary2">{data.date}</div>
              </div>
            </div>
          ) : (
            <>
              {type === "style-six" ? (
                <div className="testimonial-item style-six h-full bg-white">
                  <div className="testimonial-main h-full">
                    <Rate currentRate={data.star} size={14} />
                    <div className="mt-4 text-sm font-semibold uppercase leading-5 text-secondary md:text-xs md:leading-4">
                      Customer reviews
                    </div>
                    <div className="desc mt-2 text-[30px] font-normal font-semibold capitalize normal-case leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                      {data.description}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="name text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
                        {data.name}
                      </div>
                      <div className="date text-secondary2 text-base font-normal leading-[22] md:text-[13px] md:leading-5">
                        From {data.address}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {type === "style-seven" ? (
                    <>
                      <div className="testimonial-item style-seven h-full bg-white">
                        <div className="testimonial-main h-full rounded-[20px] bg-white px-7 py-8">
                          <div className="heading flex items-center gap-4">
                            <div className="avatar h-10 w-10 overflow-hidden rounded-full">
                              <Image
                                src={data.avatar}
                                width={500}
                                height={500}
                                alt="avatar"
                                className="h-full w-full"
                              />
                            </div>
                            <div className="infor">
                              <Rate currentRate={data.star} size={14} />
                              <div className="text-title name">{data.name}</div>
                            </div>
                          </div>
                          <div className="body1 desc mt-4">
                            {data.description}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <></>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
