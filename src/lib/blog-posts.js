import { allBlogPosts } from "content-collections";
import mediaManifest from "../../data/media/media-manifest.json";
import { resolveRequiredMediaAsset } from "./media-delivery.js";

export const defaultBlogImage = {
  path: "/media/park-image-placeholder.png",
  alt: "Illustration of a landscaped hillside park with a curving path, trees, benches, and bay water under coastal fog.",
};

export function getBlogPosts() {
  return [...allBlogPosts].sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));
}

export function getBlogPost(slug) {
  return getBlogPosts().find((post) => post.slug === slug);
}

export function getBlogPostImage(post) {
  const image = post.image ?? defaultBlogImage;
  return { ...image, ...resolveRequiredMediaAsset(image.path) };
}

export function getBlogPostSlides(post) {
  return (post.gallery ?? []).map((path) => {
    const record = mediaManifest.images.find((image) => image.localPath === path);
    if (!record) throw new Error(`No reviewed media record is available for blog gallery image ${path}.`);
    return { ...record, ...resolveRequiredMediaAsset(path) };
  });
}

export function formatBlogDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
