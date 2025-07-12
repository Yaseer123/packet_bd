import AllBlogPosts from "@/components/admin-components/AllPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/server/auth";
import Link from "next/link";

export default async function BlogPosts() {
  const session = await auth();
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">
          You must be logged in to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-14 p-4 md:p-10">
      <div className="mb-8">
        <h1 className="mb-2 text-center text-3xl font-bold">Blog Posts</h1>
        <p className="text-center text-gray-500">
          Manage and create blog posts for your site.
        </p>
      </div>
      <form className="mx-auto flex max-w-xl flex-col items-center gap-4 sm:flex-row">
        <label htmlFor="search" className="sr-only">
          Search blogs by title
        </label>
        <Input
          id="search"
          type="text"
          placeholder="Search blogs by title"
          className="min-w-0 flex-1"
        />
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/blog/create">Create new</Link>
        </Button>
      </form>
      <AllBlogPosts userId={session.user.id} />
    </div>
  );
}
