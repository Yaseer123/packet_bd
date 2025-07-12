// src/app/admin/faqs/page.tsx
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminFaqs } from "@/hooks/useFaqs";
import {
  AlertCircle,
  Edit,
  FileQuestion,
  FolderOpenDot,
  Loader2,
  MoreVertical,
  Plus,
  Trash,
} from "lucide-react";
import {
  type AwaitedReactNode,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
  useState,
} from "react";
import { toast } from "sonner"; // Updated: Using sonner for toast

export default function AdminFAQsPage() {
  const {
    allFaqs,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    createFaqItem,
    updateFaqItem,
    deleteFaqItem,
  } = useAdminFaqs();

  // State for category management
  const [newCategory, setNewCategory] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // State for FAQ item management
  const [newFaqItem, setNewFaqItem] = useState({
    categoryId: "",
    question: "",
    answer: "",
  });
  const [faqItemDialogOpen, setFaqItemDialogOpen] = useState(false);
  const [editingFaqItem, setEditingFaqItem] = useState<{
    id: string;
    categoryId: string;
    question: string;
    answer: string;
  } | null>(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState("categories");

  // Function to handle category creation
  const handleCreateCategory = () => {
    if (newCategory.trim() === "") {
      // Updated: Using sonner toast
      toast.error("Validation Error", {
        description: "Category title is required",
      });
      return;
    }

    createCategory.mutate(
      { title: newCategory },
      {
        onSuccess: () => {
          // Updated: Using sonner toast
          toast.success("Success", {
            description: "Category created successfully",
          });
          setNewCategory("");
          setCategoryDialogOpen(false);
        },
        onError: (error: { message: string }) => {
          // Updated: Using sonner toast
          toast.error("Error", {
            description: error.message || "Failed to create category",
          });
        },
      },
    );
  };

  // Function to handle category update
  const handleUpdateCategory = () => {
    if (!editingCategory || editingCategory.title.trim() === "") {
      // Updated: Using sonner toast
      toast.error("Validation Error", {
        description: "Category title is required",
      });
      return;
    }

    updateCategory.mutate(
      { id: editingCategory.id, title: editingCategory.title },
      {
        onSuccess: () => {
          // Updated: Using sonner toast
          toast.success("Success", {
            description: "Category updated successfully",
          });
          setEditingCategory(null);
          setCategoryDialogOpen(false);
        },
        onError: (error: { message: string }) => {
          // Updated: Using sonner toast
          toast.error("Error", {
            description: error.message || "Failed to update category",
          });
        },
      },
    );
  };

  // Function to handle category deletion
  const handleDeleteCategory = (id: string, title: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${title}" category and all its FAQs?`,
      )
    ) {
      deleteCategory.mutate(
        { id },
        {
          onSuccess: () => {
            // Updated: Using sonner toast
            toast.success("Success", {
              description: "Category deleted successfully",
            });
          },
          onError: (error: { message: string }) => {
            // Updated: Using sonner toast
            toast.error("Error", {
              description: error.message || "Failed to delete category",
            });
          },
        },
      );
    }
  };

  // Function to handle FAQ item creation
  const handleCreateFaqItem = () => {
    if (
      newFaqItem.categoryId === "" ||
      newFaqItem.question.trim() === "" ||
      newFaqItem.answer.trim() === ""
    ) {
      // Updated: Using sonner toast
      toast.error("Validation Error", {
        description: "All fields are required",
      });
      return;
    }

    createFaqItem.mutate(newFaqItem, {
      onSuccess: () => {
        // Updated: Using sonner toast
        toast.success("Success", {
          description: "FAQ item added successfully",
        });
        setNewFaqItem({
          categoryId: "",
          question: "",
          answer: "",
        });
        setFaqItemDialogOpen(false);
      },
      onError: (error: { message: string }) => {
        // Updated: Using sonner toast
        toast.error("Error", {
          description: error.message || "Failed to create FAQ item",
        });
      },
    });
  };

  // Function to handle FAQ item update
  const handleUpdateFaqItem = () => {
    if (
      !editingFaqItem ||
      editingFaqItem.categoryId === "" ||
      editingFaqItem.question.trim() === "" ||
      editingFaqItem.answer.trim() === ""
    ) {
      // Updated: Using sonner toast
      toast.error("Validation Error", {
        description: "All fields are required",
      });
      return;
    }

    updateFaqItem.mutate(
      {
        id: editingFaqItem.id,
        categoryId: editingFaqItem.categoryId,
        question: editingFaqItem.question,
        answer: editingFaqItem.answer,
      },
      {
        onSuccess: () => {
          // Updated: Using sonner toast
          toast.success("Success", {
            description: "FAQ item updated successfully",
          });
          setEditingFaqItem(null);
          setFaqItemDialogOpen(false);
        },
        onError: (error: { message: string }) => {
          // Updated: Using sonner toast
          toast.error("Error", {
            description: error.message || "Failed to update FAQ item",
          });
        },
      },
    );
  };

  // Function to handle FAQ item deletion
  const handleDeleteFaqItem = (id: string, question: string) => {
    if (window.confirm(`Are you sure you want to delete "${question}"?`)) {
      deleteFaqItem.mutate(
        { id },
        {
          onSuccess: () => {
            // Updated: Using sonner toast
            toast.success("Success", {
              description: "FAQ item deleted successfully",
            });
          },
          onError: (error: { message: string }) => {
            // Updated: Using sonner toast
            toast.error("Error", {
              description: error.message || "Failed to delete FAQ item",
            });
          },
        },
      );
    }
  };

  // Open category dialog for editing
  const openEditCategoryDialog = (category: { id: string; title: string }) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  // Open FAQ item dialog for editing
  const openEditFaqItemDialog = (faqItem: {
    id: string;
    categoryId: string;
    question: string;
    answer: string;
  }) => {
    setEditingFaqItem(faqItem);
    setFaqItemDialogOpen(true);
  };

  // Open FAQ item dialog for creation with preselected category
  const openCreateFaqItemDialog = (categoryId?: string) => {
    setEditingFaqItem(null);
    if (categoryId) {
      setNewFaqItem({ ...newFaqItem, categoryId });
    }
    setFaqItemDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFaqCount =
    allFaqs?.reduce(
      (
        sum: number,
        category: {
          faqItems: {
            id: string;
            question: string;
            answer: string;
            categoryId: string;
          }[];
        },
      ) => sum + category.faqItems.length,
      0,
    ) ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            FAQ Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Create and manage frequently asked questions for your website.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => {
              setNewFaqItem({
                categoryId: "",
                question: "",
                answer: "",
              });
              setFaqItemDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add FAQ
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingCategory(null);
              setNewCategory("");
              setCategoryDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-2 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FolderOpenDot className="h-4 w-4" />
              <span>Total Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allFaqs?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileQuestion className="h-4 w-4" />
              <span>Total FAQs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaqCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Categories and FAQs */}
      <div className="mb-8 rounded-lg border-2 bg-background p-1 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger value="categories" className="font-medium">
              Categories
            </TabsTrigger>
            <TabsTrigger value="faqs" className="font-medium">
              All FAQs
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab Content */}
          <TabsContent value="categories" className="mt-6 space-y-4 p-1">
            {allFaqs?.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No categories found</AlertTitle>
                <AlertDescription>
                  Get started by adding your first FAQ category.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allFaqs?.map(
                  (category: {
                    id: string;
                    title: string;
                    faqItems: {
                      id: string;
                      question: string;
                      answer: string;
                      categoryId: string;
                    }[];
                  }) => (
                    <Card
                      key={category.id}
                      className="overflow-hidden border transition-all hover:border-black hover:shadow-md"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="line-clamp-2">
                            {category.title}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-black hover:bg-black/75 hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openEditCategoryDialog(category)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteCategory(
                                    category.id,
                                    category.title,
                                  )
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="rounded-sm px-1.5 py-0.5 text-xs font-normal"
                          >
                            {category.faqItems.length}
                          </Badge>
                          <span className="text-xs">
                            {category.faqItems.length === 1 ? "FAQ" : "FAQs"}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        {category.faqItems.length > 0 ? (
                          <ScrollArea className="h-32 pr-2">
                            <ul className="space-y-2">
                              {category.faqItems
                                .slice(0, 5)
                                .map(
                                  (faq: { id: string; question: string }) => (
                                    <li
                                      key={faq.id}
                                      className="group flex items-start gap-1.5 rounded-sm border-l-2 border-l-gray-300 bg-gray-50 px-3 py-2 text-sm transition-colors hover:border-l-black hover:bg-gray-100"
                                    >
                                      <span className="min-w-0 flex-1 truncate">
                                        {faq.question}
                                      </span>
                                    </li>
                                  ),
                                )}
                              {category.faqItems.length > 5 && (
                                <li className="pt-1 text-center text-xs text-gray-500">
                                  + {category.faqItems.length - 5} more
                                </li>
                              )}
                            </ul>
                          </ScrollArea>
                        ) : (
                          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-gray-300 text-center text-sm">
                            <p>No FAQs in this category yet</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border border-gray-300 bg-white hover:bg-gray-100"
                          onClick={() =>
                            openCreateFaqItemDialog(String(category.id))
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add FAQ
                        </Button>
                      </CardFooter>
                    </Card>
                  ),
                )}
              </div>
            )}
          </TabsContent>

          {/* FAQs Tab Content */}
          <TabsContent value="faqs" className="mt-6 space-y-6 p-1">
            {totalFaqCount === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No FAQs found</AlertTitle>
                <AlertDescription>
                  Get started by adding your first FAQ.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {allFaqs?.map(
                  (category: {
                    faqItems: {
                      id: string;
                      question: string;
                      answer: string;
                      categoryId: string;
                    }[];
                    id: string;
                    title: string;
                  }) =>
                    category.faqItems.length > 0 && (
                      <Card key={category.id} className="overflow-hidden">
                        <CardHeader className="border-b bg-gray-50 pb-2">
                          <CardTitle className="flex items-center justify-between text-lg">
                            <span>{category.title}</span>
                            <Badge
                              variant="outline"
                              className="bg-white font-normal"
                            >
                              {category.faqItems.length}{" "}
                              {category.faqItems.length === 1 ? "FAQ" : "FAQs"}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            {category.faqItems.map(
                              (faq: {
                                id: string;
                                question: string;
                                answer: string;
                                categoryId?: string;
                              }) => (
                                <AccordionItem
                                  key={faq.id}
                                  value={faq.id}
                                  className="border-b px-4 hover:bg-gray-50 sm:px-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <AccordionTrigger className="py-4 text-sm font-medium sm:text-base">
                                      {faq.question}
                                    </AccordionTrigger>
                                    <div className="flex gap-1 sm:mr-6 sm:gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-black hover:bg-black/75 hover:text-white sm:h-8 sm:w-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditFaqItemDialog({
                                            ...faq,
                                            categoryId: faq.categoryId ?? "",
                                          });
                                        }}
                                      >
                                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="sr-only">Edit</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-red-500 hover:text-white sm:h-8 sm:w-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteFaqItem(
                                            faq.id,
                                            faq.question,
                                          );
                                        }}
                                      >
                                        <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    </div>
                                  </div>
                                  <AccordionContent className="pb-4 pt-2">
                                    <div className="prose prose-sm max-w-none rounded-md border bg-white p-4 shadow-sm dark:prose-invert sm:p-5">
                                      {faq.answer
                                        .split("\n")
                                        .map(
                                          (
                                            paragraph:
                                              | string
                                              | number
                                              | bigint
                                              | boolean
                                              | ReactElement<
                                                  unknown,
                                                  | string
                                                  | JSXElementConstructor<unknown>
                                                >
                                              | Iterable<ReactNode>
                                              | ReactPortal
                                              | Promise<AwaitedReactNode>
                                              | null
                                              | undefined,
                                            idx: Key | null | undefined,
                                          ) => (
                                            <p
                                              key={idx}
                                              className="mb-2 text-sm last:mb-0 sm:text-base"
                                            >
                                              {paragraph}
                                            </p>
                                          ),
                                        )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ),
                            )}
                          </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-center border-t bg-gray-50 p-4">
                          <Button
                            variant="outline"
                            className="gap-2 border border-gray-300 bg-white hover:bg-gray-100"
                            onClick={() =>
                              openCreateFaqItemDialog(String(category.id))
                            }
                          >
                            <Plus className="h-4 w-4" /> Add FAQ to this
                            category
                          </Button>
                        </CardFooter>
                      </Card>
                    ),
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below"
                : "Enter details for the new category"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter category title"
                value={editingCategory ? editingCategory.title : newCategory}
                onChange={(e) =>
                  editingCategory
                    ? setEditingCategory({
                        ...editingCategory,
                        title: e.target.value,
                      })
                    : setNewCategory(e.target.value)
                }
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Item Dialog */}
      <Dialog open={faqItemDialogOpen} onOpenChange={setFaqItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingFaqItem ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
            <DialogDescription>
              {editingFaqItem
                ? "Update the FAQ details below"
                : "Enter details for the new FAQ"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={
                  editingFaqItem
                    ? editingFaqItem.categoryId
                    : newFaqItem.categoryId
                }
                onValueChange={(value) =>
                  editingFaqItem
                    ? setEditingFaqItem({
                        ...editingFaqItem,
                        categoryId: value,
                      })
                    : setNewFaqItem({
                        ...newFaqItem,
                        categoryId: value,
                      })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {allFaqs?.map((category: { id: string; title: string }) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="Enter FAQ question"
                value={
                  editingFaqItem ? editingFaqItem.question : newFaqItem.question
                }
                onChange={(e) =>
                  editingFaqItem
                    ? setEditingFaqItem({
                        ...editingFaqItem,
                        question: e.target.value,
                      })
                    : setNewFaqItem({
                        ...newFaqItem,
                        question: e.target.value,
                      })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                placeholder="Enter FAQ answer"
                value={
                  editingFaqItem ? editingFaqItem.answer : newFaqItem.answer
                }
                onChange={(e) =>
                  editingFaqItem
                    ? setEditingFaqItem({
                        ...editingFaqItem,
                        answer: e.target.value,
                      })
                    : setNewFaqItem({
                        ...newFaqItem,
                        answer: e.target.value,
                      })
                }
                rows={5}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Use line breaks for paragraphs. HTML formatting is supported.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setFaqItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={
                editingFaqItem ? handleUpdateFaqItem : handleCreateFaqItem
              }
              disabled={createFaqItem.isPending || updateFaqItem.isPending}
            >
              {(createFaqItem.isPending || updateFaqItem.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingFaqItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
