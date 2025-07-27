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
import type { CategoryAttribute } from "@/schemas/categorySchema";
import { updateProductSchema } from "@/schemas/productSchema";
import { api } from "@/trpc/react";
import type { Variant as VariantType } from "@/types/ProductType";
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

type Variant = {
  colorName?: string;
  colorHex?: string;
  imageId?: string;
  images?: string[];
  size: string;
  price?: number;
  discountedPrice?: number;
  stock?: number;
  sizes?: Array<{
    size: string;
    price?: number;
    discountedPrice?: number;
    stock?: number;
  }>;
};

type VariantGroup = {
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

// ColorGroup component to handle individual color groups
function ColorGroup({
  group,
  groupIdx,
  onUpdate,
  onRemove,
  onShowImageGallery,
  showImageGallery,
}: {
  group: VariantGroup;
  groupIdx: number;
  onUpdate: (index: number, updates: Partial<VariantGroup>) => void;
  onRemove: (index: number) => void;
  onShowImageGallery: (imageId: string) => void;
  showImageGallery: string;
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
            onUpdate(groupIdx, { colorName: e.target.value });
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
        onClick={() => onShowImageGallery(group.imageId)}
        className="mt-2 w-full"
      >
        Show Image Gallery
      </Button>
      {showImageGallery === group.imageId && (
        <DndImageGallery imageId={group.imageId} onClose={onShowImageGallery} />
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
  const [minQuantity, setMinQuantity] = useState(product?.minQuantity ?? 1);
  const [maxQuantity, setMaxQuantity] = useState<number | undefined>(
    product?.maxQuantity ?? undefined,
  );
  const [quantityStep, setQuantityStep] = useState(product?.quantityStep ?? 1);

  // Add state for quantity discounts, pre-fill from product if available
  const [quantityDiscounts, setQuantityDiscounts] = useState<
    Array<{ minQty: number; maxQty: number; discountPercent: number }>
  >(() => {
    if (product && Array.isArray(product.quantityDiscounts)) {
      return product.quantityDiscounts;
    }
    return [{ minQty: 1, maxQty: 1, discountPercent: 0 }];
  });

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

  // [1] --- VARIANT STATE REFACTOR ---
  // Remove old variants state and enableVariants state
  // Add grouped state:
  const [enableVariants, setEnableVariants] = useState(() => {
    if (!Array.isArray(product?.variants)) return false;
    return product.variants.length > 0;
  });
  const [colorGroups, setColorGroups] = useState<VariantGroup[]>(() => {
    if (!Array.isArray(product?.variants)) return [];

    console.log("Processing variants in EditProduct:", product.variants);

    const groups: Record<string, VariantGroup> = {};
    (product.variants as Variant[]).forEach((v) => {
      console.log("Processing variant:", v);
      // Only group variants that have color information
      if (v.colorName || v.colorHex) {
        const key = (v.colorName ?? "") + "|" + (v.colorHex ?? "");
        if (!groups[key]) {
          groups[key] = {
            colorName: v.colorName ?? "",
            colorHex: v.colorHex ?? "#ffffff",
            imageId: v.imageId ?? uuid(),
            images: v.images ?? [],
            sizes: [],
          };
        }
        if (v.size) {
          groups[key].sizes.push({
            size: v.size,
            price: v.price ?? 0,
            discountedPrice: v.discountedPrice ?? 0,
            stock: v.stock ?? 0,
          });
        }
      }
    });

    console.log("Color groups created:", Object.values(groups));
    return Object.values(groups);
  });
  const [defaultGroup, setDefaultGroup] = useState<{
    imageId: string;
    images: string[];
    sizes: Array<{
      size: string;
      price: number;
      discountedPrice: number;
      stock: number;
    }>;
  }>(() => {
    // Find variants with no colorName/colorHex - these are default variants
    const variants: Variant[] = Array.isArray(product?.variants)
      ? (product.variants as Variant[])
      : [];
    const defaultVariants = variants.filter((v) => !v.colorName && !v.colorHex);

    console.log("Default variants found:", defaultVariants);

    return {
      imageId: defaultVariants[0]?.imageId ?? uuid(),
      images: defaultVariants[0]?.images ?? [],
      sizes: defaultVariants.map((v) => ({
        size: v.size,
        price: v.price ?? 0,
        discountedPrice: v.discountedPrice ?? 0,
        stock: v.stock ?? 0,
      })),
    };
  });

  // [2] --- VARIANT UI REFACTOR ---
  // Replace the old variants UI with a grouped UI
  const handleVariantChange = (
    index: number,
    field: string,
    value: string | number | undefined,
  ) => {
    setColorGroups((prev) =>
      prev.map((g, gi) =>
        gi === index ? { ...g, colorName: value as string } : g,
      ),
    );
  };
  const handleVariantImageGallery = (index: number) => {
    const group = colorGroups[index];
    if (group) setShowImageGallery(group.imageId);
  };
  const handleAddVariant = () => {
    setColorGroups((prev) => [
      ...prev,
      {
        colorName: "",
        colorHex: "#ffffff",
        imageId: uuid(),
        images: [],
        sizes: [],
      },
    ]);
  };
  const handleRemoveVariant = (index: number) => {
    setColorGroups((prev) => prev.filter((_, i) => i !== index));
  };
  const handleVariantImagesUpdate = (index: number, newImages: string[]) => {
    setColorGroups((prev) =>
      prev.map((g, gi) => (gi === index ? { ...g, images: newImages } : g)),
    );
  };

  // Handler for updating color groups
  const handleColorGroupUpdate = (
    index: number,
    updates: Partial<VariantGroup>,
  ) => {
    setColorGroups((prev) =>
      prev.map((g, gi) => (gi === index ? { ...g, ...updates } : g)),
    );
  };

  // [3] --- FLATTEN VARIANTS ON SUBMIT ---
  // In handleSubmit, before updateProduct.mutate, flatten the grouped structure:
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
      variants: enableVariants ? flatVariants : undefined,
      minQuantity,
      maxQuantity,
      quantityStep,
      variantLabel, // <--- Pass variantLabel
      perUnitText, // <--- Pass perUnitText
      quantityDiscounts, // <--- Add this line
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

  const [variantLabel, setVariantLabel] = useState<string>(
    product?.variantLabel ?? "Size",
  ); // <--- Fix: add this line
  const [perUnitText, setPerUnitText] = useState<string>(
    product?.perUnitText ?? "",
  ); // <--- Add this line

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
        {/* Variant Label Input */}
        <div className="col-span-2 flex w-full flex-col space-y-2">
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
        {/* Per Unit Text Input */}
        <div className="col-span-2 flex w-full flex-col space-y-2">
          <Label className="text-base">
            Per Unit Text (e.g. PER PIECE, PER KG, PER ROLL, PER POUND)
          </Label>
          <Input
            type="text"
            placeholder="Per Unit Text (e.g. PER PIECE, PER KG, PER ROLL, PER POUND)"
            value={perUnitText}
            onChange={(e) => setPerUnitText(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
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
          <Label>Min Quantity</Label>
          <Input
            type="number"
            placeholder="Min Quantity"
            value={minQuantity}
            min={1}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Max Quantity</Label>
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
        <div>
          <Label>Quantity Step</Label>
          <Input
            type="number"
            placeholder="Quantity Step"
            value={quantityStep}
            min={1}
            onChange={(e) => setQuantityStep(Number(e.target.value))}
          />
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

        {/* Quantity Discount Table UI */}
        <div className="col-span-2 my-4 flex flex-col space-y-2 rounded-md border border-gray-200 p-4">
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
            {/* Color Groups */}
            {colorGroups.map((group, groupIdx) => (
              <ColorGroup
                key={group.imageId}
                group={group}
                groupIdx={groupIdx}
                onUpdate={handleColorGroupUpdate}
                onRemove={handleRemoveVariant}
                onShowImageGallery={handleShowImageGallery}
                showImageGallery={showImageGallery}
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

            {/* Default Group (variants without colors) */}
            {(defaultGroup.sizes.length > 0 || colorGroups.length === 0) && (
              <div className="mt-4 border-t pt-4">
                <Label className="text-base">Default Variants (No Color)</Label>
                <div className="mt-2">
                  <Button
                    type="button"
                    onClick={() => handleShowImageGallery(defaultGroup.imageId)}
                    className="mb-2 w-full"
                  >
                    Show Image Gallery for Default Variants
                  </Button>
                  {showImageGallery === defaultGroup.imageId && (
                    <DndImageGallery
                      imageId={defaultGroup.imageId}
                      onClose={handleShowImageGallery}
                    />
                  )}
                  {defaultGroup.sizes.map((sizeObj, sizeIdx) => (
                    <div key={sizeIdx} className="mb-2 flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Size"
                        value={sizeObj.size}
                        onChange={(e) =>
                          setDefaultGroup((prev) => ({
                            ...prev,
                            sizes: prev.sizes.map((s, si) =>
                              si === sizeIdx
                                ? { ...s, size: e.target.value }
                                : s,
                            ),
                          }))
                        }
                        className="w-24"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={sizeObj.price === 0 ? "" : sizeObj.price}
                        onChange={(e) =>
                          setDefaultGroup((prev) => ({
                            ...prev,
                            sizes: prev.sizes.map((s, si) =>
                              si === sizeIdx
                                ? { ...s, price: Number(e.target.value) }
                                : s,
                            ),
                          }))
                        }
                        className="w-24"
                      />
                      <Input
                        type="number"
                        placeholder="Discounted Price"
                        value={
                          sizeObj.discountedPrice === 0
                            ? ""
                            : sizeObj.discountedPrice
                        }
                        onChange={(e) =>
                          setDefaultGroup((prev) => ({
                            ...prev,
                            sizes: prev.sizes.map((s, si) =>
                              si === sizeIdx
                                ? {
                                    ...s,
                                    discountedPrice: Number(e.target.value),
                                  }
                                : s,
                            ),
                          }))
                        }
                        className="w-32"
                      />
                      <Input
                        type="number"
                        placeholder="Stock"
                        value={sizeObj.stock === 0 ? "" : sizeObj.stock}
                        onChange={(e) =>
                          setDefaultGroup((prev) => ({
                            ...prev,
                            sizes: prev.sizes.map((s, si) =>
                              si === sizeIdx
                                ? { ...s, stock: Number(e.target.value) }
                                : s,
                            ),
                          }))
                        }
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setDefaultGroup((prev) => ({
                            ...prev,
                            sizes: prev.sizes.filter((_, si) => si !== sizeIdx),
                          }))
                        }
                      >
                        Remove Size
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() =>
                      setDefaultGroup((prev) => ({
                        ...prev,
                        sizes: [
                          ...prev.sizes,
                          {
                            size: "",
                            price: 0,
                            discountedPrice: 0,
                            stock: 0,
                          },
                        ],
                      }))
                    }
                    className="w-full"
                  >
                    Add Default Size
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variant Image Gallery Modal */}
        {/* This modal is no longer needed as variants are managed directly */}
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
