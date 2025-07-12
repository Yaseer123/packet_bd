import fs from "fs";
import { getAllProductSlugs } from "./scripts/getAllProductSlugs.js";

/** @type {string[]} */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const staticRoutes = JSON.parse(
  fs.readFileSync("./scripts/staticRoutes.json", "utf-8"),
);

if (
  !Array.isArray(staticRoutes) ||
  !staticRoutes.every((r) => typeof r === "string")
) {
  throw new Error("staticRoutes must be an array of strings");
}

export default {
  siteUrl: process.env.NEXTAUTH_URL ?? "https://rinors.com",
  generateRobotsTxt: true,
  exclude: ["/admin", "/admin/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin", "/admin/*"] },
    ],
  },
  /**
   * @param {import('next-sitemap').IConfig} config
   */
  async additionalPaths(config) {
    // Add static routes, exclude admin
    const staticPaths = staticRoutes
      .filter((route) => !route.startsWith("/admin"))
      .map((route) => ({
        loc: route.startsWith("/") ? route : `/${route}`,
        changefreq: "weekly",
        priority: 0.7,
      }));

    // Add dynamic product routes from DB
    const slugs = await getAllProductSlugs();
    const productPaths = slugs.map((slug) => ({
      loc: `/products/${slug}`,
      changefreq: "daily",
      priority: 0.7,
    }));

    return [...staticPaths, ...productPaths];
  },
};
