"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, type RouterOutputs } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminQuestionsPage() {
  const {
    data: questions,
    isLoading,
    refetch,
  } = api.question.getAllQuestionsForAdmin.useQuery();
  const answerMutation = api.question.answerQuestion.useMutation();
  const deleteMutation = api.question.deleteQuestion.useMutation();
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [answering, setAnswering] = useState<string | null>(null);

  type AdminQuestion =
    RouterOutputs["question"]["getAllQuestionsForAdmin"][number];

  const handleAnswer = async (id: string) => {
    if (!answerText[id] || answerText[id].trim().length < 5) {
      toast.error("Answer must be at least 5 characters.");
      return;
    }
    try {
      await answerMutation.mutateAsync({
        questionId: id,
        answer: answerText[id].trim(),
      });
      toast.success("Answer submitted.");
      setAnswering(null);
      setAnswerText((prev) => ({ ...prev, [id]: "" }));
      await refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit answer";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      await deleteMutation.mutateAsync({ questionId: id });
      toast.success("Question deleted.");
      await refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete question";
      toast.error(message);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Product Questions</h1>
      {isLoading ? (
        <div className="py-10 text-center text-secondary">
          Loading questions...
        </div>
      ) : !questions || questions.length === 0 ? (
        <div className="py-10 text-center text-secondary">
          No questions found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg border border-gray-200 bg-white shadow-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Question</th>
                <th className="px-4 py-2 text-left">Answer</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q: AdminQuestion) => (
                <tr key={q.id} className="border-t">
                  <td className="px-4 py-2">
                    {q.product?.title ?? q.productId}
                  </td>
                  <td className="px-4 py-2">{q.user?.name ?? "User"}</td>
                  <td className="max-w-xs break-words px-4 py-2">
                    {q.question}
                  </td>
                  <td className="px-4 py-2">
                    {q.answer ? (
                      <div className="text-green-700">{q.answer}</div>
                    ) : answering === q.id ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={answerText[q.id] ?? ""}
                          onChange={(e) =>
                            setAnswerText((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Type your answer..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAnswer(q.id)}
                            disabled={answerMutation.isPending}
                          >
                            {answerMutation.isPending
                              ? "Submitting..."
                              : "Submit"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAnswering(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setAnswering(q.id)}>
                        Reply
                      </Button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(q.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(q.id)}
                      disabled={deleteMutation.isPending}
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
