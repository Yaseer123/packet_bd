"use client";

import { uploadFile } from "@/app/actions/file";
import MultipleSelector, {
  type Option,
} from "@/components/ui/multiple-selector";
import { api } from "@/trpc/react";
import { BLOG_TAG_OPTIONS } from "@/utils/constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import RichEditor from "../rich-editor";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

export default function AddBlogForm({ userId }: { userId: string }) {
  const [value, setValue] = useState<Option[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imageId] = useState(uuid());
  const [published, setPublished] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const name = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setSlug(name);
  }, [setSlug, title]);

  const utils = api.useUtils();
  const addPost = api.post.add.useMutation({
    onSuccess: async () => {
      await utils.post.getAll.invalidate();
      router.push("/admin/blog");
    },
    onError: ({ message }) => {
      console.log(message);
    },
    onSettled: () => {
      setPending(false);
    },
  });
  const handleSubmit = async (content: string) => {
    setPending(true);

    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadFile(formData);
    if (!res) return;

    addPost.mutate({
      imageId: imageId,
      coverImageId: res.public_id,
      coverImageUrl: res.secure_url,
      shortDescription: shortDescription,
      title: title,
      content: content,
      slug: slug,
      createdBy: userId,
      published: published,
      tags: value.map((tag) => ({
        name: tag.label,
        slug: tag.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      })),
    });
  };
  return (
    <RichEditor
      content=""
      handleSubmit={handleSubmit}
      imageId={imageId}
      pending={pending}
      submitButtonText="Create New Post"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            placeholder="Title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            type="text"
            placeholder="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="z-50">
          <Label htmlFor="tags">Tags</Label>
          <MultipleSelector
            value={value}
            onChange={setValue}
            defaultOptions={BLOG_TAG_OPTIONS}
            placeholder="Create new tag..."
            creatable
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                no results found.
              </p>
            }
          />
        </div>
        <div className="cursor-pointer">
          <Label htmlFor="picture">Cover Image</Label>
          <Input
            id="picture"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <Label htmlFor="short-description">Short Description</Label>
          <Textarea
            id="short-description"
            placeholder="Short Description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="publish">Publish</Label>
          <Switch
            id="publish"
            checked={published}
            onCheckedChange={setPublished}
          />
        </div>
      </div>
    </RichEditor>
  );
}
