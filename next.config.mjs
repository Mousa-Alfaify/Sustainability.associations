/**
 * عند البناء لنشر GitHub Pages تُضبط GITHUB_PAGES=true في سير عمل الإجراءات،
 * فيُصدَّر الموقع كملفات ثابتة تحت مسار المستودع.
 * أما محليًا فيبقى التطوير على http://localhost:3000 بدون بادئة مسار.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repository = "/Sustainability.associations";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isGithubPages
    ? {
        output: "export",
        basePath: repository,
        assetPrefix: repository,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
