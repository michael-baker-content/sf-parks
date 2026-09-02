import registry from "../../data/media/blob-assets.json";

const assetsByLocalPath = new Map(registry.assets.map((asset) => [asset.localPath, asset]));

export function resolveMediaAsset(localPath, fallbackWidth, fallbackHeight) {
  const asset = assetsByLocalPath.get(localPath);
  if (!asset?.variants?.length) {
    return { src: localPath, srcSet: undefined, width: fallbackWidth, height: fallbackHeight };
  }
  const variants = [...asset.variants].sort((first, second) => first.width - second.width);
  const largest = variants.at(-1);
  return {
    src: largest.url,
    srcSet: variants.map((variant) => `${variant.url} ${variant.width}w`).join(", "),
    width: largest.width,
    height: largest.height,
  };
}

export function resolveRequiredMediaAsset(localPath) {
  const asset = assetsByLocalPath.get(localPath);
  if (!asset?.variants?.length) throw new Error(`No Vercel Blob asset is registered for ${localPath}.`);
  const largest = [...asset.variants].sort((first, second) => first.width - second.width).at(-1);
  return resolveMediaAsset(localPath, largest.width, largest.height);
}
