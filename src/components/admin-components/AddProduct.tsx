"use client";

import { uploadFile } from "@/app/actions/file";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProductImageStore } from "@/context/admin-context/ProductImageProvider";
import type { CategoryAttribute, CategoryTree } from "@/schemas/categorySchema";
import { productSchema } from "@/schemas/productSchema";
import { api } from "@/trpc/react";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ColorPicker, useColor, type IColor } from "react-color-palette";
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

// Helper to convert hex to IColor
export function hexToIColor(hex: string): IColor {
  return {
    hex,
    rgb: { r: 255, g: 255, b: 255, a: 1 },
    hsv: { h: 0, s: 0, v: 1, a: 1 },
  };
}

// Fix: Use a stricter Variant type for this file
// (If the global Variant type is too loose, override here for UI safety)
type UIVariant = {
  colorName: string;
  colorHex: string;
  size: string;
  price: number;
  discountedPrice: number;
  stock: number;
  images: string[];
  imageId: string;
};

export default function AddProductForm(_unused?: unknown) {
  const router = useRouter();
  const selectedCategoriesRef = useRef<(string | null)[]>([]);

  // Fetch all brands (no categoryId = all brands)
  const { data: brands = [], isLoading: brandsLoading } =
    api.product.getBrandsByCategory.useQuery({});

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [slug, setSlug] = useState("");
  const [stock, setStock] = useState(0); // New state for stock
  const [brand, setBrand] = useState(""); // New state for brand
  const [customBrand, setCustomBrand] = useState(""); // For custom brand input
  const [isCustomBrand, setIsCustomBrand] = useState(false); // Track if custom brand is selected
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<
    number | undefined
  >(undefined);
  const [pending, setPending] = useState(false);
  const [imageId] = useState(uuid());
  const [descriptionImageId] = useState(uuid());
  const [categoryId, setCategoryId] = useState<string>("");
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string | number | boolean>
  >({});

  const [showImageGallery, setShowImageGallery] = useState("");
  const { loadImages, images } = useProductImageStore();

  // Changed from Record to array of objects for drag and drop support
  const [specifications, setSpecifications] = useState<
    Array<{ key: string; value: string }>
  >([]);

  // Add state for the specification rich editor
  const [specTextContent, setSpecTextContent] = useState("");
  const [variantLabel, setVariantLabel] = useState<string>("Size"); // <--- Add this line

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add state for default product color and size
  const [defaultColorName, setDefaultColorName] = useState<string>("");
  const [defaultColorHex, setDefaultColorHex] = useColor("#ffffff");
  const [defaultSize, setDefaultSize] = useState<string>(""); // <-- Add this line

  // [1] --- VARIANT STATE REFACTOR ---
  // Replace old variants state with grouped structure
  // Remove:
  // const [variants, setVariants] = useState<UIVariant[]>([ ... ]);
  // const [enableVariants, setEnableVariants] = useState(false);
  // Add:
  const [enableVariants, setEnableVariants] = useState(false);
  // Color groups: each color has its own sizes
  const [colorGroups, setColorGroups] = useState<
    Array<{
      colorName: string;
      colorHex: string;
      imageId: string;
      images: string[];
      sizes: Array<{
        size: string;
        price: number;
        discountedPrice: number;
        stock: number;
      }>;
    }>
  >([
    // Start with one color group by default if variants enabled
  ]);
  // Default group (no color)
  const [defaultGroup, setDefaultGroup] = useState<{
    imageId: string;
    images: string[];
    sizes: Array<{
      size: string;
      price: number;
      discountedPrice: number;
      stock: number;
    }>;
  }>({
    imageId: uuid(),
    images: [],
    sizes: [],
  });

  // Variant image gallery logic
  const [variantGalleryOpen, setVariantGalleryOpen] = useState(false);
  const [variantGalleryIdx, setVariantGalleryIdx] = useState<number | null>(
    null,
  );

  // Add state for quantity discounts
  const [quantityDiscounts, setQuantityDiscounts] = useState<
    Array<{ minQty: number; maxQty: number; discountPercent: number }>
  >([{ minQty: 1, maxQty: 1, discountPercent: 0 }]);

  // Helper to add a new discount row
  const handleAddDiscountRow = () => {
    setQuantityDiscounts((prev) => [
      ...prev,
      { minQty: 1, maxQty: 1, discountPercent: 0 },
    ]);
  };

  // Helper to update a discount row
  const handleDiscountChange = (
    idx: number,
    field: "minQty" | "maxQty" | "discountPercent",
    value: number,
  ) => {
    setQuantityDiscounts((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  // Helper to remove a discount row
  const handleRemoveDiscountRow = (idx: number) => {
    setQuantityDiscounts((prev) => prev.filter((_, i) => i !== idx));
  };

  // Helper: validate a single field
  function validateField(field: string, value: unknown) {
    try {
      productSchema.shape[field as keyof typeof productSchema.shape].parse(
        value,
      );
      return "";
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "errors" in e &&
        Array.isArray((e as { errors?: unknown }).errors)
      ) {
        // ZodError
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
    // List all fields in productSchema
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
      productSchema.parse({
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

  useEffect(() => {
    void (async () => {
      try {
        await loadImages(imageId);
      } catch (error) {
        console.error("Failed to load images:", error);
      }
    })();
  }, [loadImages, imageId]);

  useEffect(() => {
    const name = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setSlug(name);
  }, [setSlug, title]);

  // Initialize attributeValues when attributes change
  useEffect(() => {
    const initialValues: Record<string, string | number | boolean> = {};
    attributes.forEach((attr) => {
      // Set default values to empty string (optional)
      initialValues[attr.name] = "";
    });
    setAttributeValues(initialValues);
  }, [attributes]);

  const handleAttributeChange = (
    name: string,
    value: string | number | boolean,
  ) => {
    setAttributeValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addProduct = api.product.add.useMutation({
    onSuccess: () => {
      toast.success("Product added successfully");
      selectedCategoriesRef.current = [];
      // Clear form only on success
      setTitle("");
      setShortDescription("");
      setPrice(0);
      setDiscountedPrice(0);
      setSlug("");
      setStock(0);
      setBrand("");
      setEstimatedDeliveryTime(undefined);
      setCategoryId("");
      setAttributes([]);
      setAttributeValues({});
      setSpecifications([]);
      setDefaultColorName("");
      setDefaultColorHex(hexToIColor("#ffffff"));
      // Navigate after clearing
      router.push("/admin/product");
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to add product");
    },
    onSettled: () => {
      setPending(false);
    },
  });

  const [categories] = api.category.getAll.useSuspenseQuery();

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
      // Update the specific field based on fieldName
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

  // Helper to parse and add specs from rich editor
  const addSpecsFromRichEditor = (html: string) => {
    // Split HTML by <br>, </p>, and </div> tags to get logical lines
    const htmlLines = html
      .replace(/<\/?(div|p)[^>]*>/gi, "\n")
      .replace(/<br\s*\/?>(?![\s\S]*<br)/gi, "\n")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setSpecifications((prev) => {
      const existingKeys = new Set(prev.map((s) => s.key.trim().toLowerCase()));
      const newSpecs = htmlLines
        .map((line) => {
          if (line.includes(":")) {
            const [key, ...rest] = line.split(":");
            if (typeof key === "string") {
              return { key: key.trim(), value: rest.join(":").trim() };
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
  };

  // Variant handlers
  // These handlers are no longer needed as variants are managed in state
  // const handleVariantChange = (
  //   index: number,
  //   field: keyof UIVariant,
  //   value: string | number | undefined,
  // ) => {
  //   setVariants((prev) => {
  //     const updated = [...prev];
  //     const prevVariant: UIVariant = updated[index] ?? {
  //       colorName: "",
  //       colorHex: "#ffffff",
  //       size: "",
  //       price: 0,
  //       discountedPrice: 0,
  //       stock: 0,
  //       images: [],
  //       imageId: uuid(),
  //     };
  //     if (
  //       field === "price" ||
  //       field === "discountedPrice" ||
  //       field === "stock"
  //     ) {
  //       updated[index] = {
  //         colorName: prevVariant.colorName,
  //         colorHex: prevVariant.colorHex,
  //         size: prevVariant.size,
  //         price:
  //           field === "price"
  //             ? value === undefined || value === ""
  //               ? 0
  //               : Number(value)
  //             : prevVariant.price,
  //         discountedPrice:
  //           field === "discountedPrice"
  //             ? value === undefined || value === ""
  //               ? 0
  //               : Number(value)
  //             : prevVariant.discountedPrice,
  //         stock:
  //           field === "stock"
  //             ? value === undefined || value === ""
  //               ? 0
  //               : Number(value)
  //             : prevVariant.stock,
  //         images: prevVariant.images,
  //         imageId: prevVariant.imageId,
  //       };
  //     } else {
  //       updated[index] = {
  //         colorName:
  //           field === "colorName"
  //             ? typeof value === "string"
  //               ? value
  //               : ""
  //             : prevVariant.colorName,
  //         colorHex:
  //           field === "colorHex"
  //             ? typeof value === "string"
  //               ? value
  //               : ""
  //             : prevVariant.colorHex,
  //         size:
  //           field === "size"
  //             ? typeof value === "string"
  //               ? value
  //               : ""
  //             : prevVariant.size,
  //         price: prevVariant.price,
  //         discountedPrice: prevVariant.discountedPrice,
  //         stock: prevVariant.stock,
  //         images:
  //           field === "images" && Array.isArray(value)
  //             ? value
  //             : prevVariant.images,
  //         imageId: prevVariant.imageId,
  //       };
  //     }
  //     return updated;
  //   });
  // };
  // const handleVariantImageGallery = (index: number) => {
  //   setVariantGalleryIdx(index);
  //   setVariantGalleryOpen(true);
  // };
  // const handleAddVariant = () => {
  //   setVariants((prev) => [
  //     ...prev,
  //     {
  //       colorName: "",
  //       colorHex: "#ffffff",
  //       size: "",
  //       price: 0,
  //       discountedPrice: 0,
  //       stock: 0,
  //       images: [],
  //       imageId: uuid(),
  //     },
  //   ]);
  // };
  // const handleRemoveVariant = (index: number) => {
  //   setVariants((prev) => prev.filter((_, i) => i !== index));
  // };
  // const handleVariantImagesUpdate = (index: number, newImages: string[]) => {
  //   setVariants((prev) => {
  //     const updated = [...prev];
  //     if (!updated[index]) {
  //       updated[index] = {
  //         colorName: "",
  //         colorHex: "#ffffff",
  //         size: "",
  //         price: 0,
  //         discountedPrice: 0,
  //         stock: 0,
  //         images: Array.isArray(newImages) ? newImages : [],
  //         imageId: uuid(),
  //       };
  //     } else {
  //       const v = updated[index];
  //       updated[index] = {
  //         colorName: v.colorName ?? "",
  //         colorHex: v.colorHex ?? "#ffffff",
  //         size: v.size ?? "",
  //         price: v.price ?? 0,
  //         discountedPrice: v.discountedPrice ?? 0,
  //         stock: v.stock ?? 0,
  //         images: Array.isArray(newImages) ? newImages : [],
  //         imageId: v.imageId ?? uuid(),
  //       };
  //     }
  //     return updated;
  //   });
  // };

  const handleVariantImagesUpdate = (index: number, newImages: string[]) => {
    setColorGroups((prev) =>
      prev.map((g, gi) => (gi === index ? { ...g, images: newImages } : g)),
    );
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
      "Submitting images in order:",
      images.map((img) => img.src),
    );

    // [3] --- FLATTEN VARIANTS ON SUBMIT ---
    // In handleSubmit, before addProduct.mutate, flatten the grouped structure:
    const flatVariants = [
      ...colorGroups.flatMap((group) =>
        group.sizes.map((size) => ({
          colorName: group.colorName,
          colorHex: group.colorHex,
          size: size.size,
          price: size.price,
          discountedPrice: size.discountedPrice,
          stock: size.stock,
          images: group.images,
          imageId: group.imageId,
        })),
      ),
      ...defaultGroup.sizes.map((size) => ({
        colorName: "",
        colorHex: "",
        size: size.size,
        price: size.price,
        discountedPrice: size.discountedPrice,
        stock: size.stock,
        images: defaultGroup.images,
        imageId: defaultGroup.imageId,
      })),
    ];

    addProduct.mutate({
      imageId,
      images: images.map((image) => image.src),
      descriptionImageId,
      title,
      shortDescription,
      price,
      discountedPrice,
      stock,
      brand,
      defaultColorHex: defaultColorHex.hex,
      slug,
      categoryId: categoryId,
      description: content,
      attributes: specsObject, // Only include specifications here
      categoryAttributes: attributeValues, // Pass category attributes separately
      estimatedDeliveryTime: estimatedDeliveryTime,
      variants: enableVariants ? flatVariants : undefined,
      minQuantity,
      maxQuantity,
      quantityStep,
      variantLabel, // <--- Pass variantLabel
      defaultSize, // <--- Pass defaultSize
      quantityDiscounts, // <--- Add this line
    });
    // Do not clear the form here! Only clear on success.
  };

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      categoryId: validateField("categoryId", categoryId),
    }));
  }, [categoryId]);

  const [minQuantity, setMinQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState<number | undefined>(undefined);
  const [quantityStep, setQuantityStep] = useState(1);

  return (
    <RichEditor
      content=""
      handleSubmit={handleSubmit}
      imageId={descriptionImageId}
      pending={pending}
      submitButtonText="Add Product"
    >
      {/* Variant Label Input */}
      <div className="flex w-full flex-col space-y-2">
        <Label className="text-base">
          Variant Label (e.g. Size, Material, Length)
        </Label>
        <Input
          type="text"
          placeholder="Variant Label (e.g. Size, Material, Length)"
          value={variantLabel}
          onChange={(e) => setVariantLabel(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      {/* Default Product Color/Size */}
      <div className="flex w-full flex-col space-y-2">
        <Label className="text-base">Default Product Color (optional)</Label>
        <Input
          type="text"
          placeholder="Color Name (e.g. Red, Sky Blue)"
          value={defaultColorName}
          onChange={(e) => setDefaultColorName(e.target.value)}
          style={{ width: "100%" }}
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
      {/* Default Product Size (optional) */}
      <div className="flex w-full flex-col space-y-2">
        <Label className="text-base">Default Product Size (optional)</Label>
        <Input
          type="text"
          placeholder="Size"
          value={defaultSize}
          onChange={(e) => setDefaultSize(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      {/* Variants Toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={enableVariants} onCheckedChange={setEnableVariants} />
        <Label className="text-base">Enable color/size/image variants</Label>
      </div>

      <div className="grid grid-cols-1 gap-x-3 gap-y-4 p-2 md:p-0">
        {/* Variants UI */}
        {enableVariants && (
          <div className="flex flex-col gap-4 rounded-md border bg-gray-50 p-3">
            <Label className="text-base">Product Variants</Label>
            {/* Color Groups */}
            {colorGroups.map((group, groupIdx) => (
              <ColorGroup
                key={group.imageId}
                group={group}
                groupIdx={groupIdx}
                onUpdate={(groupIdx, updates) => {
                  setColorGroups((prev) =>
                    prev.map((g, i) =>
                      i === groupIdx ? { ...g, ...updates } : g,
                    ),
                  );
                }}
                onRemove={(groupIdx) => {
                  setColorGroups((prev) =>
                    prev.filter((_, i) => i !== groupIdx),
                  );
                }}
                showImageGallery={showImageGallery}
                setShowImageGallery={setShowImageGallery}
              />
            ))}
            <Button
              type="button"
              onClick={() =>
                setColorGroups((prev) => [
                  ...prev,
                  {
                    colorName: "",
                    colorHex: "#ffffff",
                    imageId: uuid(),
                    images: [],
                    sizes: [],
                  },
                ])
              }
              className="w-full"
            >
              Add Color
            </Button>
          </div>
        )}
        {/* Variant Image Gallery Modal */}
        {variantGalleryOpen &&
          variantGalleryIdx !== null &&
          colorGroups[variantGalleryIdx] !== undefined && (
            <VariantImageGalleryModal
              variantIndex={variantGalleryIdx}
              images={
                Array.isArray(colorGroups[variantGalleryIdx]?.images)
                  ? colorGroups[variantGalleryIdx]?.images
                  : []
              }
              onClose={() => setVariantGalleryOpen(false)}
              onImagesChange={(imgs: string[]) =>
                handleVariantImagesUpdate(variantGalleryIdx, imgs)
              }
            />
          )}
        {/* Product Title - moved here to be after variants */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Product Title</Label>
          <Input
            type="text"
            placeholder="Title"
            value={title}
            onChange={handleTitleChange}
            className={errors.title ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        {/* Slug */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Slug</Label>
          <Input
            type="text"
            placeholder="Slug"
            value={slug}
            onChange={handleSlugChange}
            className={errors.slug ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
          )}
        </div>
        {/* Short Description */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Short Description</Label>
          <Textarea
            placeholder="Short Description"
            value={shortDescription}
            onChange={handleShortDescriptionChange}
            className={errors.shortDescription ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.shortDescription && (
            <p className="mt-1 text-sm text-red-500">
              {errors.shortDescription}
            </p>
          )}
        </div>
        {/* Category */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base font-medium">Category</Label>
          <CategorySelector
            setAttributes={setAttributes}
            setCategoryId={setCategoryId}
            categories={categories}
            placeholder="Select Category"
            selectedCategoriesRef={selectedCategoriesRef}
            onCategoryChange={(level) => {
              selectedCategoriesRef.current =
                selectedCategoriesRef.current.slice(0, level + 1);
            }}
          />
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
          )}
        </div>
        {/* Price */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Price</Label>
          <Input
            type="number"
            placeholder="Price"
            value={price === 0 ? "" : price}
            onChange={handlePriceChange}
            className={errors.price ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price}</p>
          )}
        </div>
        {/* Discounted Price */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Discounted Price</Label>
          <Input
            type="number"
            placeholder="Discounted Price"
            value={discountedPrice === 0 ? "" : discountedPrice}
            onChange={handleDiscountedPriceChange}
            style={{ width: "100%" }}
          />
        </div>
        {/* Stock */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Stock</Label>
          <Input
            type="number"
            placeholder="Stock"
            value={stock === 0 ? "" : stock}
            onChange={handleStockChange}
            className={errors.stock ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
          )}
        </div>
        {/* Brand */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Brand</Label>
          {brandsLoading ? (
            <div className="text-sm text-gray-500">Loading brands...</div>
          ) : (
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
                <SelectItem value="__custom__" className="w-full text-blue-600">
                  Other / New Brand...
                </SelectItem>
              </SelectContent>
            </Select>
          )}
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
              style={{ width: "100%" }}
            />
          )}
          {errors.brand && (
            <p className="mt-1 text-sm text-red-500">{errors.brand}</p>
          )}
        </div>
        {/* Estimated Delivery Time */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Estimated Delivery Time (Days)</Label>
          <Input
            type="number"
            placeholder="Delivery Time in Days"
            min="1"
            value={estimatedDeliveryTime ?? ""}
            onChange={handleEstimatedDeliveryTimeChange}
            style={{ width: "100%" }}
          />
        </div>
        {/* Min Quantity */}
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Min Quantity</Label>
          <Input
            type="number"
            placeholder="Min Quantity"
            value={minQuantity}
            min={1}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
          />
        </div>
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Max Quantity</Label>
          <Input
            type="number"
            placeholder="Max Quantity (optional)"
            value={maxQuantity ?? ""}
            min={1}
            onChange={(e) =>
              setMaxQuantity(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        </div>
        <div className="flex w-full flex-col space-y-2">
          <Label className="text-base">Quantity Step</Label>
          <Input
            type="number"
            placeholder="Quantity Step"
            value={quantityStep}
            min={1}
            onChange={(e) => setQuantityStep(Number(e.target.value))}
          />
        </div>
        {/* Quantity Discount Table UI */}
        <div className="my-4 flex flex-col space-y-2 rounded-md border border-gray-200 p-4">
          <Label className="mb-2 text-base">Quantity Discounts</Label>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Min QTY</th>
                  <th className="px-2 py-1 text-left">Max QTY</th>
                  <th className="px-2 py-1 text-left">Discount %</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {quantityDiscounts.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={1}
                        value={row.minQty}
                        onChange={(e) =>
                          handleDiscountChange(
                            idx,
                            "minQty",
                            Number(e.target.value),
                          )
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={row.minQty}
                        value={row.maxQty}
                        onChange={(e) =>
                          handleDiscountChange(
                            idx,
                            "maxQty",
                            Number(e.target.value),
                          )
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={row.discountPercent}
                        onChange={(e) =>
                          handleDiscountChange(
                            idx,
                            "discountPercent",
                            Number(e.target.value),
                          )
                        }
                        className="w-20"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveDiscountRow(idx)}
                        disabled={quantityDiscounts.length === 1}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            onClick={handleAddDiscountRow}
            className="mt-2 w-fit"
          >
            Add Discount Row
          </Button>
        </div>
        {/* Images */}
        <div className="mt-auto flex w-full flex-col gap-y-1">
          <Label className="text-base">
            Images
            <span className="ml-2 text-xs text-gray-500">
              (Recommended: 1000x1000px or larger, square)
            </span>
          </Label>
          <Button
            onClick={() => setShowImageGallery(imageId)}
            className="w-full"
          >
            Show Image Gallery
          </Button>
          {showImageGallery && (
            <DndImageGallery imageId={imageId} onClose={setShowImageGallery} />
          )}
        </div>
        {/* Divider */}
        <div className="col-span-1 my-2 border-b border-gray-200 md:col-span-2" />
        {/* Category Attribute Fields */}
        {attributes.length > 0 && (
          <div className="col-span-1 mt-4 md:col-span-2">
            <h3 className="mb-3 text-lg font-medium">Category Attributes</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {attributes.map((attr) => (
                <div key={attr.name} className="flex w-full flex-col gap-2">
                  <Label htmlFor={attr.name} className="text-base">
                    {attr.name}{" "}
                    {attr.required && <span className="text-red-500">*</span>}
                  </Label>
                  {attr.type === "select" && attr.options && (
                    <Select
                      value={
                        attributeValues[attr.name]?.toString() === ""
                          ? "__none__"
                          : attributeValues[attr.name]?.toString()
                      }
                      onValueChange={(value) =>
                        handleAttributeChange(
                          attr.name,
                          value === "__none__" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${attr.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {attr.options.filter(Boolean).map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                            className="w-full"
                          >
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
        {/* Divider */}
        <div className="col-span-1 my-2 border-b border-gray-200 md:col-span-2" />
        {/* Specifications */}
        <div className="col-span-1 w-full md:col-span-2">
          <Label className="text-base">Specifications</Label>
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
            <Button onClick={handleAddSpecification} className="w-full">
              Add Specification
            </Button>
            <div className="mt-4">
              <Label className="mb-1 block text-base">
                Or paste/write specifications below (format: Key: Value per
                line)
              </Label>
              <Textarea
                placeholder={`Color: Red
Size: Large
Material: Cotton`}
                value={specTextContent}
                onChange={(e) => setSpecTextContent(e.target.value)}
                className="min-h-[100px] w-full"
              />
              <Button
                className="mt-2 w-full"
                type="button"
                onClick={() => {
                  addSpecsFromRichEditor(specTextContent);
                  setSpecTextContent("");
                }}
              >
                Add from Textarea
              </Button>
            </div>
          </div>
        </div>
      </div>
    </RichEditor>
  );
}

type SetCategoryIdType =
  | Dispatch<SetStateAction<string>>
  | ((id: string) => void);
function CategorySelector({
  setCategoryId,
  setAttributes,
  categories,
  placeholder,
  depth = 0, // Tracks category level
  selectedCategoriesRef, // Ref to store the category selection path
  onCategoryChange, // Function to reset child selection
}: {
  setCategoryId: SetCategoryIdType;
  setAttributes: Dispatch<SetStateAction<CategoryAttribute[]>>;
  categories: CategoryTree[];
  placeholder: string;
  depth?: number;
  selectedCategoriesRef: React.MutableRefObject<(string | null)[]>;
  onCategoryChange?: (level: number) => void;
}) {
  const [subCategories, setSubCategories] = useState<CategoryTree[]>([]);

  return (
    <>
      <Select
        onValueChange={(value) => {
          setCategoryId(value);

          // Find selected category
          const category = categories.find((cat) => cat.id === value);
          setSubCategories(category?.subcategories ?? []);

          // Check if the category has attributes and update the state
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
            // Reset attributes if none found
            setAttributes([]);
          }

          // Update ref with selected category at current depth
          selectedCategoriesRef.current[depth] = value;

          // Reset all selections beyond this level
          if (onCategoryChange) onCategoryChange(depth);
        }}
        value={selectedCategoriesRef.current[depth] ?? ""}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Render child selector if subcategories exist */}
      {subCategories.length > 0 && selectedCategoriesRef.current[depth] && (
        <div className="my-4">
          <CategorySelector
            placeholder="Select subcategory"
            setCategoryId={setCategoryId}
            setAttributes={setAttributes}
            categories={subCategories}
            depth={depth + 1}
            selectedCategoriesRef={selectedCategoriesRef}
            onCategoryChange={(level) => {
              // Reset all selections below this level
              selectedCategoriesRef.current =
                selectedCategoriesRef.current.slice(0, level + 1);
            }}
          />
        </div>
      )}
    </>
  );
}

// ColorGroup component to properly use useColor hook
function ColorGroup({
  group,
  groupIdx,
  onUpdate,
  onRemove,
  showImageGallery,
  setShowImageGallery,
}: {
  group: {
    colorName: string;
    colorHex: string;
    imageId: string;
    images: string[];
    sizes: Array<{
      size: string;
      price: number;
      discountedPrice: number;
      stock: number;
    }>;
  };
  groupIdx: number;
  onUpdate: (groupIdx: number, updates: Partial<typeof group>) => void;
  onRemove: (groupIdx: number) => void;
  showImageGallery: string;
  setShowImageGallery: (id: string) => void;
}) {
  const [color, setColor] = useColor(group.colorHex || "#ffffff");

  // Sync local color state with parent state
  useEffect(() => {
    if (group.colorHex !== color.hex) {
      setColor({
        hex: group.colorHex,
        rgb: { r: 255, g: 255, b: 255, a: 1 },
        hsv: { h: 0, s: 0, v: 1, a: 1 },
      });
    }
  }, [group.colorHex, color.hex, setColor]);

  return (
    <div className="mb-4 border-b pb-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Color Name"
          value={group.colorName}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate(groupIdx, { colorName: val });
          }}
          className="w-40"
        />
        <ColorPicker
          color={color}
          onChange={(newColor) => {
            setColor(newColor);
            onUpdate(groupIdx, { colorHex: newColor.hex });
          }}
          hideInput={["rgb", "hsv"]}
        />
        <span
          style={{
            display: "inline-block",
            width: 32,
            height: 32,
            backgroundColor: color.hex,
            borderRadius: "50%",
            border: "1px solid #ccc",
          }}
          aria-label={group.colorName}
          title={group.colorName}
        />
        <span>
          {group.colorName} ({color.hex})
        </span>
        <Button
          type="button"
          variant="destructive"
          onClick={() => onRemove(groupIdx)}
        >
          Remove Color
        </Button>
      </div>
      {/* Images for color group */}
      <Button
        type="button"
        onClick={() => setShowImageGallery(group.imageId)}
        className="mt-2 w-full"
      >
        Show Image Gallery
      </Button>
      {showImageGallery === group.imageId && (
        <DndImageGallery
          imageId={group.imageId}
          onClose={setShowImageGallery}
        />
      )}
      {/* Sizes for this color */}
      <div className="mt-2">
        <Label>Sizes for {group.colorName || "Color"}</Label>
        {group.sizes.map((sizeObj, sizeIdx) => (
          <div key={sizeIdx} className="mb-2 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Size"
              value={sizeObj.size}
              onChange={(e) =>
                onUpdate(groupIdx, {
                  sizes: group.sizes.map((s, si) =>
                    si === sizeIdx ? { ...s, size: e.target.value } : s,
                  ),
                })
              }
              className="w-24"
            />
            <Input
              type="number"
              placeholder="Price"
              value={sizeObj.price === 0 ? "" : sizeObj.price}
              onChange={(e) =>
                onUpdate(groupIdx, {
                  sizes: group.sizes.map((s, si) =>
                    si === sizeIdx
                      ? { ...s, price: Number(e.target.value) }
                      : s,
                  ),
                })
              }
              className="w-24"
            />
            <Input
              type="number"
              placeholder="Discounted Price"
              value={
                sizeObj.discountedPrice === 0 ? "" : sizeObj.discountedPrice
              }
              onChange={(e) =>
                onUpdate(groupIdx, {
                  sizes: group.sizes.map((s, si) =>
                    si === sizeIdx
                      ? { ...s, discountedPrice: Number(e.target.value) }
                      : s,
                  ),
                })
              }
              className="w-32"
            />
            <Input
              type="number"
              placeholder="Stock"
              value={sizeObj.stock === 0 ? "" : sizeObj.stock}
              onChange={(e) =>
                onUpdate(groupIdx, {
                  sizes: group.sizes.map((s, si) =>
                    si === sizeIdx
                      ? { ...s, stock: Number(e.target.value) }
                      : s,
                  ),
                })
              }
              className="w-20"
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                onUpdate(groupIdx, {
                  sizes: group.sizes.filter((_, si) => si !== sizeIdx),
                })
              }
            >
              Remove Size
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() =>
            onUpdate(groupIdx, {
              sizes: [
                ...group.sizes,
                {
                  size: "",
                  price: 0,
                  discountedPrice: 0,
                  stock: 0,
                },
              ],
            })
          }
          className="w-full"
        >
          Add Size
        </Button>
      </div>
    </div>
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
                className="h-16 w-16 rounded object-cover"
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
