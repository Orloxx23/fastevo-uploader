import { fileURLToPath } from "url";
import path from "path";
import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import copy from "rollup-plugin-copy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: [
    alias({
      entries: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    }),
    resolve(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    copy({
      targets: [
        {
          src: "node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js",
          dest: "dist",
          rename: "worker.js",
        },
        {
          src: "node_modules/@ffmpeg/ffmpeg/dist/esm/const.js",
          dest: "dist",
          rename: "const.js",
        },
        {
          src: "node_modules/@ffmpeg/ffmpeg/dist/esm/errors.js",
          dest: "dist",
          rename: "errors.js",
        },
      ],
    }),
  ],
};
