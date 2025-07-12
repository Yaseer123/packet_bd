"use client";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RichEditor from "../rich-editor";
import { Input } from "../ui/input";
import MultipleSelector, {
  type Option,
} from "@/components/ui/multiple-selector";
import { BLOG_TAG_OPTIONS } from "@/utils/constants";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export default function EditBlogForm({
  userId,
  blogId,
}: {
  userId: string;
  blogId: string;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [value, setValue] = useState<Option[]>([]);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const [post] = api.post.getOne.useSuspenseQuery({ id: blogId });

  useEffect(() => {
    if (!post) return;
    const { title, slug, shortDescription, tags } = post;
    setTitle(title);
    setSlug(slug);
    setShortDescription(shortDescription);
    setValue(
      tags.map((tag) => ({
        label: tag.name,
        value: tag.slug,
      })),
    );
  }, [post]);

  if (!post) return null;

  const utils = api.useUtils();
  const editPost = api.post.edit.useMutation({
    onSuccess: async () => {
      await utils.post.getOne.invalidate({ id: blogId });
      router.push("/admin/blog");
    },
    onError: ({ message }) => {
      console.log(message);
    },
    onSettled: () => {
      setPending(false);
    },
  });
  const handleSubmit = (content: string) => {
    setPending(true);

    editPost.mutate({
      id: post.id,
      imageId: post.imageId,
      title: title,
      content: content,
      slug: slug,
      shortDescription: shortDescription,
      createdBy: userId,
      tags: value.map((tag) => ({
        name: tag.label,
        slug: tag.value,
      })),
    });
  };
  return (
    <RichEditor
      content={post.content}
      handleSubmit={handleSubmit}
      imageId={post.imageId}
      pending={pending}
      submitButtonText="Update Post"
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
            placeholder="Select tags..."
            creatable
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                no results found.
              </p>
            }
          />
        </div>
        <div className="col-span-full">
          <Label htmlFor="short-description">Short Description</Label>
          <Textarea
            id="short-description"
            placeholder="Short Description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
      </div>
    </RichEditor>
  );
}
