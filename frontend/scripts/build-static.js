/** Purpose: Build the static React frontend and inject the configured backend URL. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const buildDir = path.join(root, "build");
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

fs.rmSync(buildDir, { recursive: true, force: true });
copyDir(publicDir, buildDir);

const indexPath = path.join(buildDir, "index.html");
const html = fs.readFileSync(indexPath, "utf8").replaceAll("__API_URL__", apiUrl);
fs.writeFileSync(indexPath, html);
console.log(`Built static frontend at ${buildDir}`);
