import fs from "fs";
import path from "path";

const ROUTES_DIR = path.join(process.cwd(), "src/app/(store)");

/**
 * Recursively get all static routes from the given directory.
 * @param {string} dir - Directory to scan
 * @param {string} [base] - Base path for route
 * @returns {string[]} Array of route paths
 */
function getRoutes(dir, base = "") {
  /** @type {string[]} */
  let routes = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file.startsWith("(") && file.endsWith(")")) continue; // skip special folders
      routes = routes.concat(getRoutes(fullPath, path.join(base, file)));
    } else if (file === "page.tsx" || file === "page.js") {
      let route = base.replace(/\\/g, "/");
      if (route.endsWith("/(home)")) route = route.replace("/(home)", "/");
      if (route === "") route = "/";
      routes.push(route);
    }
  }
  return routes;
}

const staticRoutes = getRoutes(ROUTES_DIR);
if (!fs.existsSync("scripts")) fs.mkdirSync("scripts");
fs.writeFileSync(
  "scripts/staticRoutes.json",
  JSON.stringify(staticRoutes, null, 2),
);
console.log("Static routes:", staticRoutes);
