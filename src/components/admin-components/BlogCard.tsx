import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface BlogBannerProps {
  userId: string;
  blogId: string;
  title: string;
  createdAt: string;
}

const BlogBanner: React.FC<BlogBannerProps> = ({
  userId,
  blogId,
  title,
  createdAt,
}) => {
  const router = useRouter();

  const utils = api.useUtils();
  const deleteBlog = api.post.delete.useMutation({
    onSuccess: async () => {
      toast.success("The post is deleted successfully");
      await utils.post.getAll.invalidate();
    },
  });

  const handleEdit = () => {
    router.push(`/admin/blog/edit/${blogId}`);
  };

  const handleDelete = () => {
    deleteBlog.mutate({ userId, blogId });
  };

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg">
      <Link
        href={`/admin/blog/${blogId}`}
        className="group flex flex-col gap-1"
      >
        <p className="truncate text-lg font-semibold text-gray-900 group-hover:underline">
          {title}
        </p>
        <p className="text-xs text-gray-500">{createdAt}</p>
      </Link>
      <div className="flex w-full flex-col gap-2 self-end sm:w-auto sm:flex-row sm:items-center sm:gap-3">
        <Button onClick={handleEdit} className="w-full sm:w-auto">
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                blog from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-400"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BlogBanner;
