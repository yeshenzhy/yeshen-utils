/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

function pathResolve(dir: string) {
    return resolve(process.cwd(), ".", dir);
}
export default defineConfig({
    plugins: [vue(), visualizer()],
    build: {
        lib: {
            entry: pathResolve("./src/index.ts"),
            name: "dr-utils",
            formats: ["es", "cjs", "umd"], // 指定打包模式
            fileName: (format) => `dr-utils.${format}.js`,
        },
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external: ["vue", "reflect-metadata","inversify", "class-transformer"],
        },
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
    /** 需要测试的内容 */
    test: {
        environment: "happy-dom",
    },
});
