"use client";

import { removeImage, uploadFile } from "@/app/actions/file";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowsAlt } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";

interface CategoryTree extends Category {
  subcategories: CategoryTree[];
  order: number;
  description: string | null;
}

interface CategoryAccordionProps {
  categories: CategoryTree[];
  onDelete: (id: string) => void;
  onReorder?: (
    items: { id: string; order: number }[],
    parentId: string | null,
  ) => void;
  parentId?: string | null;
}

export function CategoryAccordion({
  categories,
  onDelete,
  onReorder,
  parentId = null,
}: CategoryAccordionProps) {
  const [items, setItems] = useState<CategoryTree[]>(categories);
  // Track if we're currently reordering to prevent multiple toasts
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && !isReordering) {
      setIsReordering(true);

      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(prevItems, oldIndex, newIndex);

        // Update order property for each item
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        // Call the onReorder callback with the new order
        if (onReorder) {
          // Use setTimeout to ensure we complete the current state update first
          setTimeout(() => {
            onReorder(
              updatedItems.map((item) => ({ id: item.id, order: item.order })),
              parentId,
            );
            // Reset the reordering flag after a short delay
            setTimeout(() => setIsReordering(false), 500);
          }, 0);
        } else {
          setIsReordering(false);
        }

        return updatedItems;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Accordion type="single" collapsible className="w-full">
          {items.map((category) => (
            <SortableCategoryItem
              key={category.id}
              category={category}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          ))}
        </Accordion>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryItem({
  category,
  onDelete,
  onReorder,
}: {
  category: CategoryTree;
  onDelete: (id: string) => void;
  onReorder?: (
    items: { id: string; order: number }[],
    parentId: string | null,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryItem
        category={category}
        onDelete={onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
        onReorder={onReorder}
      />
    </div>
  );
}

function CategoryItem({
  category,
  onDelete,
  dragAttributes,
  dragListeners,
  onReorder,
}: {
  category: CategoryTree;
  onDelete: (id: string) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  onReorder?: (
    items: { id: string; order: number }[],
    parentId: string | null,
  ) => void;
}) {
  const handleDelete = () => {
    onDelete(category.id);
  };

  const utils = api.useUtils();
  const editCategory = api.category.edit.useMutation({
    onSuccess: async () => {
      await utils.category.getAll.invalidate();
      toast.success("Category updated successfully");
    },
    onError: (error: { message: string }) => {
      toast.error(`Error updating category: ${error.message}`);
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState(category.name);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    category.image,
  );
  const [newDescription, setNewDescription] = useState(
    category.description ?? "",
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    setIsRemovingImage(true);
    try {
      if (category.imageId) {
        await removeImage(category.imageId);
      }
      setNewImage(null);
      setImagePreview(null);
      toast.success("Image removed successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove image");
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleSave = async () => {
    let imageUrl = category.image;
    let imageId = category.imageId;

    try {
      if (newImage) {
        if (imageId) await removeImage(imageId);
        const formData = new FormData();
        formData.append("file", newImage);

        const uploadResponse = await uploadFile(formData);
        if (uploadResponse) {
          imageUrl = uploadResponse.secure_url;
          imageId = uploadResponse.public_id;
        }
      } else if (!imagePreview) {
        imageUrl = null;
        imageId = null;
      }

      editCategory.mutate({
        id: category.id,
        name: newCategoryName,
        image: imageUrl,
        imageId: imageId,
        description: newDescription,
      });

      setIsEditing(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to save changes");
    }
  };

  return (
    <AccordionItem
      value={category.id.toString()}
      className="mb-2 rounded-lg border"
    >
      <div className="flex items-center justify-between rounded-md bg-gray-100 p-3">
        <div className="flex flex-1 items-center">
          {/* Drag handle */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 cursor-grab"
            {...dragAttributes}
            {...dragListeners}
          >
            <FaArrowsAlt className="text-gray-500" />
          </Button>

          <AccordionTrigger
            disabled={category.subcategories.length === 0}
            className="flex flex-1 gap-3 text-left"
          >
            {imagePreview && (
              <Image
                src={imagePreview}
                alt={category.name}
                width={40}
                height={40}
                className="mr-2 rounded-md object-cover"
              />
            )}
            {isEditing ? (
              <Input
                type="text"
                value={newCategoryName}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    await handleSave();
                  }
                }}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-white"
              />
            ) : (
              category.name
            )}
          </AccordionTrigger>
        </div>

        <div className="flex items-center gap-x-1">
          <Link href={`/admin/category/${category.id}`}>
            <Button variant="outline" className="flex items-center gap-1">
              <FaGear size={20} />
              <span className="hidden sm:inline">Manage</span>
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="ml-2">
                <MdDelete size={35} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  category and all its subcategories.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isEditing && (
        <div className="p-3">
          <label className="text-sm font-medium">
            {category.image ? "Edit Image" : "Add Image"}
          </label>
          <Input
            type="file"
            onClick={(e) => e.stopPropagation()}
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2"
          />
          {imagePreview && (
            <div className="mt-2 flex gap-4">
              <Image
                src={imagePreview}
                alt="Preview"
                width={128}
                height={128}
                className="rounded-md object-cover"
              />
              <Button
                variant="destructive"
                onClick={handleRemoveImage}
                disabled={isRemovingImage}
                className="mt-2"
              >
                {isRemovingImage ? "Removing..." : "Remove Image"}
              </Button>
            </div>
          )}
          <div className="mt-4">
            <label className="text-sm font-medium">
              Description (optional)
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Enter category description (for SEO, shown at bottom of category page)"
              className="min-h-[80px] w-full rounded border border-gray-300 p-2"
            />
          </div>
          <Button onClick={handleSave} className="mt-2">
            Save Changes
          </Button>
        </div>
      )}

      <AccordionContent className="p-3">
        {category.subcategories.length > 0 && (
          <div className="ml-4 mt-2 border-l-2 pl-4">
            <CategoryAccordion
              categories={category.subcategories}
              onDelete={onDelete}
              onReorder={onReorder}
              parentId={category.id}
            />
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
