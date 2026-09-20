import { allBlogPosts } from "content-collections";
import mediaManifest from "../../data/media/media-manifest.json";
import { resolveRequiredMediaAsset } from "./media-delivery.js";

export const defaultBlogImage = {
  path: "/media/park-image-placeholder.png",
  alt: "Wide lawn at Fort Mason Park with trees, San Francisco Bay, and the Golden Gate Bridge in the distance.",
};

export function getBlogPosts() {
  return [...allBlogPosts].sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));
}

export function getBlogPost(slug) {
  return getBlogPosts().find((post) => post.slug === slug);
}

export function getBlogPostImage(post) {
  const selected = post.image ?? defaultBlogImage;
  const image = mediaManifest.images.some((record) => record.localPath === selected.path && record.visible === false) ? defaultBlogImage : selected;
  return { ...image, ...resolveRequiredMediaAsset(image.path) };
}

export function getBlogPostSlides(post) {
  return (post.gallery ?? []).filter((path) => !mediaManifest.images.some((image) => image.localPath === path && image.visible === false)).map((path) => {
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
