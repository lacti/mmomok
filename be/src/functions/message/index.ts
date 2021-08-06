import defineFunction from "../defineFunction";

export default defineFunction(__dirname, {
  handler: "handler.main",
  timeout: 5,
  memorySize: 256,
  events: [
    {
      websocket: {
        route: "$default",
      },
    },
  ],
});
