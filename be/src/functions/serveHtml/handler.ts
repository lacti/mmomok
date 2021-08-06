import "source-map-support/register";

import * as fs from "fs";
import * as path from "path";

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { contentType } from "mime-types";

const resourceRoot = "pages";

const indexHtml = "index.html";
const textTypes = [".css", ".html", ".js", ".json", ".map", ".svg", ".txt"];

function translateToBundlePath(requestUrl: string): string {
  let maybe = requestUrl;
  while (maybe.startsWith("/")) {
    maybe = maybe.substr(1);
  }
  return maybe || indexHtml;
}

function resolveBundlePath(requestUrl: string): string | null {
  const requestPath = translateToBundlePath(requestUrl);
  const resourceFilePath = path.join(resourceRoot, requestPath);
  console.trace(
    { requestPath, resourceFilePath },
    "Find a static resource to serve"
  );
  if (fs.existsSync(resourceFilePath)) {
    return resourceFilePath;
  }
  const extname = path.extname(resourceFilePath);
  if (extname !== "" && extname !== ".html") {
    return null;
  }
  // To use react-router, return "index.html" if it requests any html resources.
  const indexFilePath = path.join(resourceRoot, indexHtml);
  console.trace(
    { requestPath, indexFilePath },
    "Resolve as index due to not exist"
  );
  return indexFilePath;
}

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  const resourceFilePath = resolveBundlePath(event.rawPath);
  if (!resourceFilePath) {
    return { statusCode: 404, body: "" };
  }
  const toBase64 = !textTypes.some((ext) => resourceFilePath.endsWith(ext));
  const fileContent = fs
    .readFileSync(resourceFilePath)
    .toString(toBase64 ? "base64" : "utf-8");
  const seoable = resourceFilePath.endsWith(indexHtml);
  const fileSize = seoable
    ? Buffer.from(fileContent, "utf-8").byteLength
    : fs.lstatSync(resourceFilePath).size;
  return {
    statusCode: 200,
    headers: {
      "Content-Type":
        contentType(path.basename(resourceFilePath)) ||
        "application/octet-stream",
      "Content-Length": fileSize,
      "Cache-Control": `public, max-age=${
        resourceFilePath.endsWith(".html") ? 10 * 60 : 30 * 24 * 60 * 60
      }`,
    },
    body: fileContent,
    isBase64Encoded: toBase64,
  };
};
