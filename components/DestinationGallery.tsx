"use client";

import { ImageCredit, type CarouselImage, useCarousel } from "./CarouselShared";

export type DestinationImage = CarouselImage;

type DeliveredPlaceholder = { src: string; srcSet?: string; width: number; height: number };

export function DestinationGallery({ name, images, placeholder }: { name: string; images: DestinationImage[]; placeholder: DeliveredPlaceholder }) {
  const { item: image, move, position } = useCarousel(images);
  if (!image) {
    return <section className="app-gallery app-gallery--placeholder" aria-label={`${name} image`}>
    <figure>
      <div className="app-gallery__frame">
        <img
          src={placeholder.src}
          srcSet={placeholder.srcSet}
          sizes="(max-width: 62rem) 100vw, 62rem"
          width={placeholder.width}
          height={placeholder.height}
          alt="Illustration of a landscaped hillside park with a curving path, trees, benches, and bay water under coastal fog."
        />
      </div>
      <figcaption>
        <p>Placeholder illustration representing San Francisco parkland. A location-specific photo is not yet available.</p>
      </figcaption>
    </figure>
  </section>;
  }
  const multiple = images.length > 1;

  return <section className="app-gallery" aria-label={`${name} photos`} aria-roledescription="carousel">
    <figure aria-label={`${position + 1} of ${images.length}`} aria-roledescription="slide">
      <div className="app-gallery__frame">
        <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 62rem) 100vw, 62rem" width={image.width} height={image.height} alt={image.alt} />
      </div>
      <figcaption>
        <p>{image.caption}</p>
        <ImageCredit image={image} className="app-gallery__credit" />
      </figcaption>
    </figure>
    {multiple && <div className="app-gallery__controls">
      <button className="usa-button usa-button--outline" type="button" onClick={() => move(-1)} aria-label="Show previous photo"><span aria-hidden="true">←</span> <span className="app-gallery__button-label">Previous</span></button>
      <p aria-live="polite" aria-atomic="true">Image {position + 1} of {images.length}</p>
      <button className="usa-button usa-button--outline" type="button" onClick={() => move(1)} aria-label="Show next photo"><span className="app-gallery__button-label">Next</span> <span aria-hidden="true">→</span></button>
    </div>}
  </section>;
}
