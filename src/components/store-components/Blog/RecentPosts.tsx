import { api } from "@/trpc/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RecentPosts() {
  const router = useRouter();
  const [recentPosts] = api.post.getAllPretty.useSuspenseQuery({});

  const handleBlogClick = (blogId: string, slug: string) => {
    router.push(`/blog/${slug}?id=${blogId}`);
  };

  return (
    <div className="recent mt-6 border-b border-[#ddd] pb-8 focus:border-[#ddd] md:mt-10">
      <div className="heading6">Recent Posts</div>
      <div className="list-recent pt-1">
        {recentPosts.slice(0, 3).map((item) => (
          <div
            className="item mt-5 flex cursor-pointer gap-4"
            key={item.id}
            onClick={() => handleBlogClick(item.id, item.slug)}
          >
            <Image
              src={item.coverImageUrl}
              width={500}
              height={400}
              alt="blog cover image"
              className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
            />
            <div>
              <div
                className="blog-tag bg-green inline-block overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold uppercase leading-5"
                style={{ maxWidth: "150px" }}
              >
                {item.tags.map((tag) => tag.name).join(", ")}
              </div>
              <div className="text-title mt-1">{item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
