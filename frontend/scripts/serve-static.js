/** Purpose: Serve the built static Feijoa frontend for local verification. */
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
};

if (!fs.existsSync(buildDir)) {
  require("./build-static");
}

http
  .createServer((request, response) => {
    const cleanUrl = decodeURIComponent(request.url.split("?")[0]);
    const requestedPath = cleanUrl === "/" ? "/index.html" : cleanUrl;
    let filePath = path.join(buildDir, requestedPath);
    if (!filePath.startsWith(buildDir) || !fs.existsSync(filePath)) {
      filePath = path.join(buildDir, "index.html");
    }
    const ext = path.extname(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  })
  .listen(port, () => {
    console.log(`Feijoa frontend running at http://localhost:${port}`);
  });
