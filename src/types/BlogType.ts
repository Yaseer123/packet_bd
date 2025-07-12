import type { Tag, Post } from "@prisma/client";

export interface BlogType extends Post {
  tags: Tag[];
  createdBy: {
    id: string;
    name: string | null;
  };
}
