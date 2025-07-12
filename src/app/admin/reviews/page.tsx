"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Star } from "@phosphor-icons/react";
import { useState } from "react";

// Type for review object as returned by getAllReviews
interface ReviewAdmin {
  id: string;
  product: { title: string; id: string };
  user: { name: string | null; image: string | null };
  rating: number;
  comment: string | null;
  createdAt: string;
  visible: boolean;
}

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const {
    data: reviews = [],
    isLoading,
    refetch,
  } = api.review.getAllReviews.useQuery();
  const setReviewVisibility = api.review.setReviewVisibility.useMutation({
    onSuccess: () => void refetch(),
  });
  const deleteReview = api.review.deleteReview.useMutation({
    onSuccess: () => void refetch(),
  });

  // Filter and search logic
  const filteredReviews = (
    Array.isArray(reviews)
      ? reviews.map((review) => ({
          ...review,
          createdAt:
            review.createdAt instanceof Date
              ? review.createdAt.toISOString()
              : review.createdAt,
        }))
      : []
  ) as ReviewAdmin[];
  const searchedReviews = filteredReviews.filter((review) => {
    if (filter === "visible" && !review.visible) return false;
    if (filter === "hidden" && review.visible) return false;
    if (search) {
      const name = review.user?.name ?? "";
      if (name.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
      const productTitle = review.product?.title ?? "";
      if (productTitle.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
      const comment = review.comment ?? "";
      if (comment.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
      return false;
    }
    return true;
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Review Moderation</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by user, product, or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          value={filter}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "all" || value === "visible" || value === "hidden") {
              setFilter(value);
            }
          }}
          className="rounded border px-3 py-2"
        >
          <option value="all">All</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>
      {isLoading ? (
        <div>Loading reviews...</div>
      ) : searchedReviews.length === 0 ? (
        <div>No reviews found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Rating</th>
                <th className="px-4 py-2 text-left">Comment</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchedReviews.map((review) => (
                <tr key={review.id} className="border-t">
                  <td className="px-4 py-2">{review.product?.title ?? "-"}</td>
                  <td className="px-4 py-2">
                    {review.user?.name ?? "Anonymous"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          weight={star <= review.rating ? "fill" : "regular"}
                          className="text-yellow-500"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">{review.comment ?? "-"}</td>
                  <td className="px-4 py-2 text-xs">
                    {new Date(review.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${review.visible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                    >
                      {review.visible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant={review.visible ? "secondary" : "outline"}
                      disabled={setReviewVisibility.isPending}
                      onClick={() =>
                        setReviewVisibility.mutate({
                          reviewId: review.id,
                          visible: !review.visible,
                        })
                      }
                    >
                      {review.visible ? "Hide" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="ml-2"
                      disabled={deleteReview.isPending}
                      onClick={() => deleteReview.mutate(review.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
