import ParseContent from "@/components/store-components/Blog/ParseContent";
import { api } from "@/trpc/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const blogId = (await searchParams).id as string;

  if (!blogId) {
    return {
      title: "Blog",
      description: "Explore our latest blog posts.",
    };
  }

  const blogMain = await api.post.getOne({ id: blogId });

  if (!blogMain) {
    return {
      title: "Blog",
      description: "Explore our latest blog posts.",
    };
  }

  return {
    title: blogMain.title,
    description: blogMain.shortDescription,
  };
}

export default async function BlogDetailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const blogId = (await searchParams).id as string;

  if (!blogId) {
    return redirect("/blog");
  }

  const blogMain = await api.post.getOne({ id: blogId });

  if (!blogMain) {
    return redirect("/blog");
  }

  return (
    <div className="blog">
      <div className="bg-img mt-14 md:mt-[74px]">
        <Image
          src={blogMain.coverImageUrl}
          width={5000}
          height={4000}
          alt="Blog cover image"
          className="h-[260px] w-full object-cover sm:h-[380px] lg:h-[520px] xl:h-[640px] min-[1600px]:h-[800px]"
        />
      </div>
      <div className="mx-auto w-full !max-w-[1322px] px-4 pt-10 md:pt-20">
        <div className="blog-content flex items-center justify-center">
          <div className="main w-full md:w-5/6">
            <div className="blog-tag bg-green inline-block rounded-full px-2.5 py-1 text-sm font-semibold uppercase leading-5">
              {blogMain.tags.map((tag) => tag.name).join(", ")}
            </div>
            <div className="mt-3 text-[36px] font-semibold capitalize leading-[40px] md:text-[20px] md:leading-[28px] lg:text-[30px] lg:leading-[38px]">
              {blogMain.title}
            </div>
            <div className="author mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-base font-normal leading-[22] text-secondary md:text-[13px] md:leading-5">
                  by {blogMain.createdBy.name}
                </div>
                <div className="line h-px w-5 bg-secondary"></div>
                <div className="text-base font-normal leading-[22] text-secondary md:text-[13px] md:leading-5">
                  {new Date(blogMain.updatedAt)
                    .toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </div>
              </div>
            </div>
            <div className="content mt-5 md:mt-8">
              <div className="body1">{blogMain.shortDescription}</div>
              <ParseContent content={blogMain.content} />
            </div>
            <div className="action mt-5 flex w-full items-center justify-end p-4 md:mt-8">
              <div className="right ml-auto flex flex-wrap items-center gap-3">
                <p>Share:</p>
                <div className="list flex flex-wrap items-center gap-3">
                  <Link
                    href={"https://www.facebook.com/"}
                    target="_blank"
                    className="bg-surface flex h-10 w-10 items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                  >
                    <div className="icon-facebook duration-100"></div>
                  </Link>
                  <Link
                    href={"https://www.instagram.com/"}
                    target="_blank"
                    className="bg-surface flex h-10 w-10 items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                  >
                    <div className="icon-instagram duration-100"></div>
                  </Link>
                  <Link
                    href={"https://www.twitter.com/"}
                    target="_blank"
                    className="bg-surface flex h-10 w-10 items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                  >
                    <div className="icon-twitter duration-100"></div>
                  </Link>
                  <Link
                    href={"https://www.youtube.com/"}
                    target="_blank"
                    className="bg-surface flex h-10 w-10 items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                  >
                    <div className="icon-youtube duration-100"></div>
                  </Link>
                  <Link
                    href={"https://www.pinterest.com/"}
                    target="_blank"
                    className="bg-surface flex h-10 w-10 items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                  >
                    <div className="icon-pinterest duration-100"></div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
