"use client";

import { removeImage, uploadFile } from "@/app/actions/file";
import { api } from "@/trpc/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define a type for Slider
interface Slider {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imageId: string;
  link: string;
  autoSlideTime: number;
}

export const SliderManager = () => {
  const { data: sliders, refetch } = api.slider.getAll.useQuery();
  const addSlider = api.slider.add.useMutation({ onSuccess: () => refetch() });
  const updateSlider = api.slider.update.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteSlider = api.slider.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [editingSlider, setEditingSlider] = useState<{
    id?: string;
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    imageId: string;
    link: string;
    autoSlideTime: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState<string>("");

  useEffect(() => {
    if (editingSlider) {
      setSelectedImageName("");
    }
  }, [editingSlider]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      // Delete existing image if updating
      if (editingSlider?.imageId) {
        await removeImage(editingSlider.imageId);
      }

      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadFile(formData, "slider-images");

      if (!result) {
        throw new Error("Failed to upload image");
      }

      setEditingSlider((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: result.secure_url,
              imageId: result.public_id,
            }
          : null,
      );
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingSlider) return;

    if (!editingSlider.imageUrl) {
      toast.error("Please upload an image");
      return;
    }

    try {
      if (editingSlider.id) {
        await updateSlider.mutateAsync({
          id: editingSlider.id,
          title: editingSlider.title,
          subtitle: editingSlider.subtitle,
          description: editingSlider.description,
          imageUrl: editingSlider.imageUrl,
          imageId: editingSlider.imageId,
          link: editingSlider.link,
          autoSlideTime: editingSlider.autoSlideTime,
        });
        toast.success("Slider updated successfully");
      } else {
        await addSlider.mutateAsync({
          title: editingSlider.title,
          subtitle: editingSlider.subtitle,
          description: editingSlider.description,
          imageUrl: editingSlider.imageUrl,
          imageId: editingSlider.imageId,
          link: editingSlider.link,
          autoSlideTime: editingSlider.autoSlideTime,
        });
        toast.success("Slider created successfully");
      }
      setEditingSlider(null);
    } catch (error: unknown) {
      console.error("Failed to save slider:", error);
      toast.error("Failed to save slider");
    }
  };

  const handleDelete = async (slider: {
    id?: string;
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    imageId: string;
    link: string;
    autoSlideTime: number;
  }) => {
    if (!slider?.id || !slider.imageId) return;

    if (!confirm("Are you sure you want to delete this slider?")) return;

    try {
      await removeImage(slider.imageId);
      await deleteSlider.mutateAsync({ id: slider.id });
      toast.success("Slider deleted successfully");
    } catch (error) {
      console.error("Failed to delete slider:", error);
      toast.error("Failed to delete slider");
    }
  };
  return (
    <>
      <div className="mb-8">
        <button
          onClick={() =>
            setEditingSlider({
              title: "",
              subtitle: "",
              description: "",
              imageId: "",
              imageUrl: "",
              link: "",
              autoSlideTime: 4000,
            })
          }
          className="rounded-lg bg-black px-6 py-2.5 text-white transition-colors duration-200 hover:bg-black/75 hover:bg-gray-800"
        >
          Add New Slide
        </button>
      </div>

      {editingSlider && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            {editingSlider.id ? "Edit Slide" : "New Slide"}
          </h2>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={editingSlider.title}
                onChange={(e) =>
                  setEditingSlider({
                    ...editingSlider,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3 transition-colors duration-200 focus:border-black focus:ring-black"
                placeholder="Enter title"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subtitle
              </label>
              <input
                type="text"
                placeholder="Enter subtitle"
                value={editingSlider.subtitle}
                onChange={(e) =>
                  setEditingSlider({
                    ...editingSlider,
                    subtitle: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3 transition-colors duration-200 focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                placeholder="Enter description"
                value={editingSlider.description}
                onChange={(e) =>
                  setEditingSlider({
                    ...editingSlider,
                    description: e.target.value,
                  })
                }
                className="min-h-[100px] w-full rounded-lg border-gray-200 p-3 transition-colors duration-200 focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedImageName(file.name);
                    await handleImageUpload(file);
                  }
                }}
                className="w-full cursor-pointer rounded-lg border border-gray-200 p-3"
                disabled={uploading}
              />
              <div className="mt-1 text-xs text-gray-400">
                Recommended size: 2000x1333px or larger, 3:2 aspect ratio
              </div>
              {selectedImageName ? (
                <div className="mt-1 text-sm text-gray-500">
                  Selected: {selectedImageName}
                </div>
              ) : (
                editingSlider?.imageUrl && (
                  <div className="mt-1 text-sm text-gray-500">
                    Current image: {editingSlider.imageUrl.split("/").pop()}
                  </div>
                )
              )}
              {uploading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              )}
            </div>
            {editingSlider.imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={editingSlider.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Link *
              </label>
              <input
                type="text"
                placeholder="Enter link"
                value={editingSlider.link}
                onChange={(e) =>
                  setEditingSlider({
                    ...editingSlider,
                    link: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3 transition-colors duration-200 focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Auto Slide Time (ms)
              </label>
              <input
                type="number"
                min={1000}
                step={100}
                value={editingSlider.autoSlideTime}
                onChange={(e) =>
                  setEditingSlider({
                    ...editingSlider,
                    autoSlideTime: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3 transition-colors duration-200 focus:border-black focus:ring-black"
                placeholder="Enter auto slide time in ms (e.g. 4000)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="rounded-lg bg-black px-6 py-2.5 text-white transition-colors duration-200 hover:bg-black/75 hover:bg-gray-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingSlider(null);
                  setSelectedImageName("");
                }}
                className="rounded-lg bg-gray-100 px-6 py-2.5 text-gray-700 transition-colors duration-200 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sliders?.map(
          (slider: {
            link: string | null;
            id: string;
            title: string | null;
            imageId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            imageUrl: string;
            subtitle: string | null;
            autoSlideTime: number | null;
          }) => {
            const safeSlider: Slider = {
              id: slider.id,
              title: typeof slider.title === "string" ? slider.title : "",
              subtitle:
                typeof slider.subtitle === "string" ? slider.subtitle : "",
              description:
                typeof slider.description === "string"
                  ? slider.description
                  : "",
              imageUrl:
                typeof slider.imageUrl === "string" ? slider.imageUrl : "",
              imageId: typeof slider.imageId === "string" ? slider.imageId : "",
              link: typeof slider.link === "string" ? slider.link : "",
              autoSlideTime:
                typeof slider.autoSlideTime === "number"
                  ? slider.autoSlideTime
                  : 4000,
            };
            return (
              <div
                key={safeSlider.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
                  <Image
                    src={safeSlider.imageUrl}
                    alt={safeSlider.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {safeSlider.title}
                </h3>
                <p className="mb-4 text-gray-600">{safeSlider.subtitle}</p>
                <a
                  href={safeSlider.link}
                  target="_blank"
                  className="mb-4 block truncate text-gray-900 transition-colors duration-200 hover:text-gray-600"
                >
                  {safeSlider.link}
                </a>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingSlider({ ...safeSlider })}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => await handleDelete({ ...safeSlider })}
                    className="rounded-lg bg-black px-4 py-2 text-white transition-colors duration-200 hover:bg-black/75 hover:bg-gray-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          },
        )}
      </div>
    </>
  );
};
