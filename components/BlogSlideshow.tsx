"use client";

import { useState } from "react";

export type BlogSlide = {
  localPath: string;
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  attribution: string;
  filePageUrl: string;
  licenseId: string;
  licenseUrl: string;
};

export function BlogSlideshow({ slides }: { slides: BlogSlide[] }) {
  const [position, setPosition] = useState(0);
  const slide = slides[position];
  if (!slide) return null;

  const move = (offset: number) => setPosition((current) => (current + offset + slides.length) % slides.length);

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
        <p className="app-blog-slideshow__credit"><a href={slide.filePageUrl} rel="external">{slide.attribution} <span aria-hidden="true">↗</span></a> · <a href={slide.licenseUrl} rel="license">{slide.licenseId}</a></p>
      </figcaption>
    </figure>
    <div className="app-blog-slideshow__controls">
      <button className="usa-button usa-button--outline" type="button" onClick={() => move(-1)} aria-label="Show previous photograph"><span aria-hidden="true">←</span> Previous</button>
      <button className="usa-button usa-button--outline" type="button" onClick={() => move(1)} aria-label="Show next photograph">Next <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}
