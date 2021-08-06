import defineFunction from "../defineFunction";

export default defineFunction(__dirname, {
  handler: "handler.main",
  events: [
    {
      httpApi: {
        method: "get",
        path: "/",
      },
    },
    {
      httpApi: {
        method: "get",
        path: "/{file}",
      },
    },
    {
      httpApi: {
        method: "get",
        path: "/static/{file}",
      },
    },
    {
      httpApi: {
        method: "get",
        path: "/static/css/{file}",
      },
    },
    {
      httpApi: {
        method: "get",
        path: "/static/js/{file}",
      },
    },
    {
      httpApi: {
        method: "get",
        path: "/static/media/{file}",
      },
    },
  ],
});
