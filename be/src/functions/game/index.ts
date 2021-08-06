import defineFunction from "../defineFunction";

export default defineFunction(__dirname, {
  handler: "handler.main",
  timeout: 900,
  memorySize: 1024,
});
