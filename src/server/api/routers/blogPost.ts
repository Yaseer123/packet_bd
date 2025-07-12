import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const blogPostRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const blogPost = await ctx.db.post.findMany();

    return blogPost;
  }),

  getAllPretty: publicProcedure
    .input(
      z
        .object({
          tag: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findMany({
        where: {
          published: true,
          ...(input?.tag
            ? {
                tags: {
                  some: {
                    slug: input.tag,
                  },
                },
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
        },
      });
    }),

  getOne: publicProcedure
    .input(
      z.object({
        id: z.string().cuid("Invalid post ID"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
        },
      });

      return post;
    }),

  getAllTags: publicProcedure.query(async ({ ctx }) => {
    const tags = await ctx.db.tag.findMany({
      distinct: ["name", "slug"],
      orderBy: {
        name: "asc",
      },
    });
    return tags;
  }),

  // Add a new blog post
  add: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        slug: z.string().min(1, "Slug field can't be empty"),
        shortDescription: z.string(),
        coverImageId: z.string(),
        coverImageUrl: z.string(),
        content: z.string(),
        createdBy: z.string(),
        imageId: z.string(),
        published: z.boolean().default(true),
        tags: z.array(
          z.object({
            name: z.string(),
            slug: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.create({
        data: {
          imageId: input.imageId,
          coverImageId: input.coverImageId,
          coverImageUrl: input.coverImageUrl,
          shortDescription: input.shortDescription,
          title: input.title,
          slug: input.slug,
          content: input.content,
          createdById: input.createdBy,
          published: input.published,
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { slug: tag.slug },
              create: { name: tag.name, slug: tag.slug },
            })),
          },
        },
        include: {
          tags: true,
        },
      });

      return post;
    }),

  edit: adminProcedure
    .input(
      z.object({
        id: z.string().cuid("Invalid post ID"),
        title: z.string().min(3, "Title must be at least 3 characters"),
        slug: z.string().min(1, "Slug field can't be empty"),
        shortDescription: z.string(),
        content: z.string(),
        createdBy: z.string(),
        imageId: z.string(),
        tags: z.array(
          z.object({
            name: z.string(),
            slug: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.update({
        where: { id: input.id },
        data: {
          imageId: input.imageId,
          title: input.title,
          slug: input.slug,
          content: input.content,
          shortDescription: input.shortDescription,
          createdById: input.createdBy,
          tags: {
            set: [], // First disconnect all existing tags
            connectOrCreate: input.tags.map((tag) => ({
              where: { slug: tag.slug },
              create: { name: tag.name, slug: tag.slug },
            })),
          },
        },
        include: {
          tags: true,
        },
      });

      return post;
    }),

  delete: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid("Invalid user id"),
        blogId: z.string().cuid("Invalid blog id"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.post.delete({
        where: { createdById: input.userId, id: input.blogId },
      });
    }),
});
