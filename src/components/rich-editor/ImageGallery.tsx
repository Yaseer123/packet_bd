"use client";
import { removeImage, uploadFile } from "@/app/actions/file";
import { useImageStore } from "@/context/admin-context/ImageProvider";
import Image from "next/image";
import { type FC, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { IoMdClose } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
import GalleryImage from "../admin-components/GalleryImage";

interface ImageGalleryProps {
  visible: string;
  imageId: string;
  onClose: (state: string) => void;
  onSelect?: (src: string) => void;
}

const ImageGallery: FC<ImageGalleryProps> = ({
  visible,
  imageId,
  onSelect,
  onClose,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { images, updateImages, removeOldImage } = useImageStore();

  const handleClose = () => {
    onClose("");
  };

  const handleSelection = (image: string) => {
    if (onSelect) onSelect(image);
    handleClose();
  };

  if (!visible) return null;

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
                  updateImages([res.secure_url]);
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

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {isUploading && (
            <div className="aspect-square w-full animate-pulse rounded bg-gray-200"></div>
          )}
          {images?.map((item) => {
            return (
              <GalleryImage
                key={item}
                onSelectClick={() => handleSelection(item)}
                onDeleteClick={async () => {
                  if (confirm("Are you sure?")) {
                    const id = item
                      .split("/")
                      .slice(-2)
                      .join("/")
                      .split(".")[0];
                    if (id) {
                      await removeImage(id);
                    }
                    removeOldImage(item);
                  }
                }}
              >
                <Image
                  height={400}
                  width={400}
                  src={item}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </GalleryImage>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
