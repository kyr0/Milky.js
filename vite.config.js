import path from "path";

export default {
  root: path.join(__dirname, "."),
  base: "/Milky.js/",
  build: {
    outDir: path.join(__dirname, "docs"),
    emptyOutDir: true, // also necessary
  },
};