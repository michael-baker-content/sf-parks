"use client";

import { useState } from "react";

export type CarouselImage = {
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

export function useCarousel<T>(items: T[]) {
  const [storedPosition, setPosition] = useState(0);
  const position = items.length ? storedPosition % items.length : 0;
  const move = (offset: number) => {
    if (items.length) setPosition((current) => (current + offset + items.length) % items.length);
  };
  return { item: items[position], move, position };
}

export function ImageCredit({ image, className }: { image: CarouselImage; className: string }) {
  return <p className={className}><a href={image.filePageUrl} rel="external">{image.attribution} <span aria-hidden="true">↗</span></a> · <a href={image.licenseUrl} rel="license">{image.licenseId}</a></p>;
}
