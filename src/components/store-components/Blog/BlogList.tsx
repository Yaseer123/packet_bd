import { api } from "@/trpc/react";
import BlogItem from "./BlogItem";
import HandlePagination from "../HandlePagination";
import { useEffect, useState } from "react";

export default function BlogList({ tag }: { tag: string | null | undefined }) {
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 4;
  const offset = currentPage * productsPerPage;

  const [blogPosts] = api.post.getAllPretty.useSuspenseQuery({
    tag: tag ?? undefined,
  });

  const pageCount = Math.ceil(blogPosts.length / productsPerPage);
  const currentBlogs = blogPosts.slice(offset, offset + productsPerPage);

  useEffect(() => {
    if (pageCount === 0 && currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [pageCount, currentPage]);

  return (
    <>
      <div className="list-blog flex flex-col gap-8 xl:gap-10">
        {currentBlogs.map((item) => (
          <BlogItem key={item.id} data={item} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="list-pagination mt-6 flex w-full items-center md:mt-10">
          <HandlePagination
            pageCount={pageCount}
            onPageChange={(selected) => setCurrentPage(selected)}
          />
        </div>
      )}
    </>
  );
}
