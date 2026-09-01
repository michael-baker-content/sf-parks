import { createContentCollectionPlugin } from "@content-collections/next";
import { fileURLToPath } from "node:url";

const withContentCollections = createContentCollectionPlugin({
  configPath: fileURLToPath(new URL("./content-collections.ts", import.meta.url)),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
};

export default withContentCollections(nextConfig);
