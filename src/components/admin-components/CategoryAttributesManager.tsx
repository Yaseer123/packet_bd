"use client";

import { removeImage, uploadFile } from "@/app/actions/file";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Database,
  Layout,
  PlusCircle,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Prisma } from "@prisma/client";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import RichEditor from "../rich-editor";

interface CategoryAttributesManagerProps {
  categoryId: string;
}

// Define the attribute schema - restrict to only include select type with options
const attributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.literal("select"), // Only allow "select" type
  options: z.array(z.string()).min(1, "At least one option is required"),
  required: z.boolean().default(false),
});

const attributeFormSchema = z.object({
  attributes: z.array(attributeSchema),
});

const detailsFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

type AttributeFormType = z.infer<typeof attributeFormSchema>;
type DetailsFormType = z.infer<typeof detailsFormSchema>;

export default function CategoryAttributesManager({
  categoryId,
}: CategoryAttributesManagerProps) {
  const { data: category, isLoading } = api.category.getById.useQuery({
    id: categoryId,
  });

  // Replace alert with toast for better notifications
  const { mutate: updateAttributes, isPending: isSavingAttributes } =
    api.category.updateAttributes.useMutation({
      onSuccess: () => {
        toast.success("Category attributes have been updated successfully.");
      },
      onError: (error: { message: string }) => {
        toast.error(error.message || "Failed to update attributes");
      },
    });

  const { mutate: editCategory, isPending: isSavingDetails } =
    api.category.edit.useMutation({
      onSuccess: () => {
        toast.success("Category details have been updated successfully.");
      },
      onError: (error: { message: string }) => {
        toast.error(error.message || "Failed to update category details");
      },
    });

  // Add mutation for removing all attributes from database
  const { mutate: removeAllAttributes, isPending: isRemovingAllAttributes } =
    api.category.updateAttributes.useMutation({
      onSuccess: () => {
        toast.success("All attributes have been removed from the category.");
        attributesForm.reset({ attributes: [] });
        setIsDeleteDialogOpen(false);
      },
      onError: (error: { message: string }) => {
        toast.error(error.message || "Failed to remove attributes");
      },
    });

  // Add mutation for removing a single attribute
  const {
    mutate: removeSingleAttribute,
    isPending: isRemovingSingleAttribute,
  } = api.category.removeAttribute.useMutation({
    onSuccess: (
      data: { id: string; attributes: Prisma.JsonValue },
      variables,
    ) => {
      toast.success("Attribute has been removed successfully.");
      // Update the form with the returned attributes
      try {
        let attrs: AttributeFormType["attributes"] = [];
        if (typeof data.attributes === "string") {
          attrs = JSON.parse(
            data.attributes,
          ) as AttributeFormType["attributes"];
        } else if (Array.isArray(data.attributes)) {
          attrs = data.attributes as AttributeFormType["attributes"];
        }
        attributesForm.reset({ attributes: attrs });
      } catch (error) {
        console.error("Failed to parse updated attributes:", error);
      }
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to remove attribute");
    },
  });

  // State for image handling
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const _isRemovingImage = false;

  // State for handling attribute removal confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Initialize form for category details
  const detailsForm = useForm<DetailsFormType>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Initialize form for attributes
  const attributesForm = useForm<AttributeFormType>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      attributes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: attributesForm.control,
    name: "attributes",
  });

  const [descriptionContent, setDescriptionContent] = useState("");
  const [descriptionImageId] = useState(() => uuid());

  // Set form values and state when category data is loaded
  useEffect(() => {
    if (category) {
      detailsForm.reset({
        name: category.name,
        description: category.description ?? "",
      });
      setDescriptionContent(category.description ?? "");
      setImagePreview(category.image);

      try {
        if (typeof category.attributes === "string") {
          // Try to parse if it's a string
          const attrs = JSON.parse(
            category.attributes,
          ) as AttributeFormType["attributes"];
          if (Array.isArray(attrs)) {
            attributesForm.reset({ attributes: attrs });
          } else {
            attributesForm.reset({ attributes: [] });
            console.warn("Attributes data is not an array");
          }
        } else if (Array.isArray(category.attributes)) {
          // Use directly if it's already an array
          attributesForm.reset({
            attributes: category.attributes as AttributeFormType["attributes"],
          });
        } else {
          attributesForm.reset({ attributes: [] });
          console.warn("No valid attributes data found");
        }
      } catch (error) {
        console.error("Failed to parse category attributes:", error);
        attributesForm.reset({ attributes: [] });
      }
    }
  }, [category, attributesForm, detailsForm]);

  // Save category details
  const onSubmitDetails = async (data: DetailsFormType) => {
    let imageUrl = category?.image ?? null;
    let imageId = category?.imageId ?? null;

    if (newImage) {
      if (imageId) await removeImage(imageId);
      const formData = new FormData();
      formData.append("file", newImage);

      const uploadResponse = await uploadFile(formData);
      if (uploadResponse) {
        imageUrl = uploadResponse.secure_url;
        imageId = uploadResponse.public_id;
      }
    } else if (imagePreview === null && category?.imageId) {
      await removeImage(category.imageId);
      imageUrl = null;
      imageId = null;
    }

    editCategory({
      id: categoryId,
      name: data.name,
      image: imageUrl,
      imageId: imageId,
      description: descriptionContent,
    });
  };

  // Handle attribute form submission
  const onSubmitAttributes = (data: AttributeFormType) => {
    updateAttributes({
      id: categoryId,
      attributes: data.attributes,
    });
  };

  // Handle removing all attributes from database
  const handleRemoveAllAttributes = () => {
    removeAllAttributes({
      id: categoryId,
      attributes: [],
    });
  };

  // Handle removing a single attribute
  const handleRemoveSingleAttribute = (index: number) => {
    const currentAttributes = attributesForm.getValues().attributes;
    const attributeName = currentAttributes[index]?.name;

    if (category && attributeName) {
      removeSingleAttribute({
        categoryId: categoryId,
        attributeName: attributeName,
      });
    }
  };

  // When adding a new attribute, set type to "select" by default
  const handleAddAttribute = () => {
    append({
      name: "",
      type: "select", // Always "select"
      options: [],
      required: false,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Category not found or has been deleted.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper function to normalize options array
  const normalizeOptions = (options: string[] | undefined | null): string[] => {
    if (!options) return [];
    return options.filter((opt) => opt.trim() !== "");
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="sticky top-0 z-10 flex flex-col items-center justify-between gap-4 bg-background/95 py-4 backdrop-blur sm:flex-row">
        <div className="flex items-center gap-3">
          <Link href="/admin/category">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground">
              Manage category details and attributes
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-2">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span>Category Details</span>
          </TabsTrigger>
          <TabsTrigger value="attributes" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Category Attributes</span>
          </TabsTrigger>
        </TabsList>

        {/* Category Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card className="w-full min-w-0 max-w-full overflow-x-auto border p-2 shadow-sm md:p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Layout className="h-5 w-5 text-primary" />
                Edit Category Details
              </CardTitle>
              <CardDescription>
                Update the basic details for this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...detailsForm}>
                <form
                  onSubmit={detailsForm.handleSubmit(onSubmitDetails)}
                  className="w-full min-w-0 max-w-full space-y-8"
                >
                  <div className="flex w-full min-w-0 max-w-full flex-col gap-8 md:grid md:grid-cols-2">
                    <div className="w-full min-w-0 max-w-full space-y-8">
                      <FormField
                        control={detailsForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">
                              Category Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter category name"
                                className="h-12 w-full min-w-0 max-w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="mt-4 w-full min-w-0 max-w-full">
                        <FormLabel className="text-base">
                          Description (optional)
                        </FormLabel>
                        <div className="w-full min-w-0 max-w-full">
                          <RichEditor
                            key={category.id}
                            content={descriptionContent}
                            imageId={descriptionImageId}
                            handleSubmit={(html) => setDescriptionContent(html)}
                            pending={isSavingDetails}
                            submitButtonText="Save Description"
                          >
                            <div className="mb-2 text-sm text-gray-500">
                              Enter category description (for SEO, shown at
                              bottom of category page)
                            </div>
                          </RichEditor>
                        </div>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="flex w-full min-w-0 max-w-full items-center justify-center">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative aspect-square max-h-[300px] w-auto overflow-hidden rounded-md border shadow-md"
                        >
                          <Image
                            src={imagePreview}
                            alt="Category preview"
                            fill
                            className="object-cover"
                          />
                        </motion.div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingDetails}
                    className="w-full gap-2 sm:w-auto"
                    size="lg"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingDetails ? "Saving..." : "Save Details"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Attributes Tab */}
        <TabsContent value="attributes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Database className="h-5 w-5 text-primary" />
                Category Attributes
              </CardTitle>
              <CardDescription>
                Define attributes that will be available for products in this
                category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...attributesForm}>
                <form
                  onSubmit={attributesForm.handleSubmit(onSubmitAttributes)}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-medium">
                          Product Attributes
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Attributes help customers filter and find products
                          easily
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddAttribute}
                        className="gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Attribute
                      </Button>
                    </div>

                    {fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Database className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium">
                          No attributes defined
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          Attributes help customers filter and find products.
                          Examples include size, color, material, etc.
                        </p>
                        <Button
                          type="button"
                          onClick={handleAddAttribute}
                          className="mt-4 gap-2"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Your First Attribute
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2">
                        {fields.map((field, index) => (
                          <motion.div
                            key={field.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="overflow-hidden">
                              <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="font-normal"
                                  >
                                    #{index + 1}
                                  </Badge>
                                  <h4 className="font-medium">
                                    {attributesForm.watch(
                                      `attributes.${index}.name`,
                                    ) || "New Attribute"}
                                  </h4>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // If this is an existing attribute in the database, remove it from there
                                    if (
                                      category &&
                                      attributesForm.watch(
                                        `attributes.${index}.name`,
                                      )
                                    ) {
                                      handleRemoveSingleAttribute(index);
                                    } else {
                                      // Otherwise just remove it from the form
                                      remove(index);
                                    }
                                  }}
                                  disabled={isRemovingSingleAttribute}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="space-y-4 p-4">
                                <FormField
                                  control={attributesForm.control}
                                  name={`attributes.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Color, Size, Material..."
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* Always show options field since we're only using select type */}
                                <FormField
                                  control={attributesForm.control}
                                  name={`attributes.${index}.options`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Options</FormLabel>
                                      <FormControl>
                                        <div className="space-y-2">
                                          <Input
                                            placeholder="Add option and press Enter"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                const inputValue =
                                                  e.currentTarget.value.trim();
                                                if (inputValue) {
                                                  const currentOptions =
                                                    normalizeOptions(
                                                      field.value,
                                                    );
                                                  if (
                                                    !currentOptions.includes(
                                                      inputValue,
                                                    )
                                                  ) {
                                                    field.onChange([
                                                      ...currentOptions,
                                                      inputValue,
                                                    ]);
                                                    e.currentTarget.value = "";
                                                  } else {
                                                    toast.error(
                                                      "This option already exists",
                                                    );
                                                  }
                                                }
                                              }
                                            }}
                                          />
                                          <div className="flex flex-wrap gap-2">
                                            {normalizeOptions(field.value).map(
                                              (option, optionIndex) => (
                                                <Badge
                                                  key={optionIndex}
                                                  variant="default"
                                                  className="flex items-center gap-2 bg-primary/90 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/80"
                                                >
                                                  {option}
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      const currentOptions = [
                                                        ...normalizeOptions(
                                                          field.value,
                                                        ),
                                                      ];
                                                      currentOptions.splice(
                                                        optionIndex,
                                                        1,
                                                      );
                                                      field.onChange(
                                                        currentOptions,
                                                      );
                                                    }}
                                                    className="h-5 w-5 rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </Badge>
                                              ),
                                            )}
                                            {normalizeOptions(field.value)
                                              .length === 0 && (
                                              <p className="text-sm text-muted-foreground">
                                                No options added (required)
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </FormControl>
                                      <FormDescription>
                                        Enter an option and press Enter to add
                                        it. At least one option is required.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={attributesForm.control}
                                  name={`attributes.${index}.required`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                          Required
                                        </FormLabel>
                                        <FormDescription>
                                          Make this attribute mandatory for all
                                          products
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {fields.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={isSavingAttributes}
                        size="lg"
                        className="gap-2 sm:w-auto"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingAttributes
                          ? "Saving..."
                          : "Save All Attributes"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="gap-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                        disabled={isRemovingAllAttributes}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isRemovingAllAttributes
                          ? "Removing..."
                          : "Remove All Attributes"}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Confirmation Dialog for removing all attributes */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove All Attributes</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all attributes for this category. Products
                  using these attributes may be affected. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveAllAttributes}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
