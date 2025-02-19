import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.ts"],
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "coverage/**",
      "temp.js",
      "config/*",
    ],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettierConfig,
];
