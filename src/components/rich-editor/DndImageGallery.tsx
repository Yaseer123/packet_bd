"use client";

import { removeImage, uploadFile } from "@/app/actions/file";
import {
  type ProductImage,
  useProductImageStore,
} from "@/context/admin-context/ProductImageProvider";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { BiCheck, BiSolidTrash } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
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

  const handleClose = () => {
    onClose("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      // Update the order in state
      const reorderedImages = arrayMove(images, oldIndex, newIndex);
      setImages(reorderedImages);

      console.log(
        "Images reordered:",
        reorderedImages.map((img) => img.src),
      );
    }
  };

  const handleImageToggle = (imageSrc: string) => {
    if (onImageSelect) {
      const isSelected = selectedImages.includes(imageSrc);
      onImageSelect(imageSrc, !isSelected);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={({ key }) => {
        if (key === "Escape") handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm hover:bg-black/75"
    >
      <div className="relative h-[80%] w-[80%] overflow-y-auto rounded-md bg-white p-4 md:w-[760px]">
        <div className="absolute right-4 top-4 z-50 p-2">
          <button onClick={handleClose}>
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Header for variant mode */}
        {variantMode && colorName && (
          <div className="mb-4 rounded-md bg-blue-50 p-3">
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
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
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

        <div className="mt-4 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          {isUploading && (
            <div className="">
              <div className="aspect-square animate-pulse rounded bg-gray-200"></div>
            </div>
          )}

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images} strategy={rectSortingStrategy}>
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  variantMode={variantMode}
                  isSelected={selectedImages.includes(image.src)}
                  onToggle={handleImageToggle}
                  onDeleteClick={async () => {
                    console.log("test");
                    if (confirm("Are you sure?")) {
                      const id = image.src
                        .split("/")
                        .slice(-2)
                        .join("/")
                        .split(".")[0];
                      if (id) {
                        await removeImage(id);
                      }
                      removeOldImage(image.src);
                    }
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Action buttons for variant mode */}
        {variantMode && (
          <div className="mt-4 flex justify-end gap-2">
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
      </div>
    </div>
  );
}

function SortableImage({
  image,
  variantMode = false,
  isSelected = false,
  onToggle,
  onDeleteClick,
}: {
  image: ProductImage;
  variantMode?: boolean;
  isSelected?: boolean;
  onToggle?: (imageSrc: string) => void;
  onDeleteClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="group relative active:z-50">
      {/* Selection overlay for variant mode */}
      {variantMode && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(image.src);
            }}
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
          </button>
        </div>
      )}

      {/* Delete button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
        className="absolute bottom-0 left-0 right-0 z-50 hidden flex-1 items-center justify-center p-2 text-white group-hover:flex group-active:opacity-0"
      >
        <BiSolidTrash />
      </Button>

      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group relative overflow-hidden rounded-lg bg-white shadow-md ${
          variantMode && isSelected ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <Image
          src={image.src}
          alt={`Image ${image.id}`}
          className="h-40 w-full rounded-lg object-cover"
          height={400}
          width={400}
        />
      </div>
    </div>
  );
}
