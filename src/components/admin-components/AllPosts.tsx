"use client";

import { api } from "@/trpc/react";
import BlogBanner from "./BlogCard";

export default function AllBlogPosts({ userId }: { userId: string }) {
  const [post] = api.post.getAll.useSuspenseQuery();

  return (
    <div className="mx-auto flex min-h-3.5 w-3/4 flex-col gap-y-4">
      {post.length === 0 ? (
        <div className="mt-10 text-center text-gray-500">
          No blog posts found. Create one now!
        </div>
      ) : (
        post.map((p) => (
          <BlogBanner
            key={p.id}
            userId={userId}
            blogId={p.id}
            createdAt={p.createdAt.toLocaleDateString()}
            title={p.title}
          />
        ))
      )}
    </div>
  );
}
