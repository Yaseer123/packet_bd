"use client";

import { removeImage, uploadFile } from "@/app/actions/file";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const EditSaleBanner = () => {
  const { data: banners, refetch } = api.saleBanner.getAll.useQuery();
  const addBanner = api.saleBanner.add.useMutation({
    onSuccess: () => refetch(),
  });
  const updateBanner = api.saleBanner.update.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteBanner = api.saleBanner.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [editingBanner, setEditingBanner] = useState<{
    id?: string;
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    imageId: string;
    link: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState<string>("");

  useEffect(() => {
    if (editingBanner) {
      setSelectedImageName("");
    }
  }, [editingBanner]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      if (editingBanner?.imageId) {
        await removeImage(editingBanner.imageId);
      }

      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadFile(formData, "sale-banner-images");

      if (!result) {
        throw new Error("Failed to upload image");
      }

      setEditingBanner((prev) =>
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
    if (!editingBanner) return;

    if (!editingBanner.imageUrl) {
      toast.error("Please upload an image");
      return;
    }

    try {
      if (editingBanner.id) {
        const {
          id,
          title,
          imageId,
          imageUrl,
          startDate,
          endDate,
          isActive,
          link,
          description,
          subtitle,
        } = editingBanner;
        await updateBanner.mutateAsync({
          id,
          title,
          imageId,
          imageUrl,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive,
          link,
          description,
          subtitle,
        });
        toast.success("Banner updated successfully");
      } else {
        await addBanner.mutateAsync({
          ...editingBanner,
          startDate: new Date(editingBanner.startDate),
          endDate: new Date(editingBanner.endDate),
        });
        toast.success("Banner created successfully");
      }
      setEditingBanner(null);
    } catch (error) {
      console.error("Failed to save banner:", error);
      toast.error("Failed to save banner");
    }
  };

  const handleDelete = async (banner: typeof editingBanner) => {
    if (!banner?.id || !banner.imageId) return;

    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      await removeImage(banner.imageId);
      await deleteBanner.mutateAsync({ id: banner.id });
      toast.success("Banner deleted successfully");
    } catch (error) {
      console.error("Failed to delete banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  return (
    <>
      <div className="mb-8">
        <button
          onClick={() =>
            setEditingBanner({
              title: "",
              subtitle: "",
              description: "",
              imageId: "",
              imageUrl: "",
              link: "",
              startDate: new Date(),
              endDate: new Date(),
              isActive: true,
            })
          }
          className="rounded-lg bg-black px-6 py-2.5 text-white transition-colors duration-200 hover:bg-black/75 hover:bg-gray-800"
        >
          Add New Banner
        </button>
      </div>

      {editingBanner && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            {editingBanner.id ? "Edit Banner" : "New Banner"}
          </h2>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={editingBanner.title}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3"
                placeholder="Enter title"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subtitle
              </label>
              <input
                type="text"
                value={editingBanner.subtitle}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    subtitle: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3"
                placeholder="Enter subtitle"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={editingBanner.description}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3"
                placeholder="Enter subtitle"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingBanner.startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingBanner.startDate ? (
                        format(editingBanner.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingBanner.startDate}
                      onSelect={(date) =>
                        setEditingBanner({
                          ...editingBanner,
                          startDate: date ?? new Date(),
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End Date *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingBanner.endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingBanner.endDate ? (
                        format(editingBanner.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingBanner.endDate}
                      onSelect={(date) =>
                        setEditingBanner({
                          ...editingBanner,
                          endDate: date ?? new Date(),
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                Recommended size: 600x400px, 3:2 aspect ratio
              </div>
            </div>
            {selectedImageName ? (
              <div className="mt-1 text-sm text-gray-500">
                Selected: {selectedImageName}
              </div>
            ) : (
              editingBanner?.imageUrl && (
                <div className="mt-1 text-sm text-gray-500">
                  Current image: {editingBanner.imageUrl.split("/").pop()}
                </div>
              )
            )}
            {editingBanner.imageUrl && (
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg">
                <Image
                  src={editingBanner.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Link
              </label>
              <input
                type="text"
                value={editingBanner.link}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    link: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 p-3"
                placeholder="Enter link URL"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={editingBanner.isActive}
                onChange={(e) =>
                  setEditingBanner({
                    ...editingBanner,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
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
                  setEditingBanner(null);
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
        {banners?.map((banner) => {
          const title = typeof banner.title === "string" ? banner.title : "";
          const subtitle =
            typeof banner.subtitle === "string" ? banner.subtitle : "";
          const description =
            typeof banner.description === "string" ? banner.description : "";
          const imageUrl =
            typeof banner.imageUrl === "string" ? banner.imageUrl : "";
          const imageId =
            typeof banner.imageId === "string" ? banner.imageId : "";
          const link = typeof banner.link === "string" ? banner.link : "";
          const startDate =
            banner.startDate instanceof Date
              ? banner.startDate
              : new Date(banner.startDate);
          const endDate =
            banner.endDate instanceof Date
              ? banner.endDate
              : new Date(banner.endDate);
          const isActive =
            typeof banner.isActive === "boolean" ? banner.isActive : false;

          return (
            <div
              key={banner.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="relative mb-4 aspect-[21/9] w-full overflow-hidden rounded-lg">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mb-2 text-gray-600">{subtitle}</p>
              <div className="mb-4 text-sm text-gray-500">
                <p>
                  Active:{" "}
                  <span
                    className={isActive ? "text-green-600" : "text-red-600"}
                  >
                    {isActive ? "Yes" : "No"}
                  </span>
                </p>
                <p>
                  Duration: {startDate.toLocaleDateString()} -{" "}
                  {endDate.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setEditingBanner({
                      ...banner,
                      title: title ?? "",
                      subtitle: subtitle ?? "",
                      description: description ?? "",
                      link: link ?? "",
                      startDate: startDate,
                      endDate: endDate,
                    })
                  }
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    handleDelete({
                      ...banner,
                      title: title ?? "",
                      subtitle: subtitle ?? "",
                      description: description ?? "",
                      link: link ?? "",
                      startDate: startDate,
                      endDate: endDate,
                    })
                  }
                  className="rounded-lg bg-black px-4 py-2 text-white transition-colors duration-200 hover:bg-black/75 hover:bg-gray-800"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
