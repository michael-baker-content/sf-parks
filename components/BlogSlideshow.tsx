"use client";

import { ImageCredit, type CarouselImage, useCarousel } from "./CarouselShared";

export type BlogSlide = CarouselImage;

export function BlogSlideshow({ slides }: { slides: BlogSlide[] }) {
  const { item: slide, move, position } = useCarousel(slides);
  if (!slide) return null;

  return <section className="app-blog-slideshow" aria-labelledby="blog-gallery-title" aria-roledescription="carousel">
    <div className="app-blog-slideshow__heading">
      <h2 id="blog-gallery-title">Photographs from the project</h2>
      <p aria-live="polite" aria-atomic="true">Image {position + 1} of {slides.length}</p>
    </div>
    <figure aria-label={`${position + 1} of ${slides.length}`} aria-roledescription="slide">
      <div className="app-blog-slideshow__frame">
        <img src={slide.src} srcSet={slide.srcSet} sizes="(max-width: 56rem) 100vw, 56rem" width={slide.width} height={slide.height} alt={slide.alt} />
      </div>
      <figcaption>
        <p>{slide.caption}</p>
        <ImageCredit image={slide} className="app-blog-slideshow__credit" />
      </figcaption>
    </figure>
    <div className="app-blog-slideshow__controls">
      <button className="usa-button usa-button--outline" type="button" onClick={() => move(-1)} aria-label="Show previous photograph"><span aria-hidden="true">←</span> Previous</button>
      <button className="usa-button usa-button--outline" type="button" onClick={() => move(1)} aria-label="Show next photograph">Next <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}
