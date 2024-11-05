import path from "path";
import * as glob from "glob";

export default {
  root: path.join(__dirname, "."),
  base: "/Milky.js/",
  build: {
    outDir: path.join(__dirname, "docs"),
    emptyOutDir: true, // also necessary
  },
};