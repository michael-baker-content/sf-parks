import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogSlideshow } from "../../../components/BlogSlideshow";
import { formatBlogDate, getBlogPost, getBlogPosts, getBlogPostSlides } from "../../../src/lib/blog-posts";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return { title: "Update not found" };

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();
  const slides = getBlogPostSlides(post);

  return <article className="app-blog-post">
    <Link className="usa-back-link" href="/blog/">Back to all updates</Link>
    <header className="app-blog-post__header">
      <p className="app-eyebrow">Project update</p>
      <h1>{post.title}</h1>
      <p className="app-blog-date">Published <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time></p>
      <p className="app-lede">{post.summary}</p>
    </header>

    {slides.length ? <BlogSlideshow slides={slides} /> : null}

    <div className="app-blog-post__body" dangerouslySetInnerHTML={{ __html: post.html }} />

    {post.actionHref && post.actionLabel ? <p className="app-blog-post__action"><Link className="usa-button" href={post.actionHref}>{post.actionLabel}</Link></p> : null}
  </article>;
}
