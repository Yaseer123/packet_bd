"use client";

import { removeImage, uploadFile } from "@/app/actions/file";
import {
  type ProductImage,
  useProductImageStore,
} from "@/context/admin-context/ProductImageProvider";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { BiCheck, BiSolidTrash } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function DndImageGallery({
  imageId,
  onClose,
  variantMode = false,
  selectedImages = [],
  onImageSelect,
  colorName = "",
}: {
  imageId: string;
  onClose: (state: string) => void;
  variantMode?: boolean;
  selectedImages?: string[];
  onImageSelect?: (imageSrc: string, selected: boolean) => void;
  colorName?: string;
}) {
  const { images, setImages, updateImages, removeOldImage } =
    useProductImageStore();
  const [isUploading, setIsUploading] = useState(false);
  // State for tracking images selected for deletion
  const [imagesSelectedForDeletion, setImagesSelectedForDeletion] = useState<
    string[]
  >([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    console.log("🖼️ DndImageGallery mounted with images:", images.length);
    if (images.length > 0) {
      console.log(
        "📋 Initial image order:",
        images.map((img, idx) => `${idx + 1}. ${img.src}`),
      );
    }
  }, [images.length]);

  const handleClose = () => {
    onClose("");
  };

  const handleDragStart = (event: DragStartEvent) => {
    console.log("🚀 Drag start event:", event);
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log("🔄 Drag over event:", event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log("🔄 Drag end event triggered:", event);
    setIsDragging(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      console.log("📊 Reordering images:", {
        activeId: active.id,
        overId: over.id,
        oldIndex,
        newIndex,
        totalImages: images.length,
      });

      // Update the order in state
      const reorderedImages = arrayMove(images, oldIndex, newIndex);
      setImages(reorderedImages);

      console.log(
        "✅ Images reordered successfully:",
        reorderedImages.map((img, idx) => `${idx + 1}. ${img.src}`),
      );
    } else {
      console.log("❌ No reordering - same position or no over target");
    }
  };

  const handleImageToggle = (imageSrc: string) => {
    if (onImageSelect) {
      const isSelected = selectedImages.includes(imageSrc);
      onImageSelect(imageSrc, !isSelected);
    }
  };

  // Handle selection for deletion
  const handleDeletionToggle = (imageSrc: string) => {
    setImagesSelectedForDeletion((prev) =>
      prev.includes(imageSrc)
        ? prev.filter((src) => src !== imageSrc)
        : [...prev, imageSrc],
    );
  };

  // Select all images for deletion
  const handleSelectAllForDeletion = () => {
    setImagesSelectedForDeletion(images.map((img) => img.src));
  };

  // Deselect all images for deletion
  const handleDeselectAllForDeletion = () => {
    setImagesSelectedForDeletion([]);
  };

  // Delete selected images
  const handleDeleteSelected = async () => {
    if (imagesSelectedForDeletion.length === 0) {
      toast.error("No images selected for deletion");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${imagesSelectedForDeletion.length} image(s)?`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const selectedImageObjects = images.filter((img) =>
        imagesSelectedForDeletion.includes(img.src),
      );

      // Delete images from S3
      for (const image of selectedImageObjects) {
        if (image.id) {
          console.log("Deleting image:", image.id);
          await removeImage(image.id);
          removeOldImage(image.src);
        }
      }

      // Clear selection
      setImagesSelectedForDeletion([]);

      toast.success(
        `Successfully deleted ${selectedImageObjects.length} image(s)`,
      );
    } catch (error) {
      console.error("Failed to delete selected images:", error);
      toast.error(
        `Failed to delete images: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      tabIndex={-1}
      onKeyDown={({ key }) => {
        if (key === "Escape") handleClose();
      }}
    >
      <div className="relative flex h-[90vh] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-lg bg-white">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white p-6 pb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {variantMode
                  ? `Select Images for ${colorName}`
                  : "Image Gallery"}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                💡 Drag and drop images to reorder them. The order will be saved
                when you update the product.
              </p>
              {isDragging && (
                <p className="mt-1 text-sm font-medium text-blue-600">
                  🎯 Currently dragging - drop to reorder!
                </p>
              )}
            </div>
            <Button onClick={handleClose} variant="outline" size="sm">
              <IoMdClose size={20} />
            </Button>
          </div>

          {/* Header for variant mode */}
          {variantMode && colorName && (
            <div className="mt-4 rounded-md bg-blue-50 p-3">
              <h3 className="text-lg font-semibold text-blue-900">
                Select Images for {colorName}
              </h3>
              <p className="text-sm text-blue-700">
                Click on images to select/deselect them for this color variant
              </p>
              <p className="text-sm text-blue-600">
                Selected: {selectedImages.length} images
              </p>
            </div>
          )}

          {/* Deletion mode header */}
          {!variantMode && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <h3 className="text-lg font-semibold text-red-900">
                Image Management
              </h3>
              <p className="text-sm text-red-700">
                Click on images to select/deselect them for deletion
              </p>
              <p className="text-sm text-red-600">
                Selected for deletion: {imagesSelectedForDeletion.length} images
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-0">
          <FileUploader
            multiple={true}
            handleChange={async (files: File[]) => {
              setIsUploading(true);
              try {
                for (const file of files) {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await uploadFile(formData, imageId);
                  if (res && updateImages) {
                    updateImages([{ src: res.secure_url, id: res.public_id }]);
                  }
                }
              } catch (error) {
                console.log(error);
              }
              setIsUploading(false);
            }}
            name="file"
            types={["png", "jpg", "jpeg", "webp"]}
          >
            <div className="flex w-full items-center justify-center">
              <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <IoCloudUploadOutline size={30} className="text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Image file
                  </p>
                  <div className="mt-1 text-xs text-gray-400">
                    Recommended size: 1200x900px or larger, 4:3 or 16:9 aspect
                    ratio
                  </div>
                </div>
              </label>
            </div>
          </FileUploader>

          {!images?.length ? (
            <p className="p-4 text-center text-2xl font-semibold opacity-45">
              No Images to Render...
            </p>
          ) : null}

          <div className="mt-4 grid w-full grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {isUploading && (
              <div className="">
                <div className="aspect-square animate-pulse rounded bg-gray-200"></div>
              </div>
            )}

            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
            >
              <SortableContext
                items={images.map((img) => img.id)}
                strategy={rectSortingStrategy}
              >
                {images.map((image, index) => {
                  console.log(`Rendering image ${index + 1}:`, {
                    id: image.id,
                    src: image.src,
                  });
                  return (
                    <SortableImage
                      key={image.id}
                      image={image}
                      index={index}
                      variantMode={variantMode}
                      isSelected={selectedImages.includes(image.src)}
                      isSelectedForDeletion={imagesSelectedForDeletion.includes(
                        image.src,
                      )}
                      onToggle={handleImageToggle}
                      onDeletionToggle={handleDeletionToggle}
                      onDeleteClick={async () => {
                        if (confirm("Are you sure?")) {
                          try {
                            console.log("Attempting to delete image:", image);
                            console.log("Image ID:", image.id);
                            console.log("Image SRC:", image.src);

                            // Use the image.id directly instead of extracting from URL
                            if (image.id) {
                              console.log(
                                "Calling removeImage with ID:",
                                image.id,
                              );
                              await removeImage(image.id);
                              console.log(
                                "S3 deletion completed, updating local state",
                              );
                              removeOldImage(image.src);
                              console.log(
                                "Image deleted successfully:",
                                image.id,
                              );
                              toast.success("Image deleted successfully");
                            } else {
                              console.error(
                                "No image ID found for:",
                                image.src,
                              );
                              toast.error(
                                "No image ID found. Cannot delete image.",
                              );
                            }
                          } catch (error) {
                            console.error("Failed to delete image:", error);
                            toast.error(
                              `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                          }
                        }
                      }}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 bg-white p-6 pt-4 shadow-sm">
          {/* Action buttons for variant mode */}
          {variantMode && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Select all images
                  images.forEach((img) => {
                    if (!selectedImages.includes(img.src)) {
                      onImageSelect?.(img.src, true);
                    }
                  });
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Deselect all images
                  selectedImages.forEach((imgSrc) => {
                    onImageSelect?.(imgSrc, false);
                  });
                }}
              >
                Deselect All
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          )}

          {/* Action buttons for deletion mode */}
          {!variantMode && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAllForDeletion}
                disabled={isDeleting}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                onClick={handleDeselectAllForDeletion}
                disabled={isDeleting}
              >
                Deselect All
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={imagesSelectedForDeletion.length === 0 || isDeleting}
              >
                {isDeleting
                  ? "Deleting..."
                  : `Delete Selected (${imagesSelectedForDeletion.length})`}
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableImage({
  image,
  index,
  variantMode = false,
  isSelected = false,
  isSelectedForDeletion = false,
  onToggle,
  onDeletionToggle,
  onDeleteClick,
}: {
  image: ProductImage;
  index: number;
  variantMode?: boolean;
  isSelected?: boolean;
  isSelectedForDeletion?: boolean;
  onToggle?: (imageSrc: string) => void;
  onDeletionToggle?: (imageSrc: string) => void;
  onDeleteClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {/* Order number indicator */}
      <div className="absolute left-2 top-2 z-50 rounded bg-blue-500 px-2 py-1 text-xs font-bold text-white">
        {index + 1}
      </div>

      {/* Drag handle indicator - show in both modes */}
      <div className="absolute right-2 top-2 z-50 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        Drag to reorder
      </div>

      {/* Main image container */}
      <div className="relative">
        <div
          className={`group relative overflow-hidden rounded-lg bg-white shadow-md ${
            variantMode && isSelected ? "ring-2 ring-blue-500" : ""
          } ${
            !variantMode && isSelectedForDeletion ? "ring-2 ring-red-500" : ""
          }`}
        >
          <Image
            src={image.src}
            alt={`Image ${image.id}`}
            className="h-40 w-full rounded-lg object-cover"
            height={400}
            width={400}
          />

          {/* Selection overlay for variant mode */}
          {variantMode && (
            <div className="absolute inset-0 z-40 flex items-center justify-center">
              <div
                className={`flex h-full w-full items-center justify-center transition-all ${
                  isSelected
                    ? "bg-blue-500 bg-opacity-30"
                    : "bg-black bg-opacity-0 hover:bg-opacity-10"
                }`}
              >
                {isSelected && (
                  <div className="rounded-full bg-blue-500 p-1 text-white">
                    <BiCheck size={20} />
                  </div>
                )}
              </div>
              {/* Clickable area for selection */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.(image.src);
                }}
                className="absolute inset-0 z-50 cursor-pointer"
              />
            </div>
          )}

          {/* Selection overlay for deletion mode */}
          {!variantMode && (
            <div className="absolute inset-0 z-40 flex items-center justify-center">
              <div
                className={`flex h-full w-full items-center justify-center transition-all ${
                  isSelectedForDeletion
                    ? "bg-red-500 bg-opacity-30"
                    : "bg-black bg-opacity-0 hover:bg-opacity-10"
                }`}
              >
                {isSelectedForDeletion && (
                  <div className="rounded-full bg-red-500 p-1 text-white">
                    <BiCheck size={20} />
                  </div>
                )}
              </div>
              {/* Clickable area for deletion selection */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletionToggle?.(image.src);
                }}
                className="absolute inset-0 z-50 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Drag handle - positioned outside the image but inside the container - show in both modes */}
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 -top-2 z-50 h-6 w-6 cursor-grab rounded-full bg-gray-800 bg-opacity-80 opacity-0 transition-opacity hover:bg-opacity-100 active:cursor-grabbing group-hover:opacity-100"
        >
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </div>

        {/* Delete button - only show in non-variant mode */}
        {!variantMode && !isSelectedForDeletion && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            className="absolute -right-2 -top-2 z-50 h-8 w-8 rounded-full bg-red-500 p-0 opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
            size="sm"
          >
            <BiSolidTrash size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
