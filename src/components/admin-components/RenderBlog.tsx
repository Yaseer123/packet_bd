"use client";

import { api } from "@/trpc/react";
import DOMPurify from "dompurify";

export default function RenderBlog({ id }: { id: string }) {
  const [post] = api.post.getOne.useSuspenseQuery({ id: id });

  if (!post) return null;

  return (
    <div
      className="prose prose-sm outline-none sm:prose-base lg:prose-lg xl:prose-2xl"
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
    />
  );
}
