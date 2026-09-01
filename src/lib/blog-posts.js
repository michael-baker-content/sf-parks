import { allBlogPosts } from "content-collections";

export function getBlogPosts() {
  return [...allBlogPosts].sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));
}

export function getBlogPost(slug) {
  return getBlogPosts().find((post) => post.slug === slug);
}

export function formatBlogDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
