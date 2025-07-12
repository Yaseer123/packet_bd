"use client";

import { Input } from "@/components/ui/input";
import Image from "next/image";

import { uploadFile } from "@/app/actions/file";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductImageStore } from "@/context/admin-context/ProductImageProvider";
import { generateSKU } from "@/lib/utils";
import type { CategoryAttribute } from "@/schemas/categorySchema";
import { updateProductSchema } from "@/schemas/productSchema";
import { api } from "@/trpc/react";
import type { Variant, Variant as VariantType } from "@/types/ProductType";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import { IoMdClose } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import RichEditor from "../rich-editor";
import DndImageGallery from "../rich-editor/DndImageGallery";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { hexToIColor } from "./AddProduct";
import PreSelectedCategory from "./PreSelectedCategory";

// Sortable item component for specifications
function SortableSpecificationItem({
  id,
  spec,
  index,
  onRemove,
  onChange,
}: {
  id: string;
  spec: { key: string; value: string };
  index: number;
  onRemove: (index: number) => void;
  onChange: (index: number, field: "key" | "value", value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 flex items-center gap-2 rounded-md bg-gray-50 p-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Key"
        value={spec.key}
        onChange={(e) => onChange(index, "key", e.target.value)}
      />
      <Input
        type="text"
        placeholder="Value"
        value={spec.value}
        onChange={(e) => onChange(index, "value", e.target.value)}
      />
      <Button variant="destructive" onClick={() => onRemove(index)}>
        Remove
      </Button>
    </div>
  );
}

export default function EditProductForm({ productId }: { productId: string }) {
  const [product] = api.product.getProductByIdAdmin.useSuspenseQuery({
    id: productId,
  });

  const router = useRouter();
  const selectedCategoriesRef = useRef<(string | null)[]>([]);

  const [title, setTitle] = useState(product?.title ?? "");
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? "",
  );
  const [price, setPrice] = useState(product?.price ?? 0);
  const [discountedPrice, setDiscountedPrice] = useState<number>(
    Number(product?.discountedPrice ?? 0),
  );
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [pending, setPending] = useState(false);
  const [imageId] = useState(product?.imageId ?? uuid());
  const [descriptionImageId] = useState(product?.descriptionImageId ?? uuid());
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId ?? "",
  );
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<
    number | undefined
  >(product?.estimatedDeliveryTime ?? undefined);
  // Remove the published state

  // Add states for category attributes
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string | number | boolean>
  >({});

  // Convert specifications object to array format for drag and drop
  const [specifications, setSpecifications] = useState<
    Array<{ key: string; value: string }>
  >(() => {
    const attrs = product?.attributes as Record<string, string> | undefined;
    return attrs
      ? Object.entries(attrs).map(([key, value]) => ({ key, value }))
      : [];
  });

  const { loadImages, images } = useProductImageStore();
  const [showImageGallery, setShowImageGallery] = useState("");

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load category attributes when component mounts or category changes
  const [categories] = api.category.getAll.useSuspenseQuery();

  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrand, setCustomBrand] = useState("");

  useEffect(() => {
    if (categoryId) {
      // Find the category in the tree structure
      const findCategory = (
        cats: typeof categories,
        id: string,
      ): (typeof categories)[0] | undefined => {
        for (const category of cats) {
          if (category.id === id) {
            return category;
          }
          if (category.subcategories?.length) {
            const found = findCategory(category.subcategories, id);
            if (found) return found;
          }
        }
        return undefined;
      };

      const category = findCategory(categories, categoryId);

      if (category?.attributes) {
        // Handle both string and array formats for attributes
        if (typeof category.attributes === "string") {
          try {
            const parsedAttributes = JSON.parse(
              category.attributes,
            ) as CategoryAttribute[];
            setAttributes(parsedAttributes);
          } catch (error) {
            console.error("Failed to parse category attributes:", error);
            setAttributes([]);
          }
        } else if (Array.isArray(category.attributes)) {
          setAttributes(category.attributes);
        } else {
          setAttributes([]);
        }
      } else {
        setAttributes([]);
      }
    }
  }, [categoryId, categories]);

  // Initialize attribute values from product data
  useEffect(() => {
    if (product?.attributes) {
      // Check if there are any category attributes in the existing product
      const productData = product.attributes as {
        categoryAttributes?: Record<string, string | number | boolean>;
      };

      if (productData.categoryAttributes) {
        setAttributeValues(productData.categoryAttributes);
      }
    }
  }, [product]);

  // Initialize attributeValues when attributes change
  useEffect(() => {
    // Only run this effect when attributes change, not when attributeValues changes
    const initialValues: Record<string, string | number | boolean> = {};

    attributes.forEach((attr) => {
      // Check if we already have a value for this attribute from the product
      if (attributeValues[attr.name] !== undefined) {
        initialValues[attr.name] = attributeValues[attr.name] ?? "";
      } else {
        initialValues[attr.name] = "";
      }
    });

    // Only update if there are differences to avoid infinite loops
    const needsUpdate = attributes.some(
      (attr) => initialValues[attr.name] !== attributeValues[attr.name],
    );

    if (needsUpdate) {
      setAttributeValues((prev) => ({
        ...prev,
        ...initialValues,
      }));
    }
  }, [attributeValues, attributes]); // Remove attributeValues from dependencies

  const handleAttributeChange = (
    name: string,
    value: string | number | boolean,
  ) => {
    setAttributeValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    void (async () => {
      try {
        if (imageId && product?.images) {
          await loadImages(imageId, product.images);
        }
      } catch (error) {
        console.error("Failed to load images:", error);
      }
    })();
  }, [loadImages, imageId, product?.images]);

  const handleShowImageGallery = (state: string) => {
    if (state) {
      // Clear previous images when opening gallery
      setShowImageGallery(state);

      // Load images for the new gallery
      void (async () => {
        try {
          await loadImages(state, product?.images ?? []);
        } catch (error) {
          console.error("Failed to load images for gallery:", error);
        }
      })();
    } else {
      setShowImageGallery("");
    }
  };

  useEffect(() => {
    const name = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setSlug(name);
  }, [setSlug, title]);

  const updateProduct = api.product.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      selectedCategoriesRef.current = [];
      router.push("/admin/product");
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to update product");
    },
    onSettled: () => {
      setPending(false);
    },
  });

  const handleAddSpecification = () => {
    setSpecifications((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleSpecificationChange = (
    index: number,
    fieldName: "key" | "value",
    value: string,
  ) => {
    setSpecifications((prev) => {
      const updated = [...prev];
      const currentSpec = updated[index];
      if (!currentSpec) return updated;

      updated[index] = {
        key: fieldName === "key" ? value : currentSpec.key,
        value: fieldName === "value" ? value : currentSpec.value,
      };
      return updated;
    });
  };

  const handleRemoveSpecification = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSpecifications((items) => {
        const oldIndex = items.findIndex(
          (_, index) => `spec-${index}` === active.id,
        );
        const newIndex = items.findIndex(
          (_, index) => `spec-${index}` === over.id,
        );

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Add errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper: validate a single field
  function validateField(field: string, value: unknown) {
    try {
      updateProductSchema.shape[
        field as keyof typeof updateProductSchema.shape
      ].parse(value);
      return "";
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "errors" in e &&
        Array.isArray((e as { errors?: unknown }).errors)
      ) {
        return (
          (e as { errors?: { message?: string }[] }).errors?.[0]?.message ??
          "Invalid value"
        );
      }
      return "Invalid value";
    }
  }

  // Helper: validate all fields
  function validateAllFields() {
    // List all fields in updateProductSchema
    const allFields = [
      "title",
      "slug",
      "shortDescription",
      "price",
      "discountedPrice",
      "stock",
      "brand",
      "imageId",
      "images",
      "categoryId",
      "descriptionImageId",
      "attributes",
      "estimatedDeliveryTime",
      "categoryAttributes",
      // description is handled separately
    ];
    const newErrors: Record<string, string> = {};
    const parsedErrors: Record<string, string> = {};
    try {
      updateProductSchema.parse({
        id: productId,
        title,
        slug,
        shortDescription,
        price,
        discountedPrice,
        stock,
        brand,
        imageId,
        images: images.map((image) => image.src),
        categoryId,
        descriptionImageId,
        attributes: specifications.reduce(
          (acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
        estimatedDeliveryTime,
        categoryAttributes: attributeValues,
        description: "", // RichEditor content, validated separately if needed
      });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "errors" in e &&
        Array.isArray((e as { errors?: unknown }).errors)
      ) {
        for (const err of (
          e as { errors: { path?: string[]; message?: string }[] }
        ).errors ?? []) {
          if (err?.path?.[0]) {
            parsedErrors[err.path[0]] = err.message ?? "Invalid value";
          }
        }
      }
    }
    // Set all fields, even if no error
    for (const field of allFields) {
      newErrors[field] = parsedErrors[field] ?? "";
    }
    // Custom error for categoryId if not selected
    if (!categoryId) {
      newErrors.categoryId = "Category is required.";
    }
    return newErrors;
  }

  // Real-time validation handlers
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setErrors((prev) => ({
      ...prev,
      title: validateField("title", e.target.value),
    }));
  }
  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setErrors((prev) => ({
      ...prev,
      slug: validateField("slug", e.target.value),
    }));
  }
  function handleShortDescriptionChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    setShortDescription(e.target.value);
    setErrors((prev) => ({
      ...prev,
      shortDescription: validateField("shortDescription", e.target.value),
    }));
  }
  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value ? Number(e.target.value) : 0;
    setPrice(val);
    setErrors((prev) => ({ ...prev, price: validateField("price", val) }));
  }
  function handleDiscountedPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value ? Number(e.target.value) : 0;
    setDiscountedPrice(val);
    setErrors((prev) => ({ ...prev, discountedPrice: "" })); // Not required
  }
  function handleStockChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value ? Number(e.target.value) : 0;
    setStock(val);
    setErrors((prev) => ({ ...prev, stock: validateField("stock", val) }));
  }
  function handleEstimatedDeliveryTimeChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setEstimatedDeliveryTime(val);
    setErrors((prev) => ({ ...prev, estimatedDeliveryTime: "" })); // Optional
  }

  // Add state for default product color and size
  const [defaultColorName, setDefaultColorName] = useState(
    product?.defaultColor ?? "",
  );
  const [defaultColorHex, setDefaultColorHex] = useColor(
    product?.defaultColorHex ?? "#ffffff",
  );
  const [defaultSize, setDefaultSize] = useState(product?.defaultSize ?? "");

  // Variants state
  const normalizeVariants = (variants: unknown): Variant[] => {
    if (Array.isArray(variants)) {
      // Ensure all items are objects (not null, not string/number)
      return variants.filter(
        (v): v is Variant =>
          v !== null && typeof v === "object" && !Array.isArray(v),
      );
    }
    if (typeof variants === "string") {
      try {
        const parsed: unknown = JSON.parse(variants);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v): v is Variant =>
              v !== null && typeof v === "object" && !Array.isArray(v),
          );
        }
      } catch {
        return [];
      }
      return [];
    }
    return [];
  };
  const [enableVariants, setEnableVariants] = useState(
    Array.isArray(product?.variants) && product.variants.length > 0,
  );
  const [variants, setVariants] = useState<Variant[]>(
    normalizeVariants(product?.variants).map((v) => ({
      ...v,
      colorName: v.colorName ?? "",
      colorHex: v.colorHex ?? "#ffffff",
      images: v.images ?? [],
      imageId: v.imageId ?? uuid(),
    })),
  );
  const [variantGalleryOpen, setVariantGalleryOpen] = useState(false);
  const [variantGalleryIdx, setVariantGalleryIdx] = useState<number | null>(
    null,
  );

  const handleVariantChange = (
    index: number,
    field: string,
    value: string | number | undefined,
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const handleVariantImageGallery = (index: number) => {
    setVariantGalleryIdx(index);
    setVariantGalleryOpen(true);
  };
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        price: undefined,
        discountedPrice: undefined,
        stock: undefined,
        images: [],
        imageId: uuid(),
      },
    ]);
  };
  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };
  const handleVariantImagesUpdate = (index: number, newImages: string[]) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], images: newImages };
      return updated;
    });
  };

  const handleSubmit = async (content: string) => {
    setPending(true);
    const newErrors = validateAllFields();
    setErrors(newErrors);
    const errorMessages = Object.values(newErrors).filter(Boolean);
    if (errorMessages.length > 0) {
      setPending(false);
      toast.error(errorMessages.join(" | "));
      return;
    }
    // Convert specifications array back to object for submission
    const specsObject = specifications.reduce(
      (acc, { key, value }) => {
        if (key) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );
    // Log the image order being submitted to database
    console.log(
      "Updating product with images in order:",
      images.map((img) => img.src),
    );
    updateProduct.mutate({
      id: productId,
      images: images.map((image) => image.src),
      descriptionImageId,
      title,
      shortDescription,
      price,
      discountedPrice,
      slug,
      categoryId: categoryId,
      description: content,
      attributes: specsObject, // Only include specifications here
      categoryAttributes: attributeValues, // Pass category attributes separately
      stock,
      brand,
      estimatedDeliveryTime: estimatedDeliveryTime,
      defaultColor: defaultColorName,
      defaultColorHex: defaultColorHex.hex,
      defaultSize,
      variants:
        enableVariants && variants.length > 0
          ? variants.map((v) => ({
              colorName: typeof v.colorName === "string" ? v.colorName : "",
              colorHex: typeof v.colorHex === "string" ? v.colorHex : "",
              size: typeof v.size === "string" ? v.size : "",
              images: Array.isArray(v.images)
                ? v.images.filter(
                    (img): img is string => typeof img === "string",
                  )
                : [],
              price:
                v.price !== undefined && v.price !== null
                  ? Number(v.price)
                  : undefined,
              discountedPrice:
                v.discountedPrice !== undefined && v.discountedPrice !== null
                  ? Number(v.discountedPrice)
                  : undefined,
              stock:
                v.stock !== undefined && v.stock !== null
                  ? Number(v.stock)
                  : undefined,
              sku: generateSKU({
                categoryName: "XX", // TODO: Replace with actual category name variable if available
                productId: productId,
                color:
                  typeof v.colorName === "string" ? v.colorName : "UNNAMED",
                size: typeof v.size === "string" ? v.size : undefined,
              }),
            }))
          : undefined,
    });
  };

  // Add state for the specification rich editor
  const [specRichContent, setSpecRichContent] = useState("");

  const { data: brands = [], isLoading: brandsLoading } =
    api.product.getBrandsByCategory.useQuery({});
  useEffect(() => {
    if (brand && brands.length > 0 && !brands.includes(brand)) {
      setIsCustomBrand(true);
      setCustomBrand(brand);
    } else {
      setIsCustomBrand(false);
      setCustomBrand("");
    }
  }, [brand, brands]);

  if (!product) return null;

  return (
    <RichEditor
      content={product.description ?? ""}
      handleSubmit={handleSubmit}
      imageId={descriptionImageId}
      pending={pending}
      submitButtonText="Update Product"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Product Title</Label>
          <Input
            type="text"
            placeholder="Title"
            value={title}
            onChange={handleTitleChange}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            type="text"
            placeholder="Slug"
            value={slug}
            onChange={handleSlugChange}
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
          )}
        </div>
        <div>
          <Label>Short Description</Label>
          <Textarea
            placeholder="Short Description"
            value={shortDescription}
            onChange={handleShortDescriptionChange}
          />
          {errors.shortDescription && (
            <p className="mt-1 text-sm text-red-500">
              {errors.shortDescription}
            </p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <PreSelectedCategory
            targetCategory={categoryId}
            setCategoryId={setCategoryId}
          />
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
          )}
        </div>
        <div>
          <Label>Price</Label>
          <Input
            type="number"
            placeholder="Price"
            value={price === 0 ? "" : price}
            onChange={handlePriceChange}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price}</p>
          )}
        </div>
        <div>
          <Label>Discounted Price</Label>
          <Input
            type="number"
            placeholder="Discounted Price"
            value={discountedPrice === 0 ? "" : discountedPrice}
            onChange={handleDiscountedPriceChange}
          />
        </div>
        <div>
          <Label>Stock</Label>
          <Input
            type="number"
            placeholder="Stock"
            value={stock === 0 ? "" : stock}
            onChange={handleStockChange}
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
          )}
        </div>
        <div>
          <Label>Brand</Label>
          {brandsLoading ? (
            <div className="text-sm text-gray-500">Loading brands...</div>
          ) : (
            <>
              <Select
                value={isCustomBrand ? "__custom__" : brand}
                onValueChange={(value) => {
                  if (value === "__custom__") {
                    setIsCustomBrand(true);
                    setBrand("");
                  } else {
                    setIsCustomBrand(false);
                    setBrand(value);
                  }
                }}
              >
                <SelectTrigger className={errors.brand ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a brand or add new" />
                </SelectTrigger>
                <SelectContent>
                  {brands.filter(Boolean).map((b: string) => (
                    <SelectItem key={b} value={b} className="w-full">
                      {b}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__custom__"
                    className="w-full text-blue-600"
                  >
                    Other / New Brand...
                  </SelectItem>
                </SelectContent>
              </Select>
              {isCustomBrand && (
                <Input
                  type="text"
                  placeholder="Enter new brand name"
                  value={customBrand}
                  onChange={(e) => {
                    setCustomBrand(e.target.value);
                    setBrand(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      brand: validateField("brand", e.target.value),
                    }));
                  }}
                  className={errors.brand ? "border-red-500" : ""}
                />
              )}
            </>
          )}
          {errors.brand && (
            <p className="mt-1 text-sm text-red-500">{errors.brand}</p>
          )}
        </div>
        <div>
          <Label>Estimated Delivery Time (Days)</Label>
          <Input
            type="number"
            placeholder="Delivery Time in Days"
            min="1"
            value={estimatedDeliveryTime ?? ""}
            onChange={handleEstimatedDeliveryTimeChange}
          />
        </div>

        <div className="mt-auto flex flex-col gap-y-1">
          <Label>
            Images
            <span className="ml-2 text-xs text-gray-500">
              (Recommended: 1000x1000px or larger, square)
            </span>
          </Label>
          <div className="mb-4">
            <Button onClick={() => handleShowImageGallery(imageId)}>
              Show Image Gallery
            </Button>
            {showImageGallery && (
              <DndImageGallery
                imageId={imageId}
                onClose={handleShowImageGallery}
              />
            )}
          </div>
        </div>

        {/* Category Attribute Fields */}
        {attributes.length > 0 && (
          <div className="col-span-2 mt-4">
            <h3 className="mb-3 text-lg font-medium">Category Attributes</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {attributes.map((attr) => (
                <div key={attr.name} className="flex flex-col gap-2">
                  <Label htmlFor={attr.name}>
                    {attr.name}{" "}
                    {attr.required && <span className="text-red-500">*</span>}
                  </Label>
                  {attr.type === "select" &&
                    attr.options &&
                    attr.options.length > 0 && (
                      <Select
                        value={
                          attributeValues[attr.name]?.toString() ?? "__none__"
                        }
                        onValueChange={(value) =>
                          handleAttributeChange(
                            attr.name,
                            value === "__none__" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${attr.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {attr.options.filter(Boolean).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications Section */}
        <div className="col-span-2">
          <Label>Specifications</Label>
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={specifications.map((_, index) => `spec-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                {specifications.map((spec, index) => (
                  <SortableSpecificationItem
                    key={`spec-${index}`}
                    id={`spec-${index}`}
                    spec={spec}
                    index={index}
                    onChange={handleSpecificationChange}
                    onRemove={handleRemoveSpecification}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Button onClick={handleAddSpecification}>Add Specification</Button>
            <div className="mt-4">
              <Label className="mb-1 block">
                Or paste/write specifications below (format: Key: Value per
                line)
              </Label>
              <Textarea
                placeholder={`Color: Red\nSize: Large\nMaterial: Cotton`}
                value={specRichContent}
                onChange={(e) => setSpecRichContent(e.target.value)}
                className="min-h-[100px] w-full"
              />
              <Button
                className="mt-2 w-full"
                type="button"
                onClick={() => {
                  // Parse textarea content and add to specifications
                  const htmlLines = specRichContent
                    .split(/\n+/)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);
                  setSpecifications((prev) => {
                    const existingKeys = new Set(
                      prev.map((s) => s.key.trim().toLowerCase()),
                    );
                    const newSpecs = htmlLines
                      .map((line) => {
                        if (line.includes(":")) {
                          const [key, ...rest] = line.split(":");
                          if (typeof key === "string") {
                            return {
                              key: key.trim(),
                              value: rest.join(":").trim(),
                            };
                          }
                        } else {
                          return { key: line, value: "" };
                        }
                        return null;
                      })
                      .filter(
                        (spec): spec is { key: string; value: string } =>
                          !!spec &&
                          typeof spec.key === "string" &&
                          spec.key.trim().length > 0 &&
                          !existingKeys.has(spec.key.trim().toLowerCase()),
                      );
                    return [...prev, ...newSpecs];
                  });
                  setSpecRichContent("");
                }}
              >
                Add from Textarea
              </Button>
            </div>
          </div>
        </div>

        {/* Default Product Color/Size */}
        <div>
          <Label>Default Product Color (optional)</Label>
          <Input
            type="text"
            placeholder="Color Name (e.g. Red, Sky Blue)"
            value={defaultColorName}
            onChange={(e) => setDefaultColorName(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            <ColorPicker
              color={defaultColorHex}
              onChange={setDefaultColorHex}
              hideInput={["rgb", "hsv"]}
            />
            <span
              style={{
                display: "inline-block",
                width: 32,
                height: 32,
                backgroundColor: defaultColorHex.hex,
                borderRadius: "50%",
                border: "1px solid #ccc",
              }}
              aria-label={defaultColorName}
              title={defaultColorName}
            />
            <span>
              {defaultColorName} ({defaultColorHex.hex})
            </span>
          </div>
        </div>
        <div>
          <Label>Default Product Size (optional)</Label>
          <Input
            type="text"
            placeholder="Size"
            value={defaultSize}
            onChange={(e) => setDefaultSize(e.target.value)}
          />
        </div>

        {/* Variants Toggle */}
        <div className="col-span-2 mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableVariants}
            onChange={(e) => setEnableVariants(e.target.checked)}
            id="enable-variants"
          />
          <Label htmlFor="enable-variants" className="text-base">
            Enable color/size/image variants
          </Label>
        </div>

        {/* Variants UI */}
        {enableVariants && (
          <div className="col-span-2 mt-2 flex flex-col gap-4 rounded-md border bg-gray-50 p-3">
            <Label className="text-base">Product Variants</Label>
            {variants.map((variant, idx) => (
              <VariantRow
                key={idx}
                variant={variant}
                idx={idx}
                handleVariantChange={handleVariantChange}
                handleVariantImageGallery={handleVariantImageGallery}
                handleRemoveVariant={handleRemoveVariant}
                handleVariantImagesUpdate={handleVariantImagesUpdate}
              />
            ))}
            <Button type="button" onClick={handleAddVariant} className="w-40">
              Add Variant
            </Button>
          </div>
        )}

        {/* Variant Image Gallery Modal */}
        {variantGalleryOpen &&
          variantGalleryIdx !== null &&
          variants[variantGalleryIdx] !== undefined && (
            <VariantImageGalleryModal
              variantIndex={variantGalleryIdx}
              images={variants[variantGalleryIdx]?.images ?? []}
              onClose={() => {
                setVariantGalleryOpen(false);
              }}
              onImagesChange={(imgs: string[]) =>
                handleVariantImagesUpdate(variantGalleryIdx, imgs)
              }
            />
          )}
      </div>
    </RichEditor>
  );
}

// VariantImageGalleryModal for uploading images to a specific variant
function VariantImageGalleryModal({
  variantIndex,
  images,
  onClose,
  onImagesChange,
}: {
  variantIndex: number;
  images: string[];
  onClose: () => void;
  onImagesChange: (imgs: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const handleUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        // Use a folder for variant images for clarity
        const res = await uploadFile(formData, `variant-${variantIndex}`);
        if (res?.secure_url) {
          newImages.push(res.secure_url);
        }
      }
      onImagesChange([...newImages, ...images]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
    setIsUploading(false);
  };
  const handleRemove = (img: string) => {
    onImagesChange(images.filter((i) => i !== img));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-md bg-white p-6">
        <button className="absolute right-4 top-4" onClick={onClose}>
          <IoMdClose size={24} />
        </button>
        <h2 className="mb-4 text-lg font-semibold">
          Upload Images for Variant
        </h2>
        {/* Styled upload area */}
        <label
          htmlFor="variant-image-upload"
          className="mb-4 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
        >
          <IoCloudUploadOutline size={30} className="text-gray-500" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500">Image file</p>
          <div className="mt-1 text-xs text-gray-400">
            Recommended size: 1000x1000px or larger, square image
          </div>
          <input
            id="variant-image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              if (e.target.files) await handleUpload(e.target.files);
            }}
            disabled={isUploading}
          />
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <Image
                src={img}
                alt="variant-img"
                width={48}
                height={48}
                className="h-12 w-12 rounded object-cover"
              />
              <button
                className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
                onClick={() => handleRemove(img)}
                type="button"
              >
                <IoMdClose size={16} />
              </button>
            </div>
          ))}
        </div>
        {isUploading && (
          <div className="mb-2 text-sm text-gray-500">Uploading...</div>
        )}
        <Button onClick={onClose} className="mt-2 w-full">
          Done
        </Button>
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  idx,
  handleVariantChange,
  handleVariantImageGallery,
  handleRemoveVariant,
  handleVariantImagesUpdate: _handleVariantImagesUpdate,
}: {
  variant: VariantType;
  idx: number;
  handleVariantChange: (
    idx: number,
    field: string,
    value: string | number | undefined,
  ) => void;
  handleVariantImageGallery: (idx: number) => void;
  handleRemoveVariant: (idx: number) => void;
  handleVariantImagesUpdate: (idx: number, imgs: string[]) => void;
}) {
  const [variantColor, setVariantColor] = useColor(
    variant.colorHex ?? "#ffffff",
  );
  useEffect(() => {
    if (variant.colorHex !== variantColor.hex) {
      const color = hexToIColor(variant.colorHex ?? "#ffffff");
      setVariantColor(color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.colorHex]);

  const safeImages = Array.isArray(variant.images)
    ? variant.images.filter((img): img is string => typeof img === "string")
    : [];
  const safeColorName =
    typeof variant.colorName === "string" ? variant.colorName : "";
  const safeColorHex =
    typeof variant.colorHex === "string" ? variant.colorHex : "";
  const safeSize = typeof variant.size === "string" ? variant.size : "";

  return (
    <div className="mb-2 flex flex-col items-center gap-2 border-b pb-2 md:flex-row md:flex-wrap md:items-center md:gap-4 md:overflow-x-auto">
      <Input
        type="text"
        placeholder="Color Name (optional)"
        value={safeColorName}
        onChange={(e) => handleVariantChange(idx, "colorName", e.target.value)}
        className="w-32"
      />
      <ColorPicker
        color={variantColor}
        onChange={(color) => {
          setVariantColor(color);
          handleVariantChange(idx, "colorHex", color.hex);
        }}
        hideInput={["rgb", "hsv"]}
      />
      <span
        style={{
          display: "inline-block",
          width: 24,
          height: 24,
          backgroundColor: safeColorHex,
          borderRadius: "50%",
          border: "1px solid #ccc",
        }}
        aria-label={safeColorName}
        title={safeColorName}
      />
      <span>
        {safeColorName} ({safeColorHex})
      </span>
      <Input
        type="text"
        placeholder="Size (optional)"
        value={safeSize}
        onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
        className="w-32"
      />
      <Input
        type="number"
        placeholder="Price (optional)"
        value={variant.price ?? ""}
        onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
        className="w-32"
      />
      <Input
        type="number"
        placeholder="Discounted Price (optional)"
        value={variant.discountedPrice ?? ""}
        onChange={(e) =>
          handleVariantChange(idx, "discountedPrice", e.target.value)
        }
        className="w-32"
      />
      <Input
        type="number"
        placeholder="Stock (optional)"
        value={variant.stock ?? ""}
        onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
        className="w-32"
      />
      <div className="mt-2 flex gap-2 md:ml-auto md:mt-0">
        <Button
          type="button"
          onClick={() => handleVariantImageGallery(idx)}
          className="w-40"
        >
          Add Images
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => handleRemoveVariant(idx)}
        >
          Remove
        </Button>
      </div>
      {/* Show variant images */}
      {safeImages && safeImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeImages.map((img: string, i: number) => (
            <Image
              key={i}
              src={img}
              alt="variant-img"
              width={48}
              height={48}
              className="h-12 w-12 rounded object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
