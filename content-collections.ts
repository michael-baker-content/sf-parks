import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";
import { z } from "zod";

const blogPosts = defineCollection({
  name: "blogPosts",
  directory: "content/blog",
  include: "**/*.md",
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    actionLabel: z.string().min(1).optional(),
    actionHref: z.string().min(1).optional(),
    content: z.string(),
  }),
  transform: async (post, context) => ({
    ...post,
    slug: post._meta.path,
    html: await compileMarkdown(context, post),
  }),
});

export default defineConfig({
  content: [blogPosts],
});
