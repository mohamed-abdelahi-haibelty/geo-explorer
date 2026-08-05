import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinary-image-loader.ts",
  },
};

export default nextConfig;
