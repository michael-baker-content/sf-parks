import type { Metadata } from "next";
import Link from "next/link";
import { formatBlogDate, getBlogPosts } from "../../src/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Updates about new park information, search tools, and other additions to SF Parks Explorer.",
};

export default function BlogPage() {
  const blogPosts = getBlogPosts();
  return <div className="app-blog">
    <header className="app-blog__header">
      <p className="app-eyebrow">Project news</p>
      <h1>Park updates</h1>
      <p className="app-lede">Follow new destination research, improved browsing tools, and other additions that help people plan a park visit.</p>
    </header>

    <section aria-labelledby="latest-updates">
      <h2 id="latest-updates">Latest updates</h2>
      <div className="app-blog-list">
        {blogPosts.map((post) => <article className="app-blog-card" key={post.slug}>
          <p className="app-blog-date"><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time></p>
          <h3><Link href={`/blog/${post.slug}/`}>{post.title}</Link></h3>
          <p>{post.summary}</p>
          <Link className="app-blog-card__link" href={`/blog/${post.slug}/`} aria-label={`Read ${post.title}`}>Read update <span aria-hidden="true">→</span></Link>
        </article>)}
      </div>
    </section>
  </div>;
}
