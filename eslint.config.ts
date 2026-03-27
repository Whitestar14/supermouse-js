import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.cache/**",
      "**/.env*",
      "**/generated-plugins.json",
      "**/.vscode/**",
      "**/.idea/**",
      "**/.DS_Store",
      "**/Thumbs.db",
      "**/public/**"
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],

  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        console: "readonly"
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Vue Rules
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
      "vue/component-definition-name-casing": "off",

      // TypeScript Rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      "no-debugger": "warn",
      "object-shorthand": "warn",
      "prefer-const": "warn",
      "no-var": "error"
    }
  }
);
