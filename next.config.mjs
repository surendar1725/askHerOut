/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: "/askHerOut",
  assetPrefix: "/askHerOut",
};

export default nextConfig;
