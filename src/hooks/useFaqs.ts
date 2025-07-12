import { api } from "@/trpc/react";

export const useAdminFaqs = () => {
  // Get all FAQs with categories
  const utils = api.useUtils();

  // Query all FAQs
  const { data: allFaqs, isLoading, error } = api.faq.getAllFaqs.useQuery();

  // Create a new category mutation
  const createCategory = api.faq.createCategory.useMutation({
    onSuccess: async () => {
      await utils.faq.getAllFaqs.invalidate();
      await utils.faq.getAllCategories.invalidate();
    },
  });

  // Update a category mutation
  const updateCategory = api.faq.updateCategory.useMutation({
    onSuccess: async () => {
      await utils.faq.getAllFaqs.invalidate();
      await utils.faq.getAllCategories.invalidate();
    },
  });

  // Delete a category mutation
  const deleteCategory = api.faq.deleteCategory.useMutation({
    onSuccess: async () => {
      await utils.faq.getAllFaqs.invalidate();
      await utils.faq.getAllCategories.invalidate();
    },
  });

  // Create a new FAQ item mutation
  const createFaqItem = api.faq.createFaqItem.useMutation({
    onSuccess: async () => {
      await utils.faq.getAllFaqs.invalidate();
      await utils.faq.getFaqsByCategory.invalidate();
    },
  });

  // Update a FAQ item mutation
  const updateFaqItem = api.faq.updateFaqItem.useMutation({
    onSuccess: async () => {
      await utils.faq.getAllFaqs.invalidate();
      await utils.faq.getFaqsByCategory.invalidate();
    },
  });

  // Delete a FAQ item mutation
  const deleteFaqItem = api.faq.deleteFaqItem.useMutation({
    onSuccess: async () => {
      await utils.faq.getAllFaqs.invalidate();
      await utils.faq.getFaqsByCategory.invalidate();
    },
  });

  return {
    allFaqs,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createFaqItem,
    updateFaqItem,
    deleteFaqItem,
  };
};
