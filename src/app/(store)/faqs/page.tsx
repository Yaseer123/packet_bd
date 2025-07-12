"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { api } from "@/trpc/react";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import { type Key, useEffect, useState } from "react";

const breadcrumbItems = [
  { label: <HomeIcon size={16} />, href: "/" },
  { label: "FAQs", href: "/faqs" },
];

const Faqs = () => {
  // Fetch all FAQ categories
  const { data: faqCategories, isLoading: categoriesLoading } =
    api.faq.getAllCategories.useQuery();

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [activeQuestion, setActiveQuestion] = useState<string | undefined>(
    undefined,
  );

  // Get faqs for active category
  const { data: faqItems, isLoading: faqsLoading } =
    api.faq.getFaqsByCategory.useQuery(
      { categoryId: activeTab ?? "" },
      { enabled: !!activeTab },
    );

  // Set initial active tab when categories are loaded
  useEffect(() => {
    if (faqCategories && faqCategories.length > 0 && !activeTab) {
      setActiveTab(faqCategories[0]?.id);
    }
  }, [faqCategories, activeTab]);

  const handleActiveTab = (tabId: string) => {
    setActiveTab(tabId);
    setActiveQuestion(undefined); // Reset active question when changing tabs
  };

  const handleActiveQuestion = (questionId: string) => {
    setActiveQuestion((prevQuestionId) =>
      prevQuestionId === questionId ? undefined : questionId,
    );
  };

  // Category skeleton loader
  const CategorySkeleton = () => (
    <div className="menu-tab flex flex-col gap-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-7 w-32 animate-pulse rounded bg-gray-200"
        ></div>
      ))}
    </div>
  );

  // FAQ item skeleton loader
  const FaqItemSkeleton = () => (
    <div className="tab-question flex flex-col gap-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="question-item overflow-hidden rounded-[20px] border border-[#ddd] px-7 py-5 focus:border-[#ddd]"
        >
          <div className="heading flex items-center justify-between gap-6">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200"></div>
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="FAQs" />
      </div>
      <div className="faqs-block py-6 sm:py-10 md:py-20">
        <div className="container">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between md:gap-0">
            <div className="left mb-6 w-full md:mb-0 md:w-1/4">
              {categoriesLoading ? (
                <CategorySkeleton />
              ) : (
                <div className="menu-tab flex flex-row gap-3 overflow-x-auto border-b border-gray-200 pb-2 md:flex-col md:gap-5 md:overflow-visible md:border-b-0 md:pb-0">
                  {faqCategories && faqCategories.length > 0 ? (
                    faqCategories.map(
                      (category: {
                        id: Key | null | undefined;
                        title: string;
                      }) => (
                        <div
                          key={category.id ?? ""}
                          className={`tab-item heading6 has-line-before text-secondary2 inline-block w-fit cursor-pointer rounded px-3 py-2 duration-300 md:rounded-none md:px-0 md:py-0 ${
                            activeTab === String(category.id)
                              ? "active bg-gray-100 md:bg-transparent"
                              : ""
                          }`}
                          onClick={() => handleActiveTab(String(category.id))}
                        >
                          {category.title}
                        </div>
                      ),
                    )
                  ) : (
                    <div className="py-8 text-center">
                      <p className="body1 text-secondary">
                        No FAQ categories found.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="right w-full md:w-2/3">
              {faqsLoading ? (
                <FaqItemSkeleton />
              ) : (
                <div
                  className={`tab-question flex flex-col gap-5 ${activeTab ? "active" : ""}`}
                >
                  {faqItems && faqItems.length > 0 ? (
                    faqItems.map(
                      (faq: {
                        id: Key | null | undefined;
                        question: string;
                        answer: string;
                      }) => (
                        <div
                          key={faq.id ?? ""}
                          className={`question-item cursor-pointer overflow-hidden rounded-[20px] border border-[#ddd] px-4 py-4 focus:border-[#ddd] sm:px-7 sm:py-5 ${
                            activeQuestion === String(faq.id) ? "open" : ""
                          }`}
                          onClick={() => handleActiveQuestion(String(faq.id))}
                        >
                          <div className="heading flex items-center justify-between gap-4 sm:gap-6">
                            <div className="heading6 text-base sm:text-lg">
                              {faq.question}
                            </div>
                            <CaretRight
                              size={24}
                              className={`transition-transform duration-300 ${
                                activeQuestion === String(faq.id)
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                          </div>
                          {activeQuestion === String(faq.id) && (
                            <div
                              className="content body1 mt-4 text-sm text-secondary sm:text-base"
                              style={{ whiteSpace: "pre-line" }}
                            >
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      ),
                    )
                  ) : (
                    <div className="py-8 text-center">
                      <p className="body1 text-secondary">
                        No FAQ items found for this category.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Faqs;
