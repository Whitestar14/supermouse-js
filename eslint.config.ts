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
      "vue/no-setup-props-reactivity-loss": "warn",
      "vue/prefer-import-style-variable-name": "warn",

      // TypeScript Rules - Catch actual bugs
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/explicit-function-return-types": ["warn", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true
      }],

      // Console Rules - Allow warn/error, warn on log
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // Debugging & Code Quality
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "warn",
      "object-shorthand": "warn",
      "prefer-arrow-callback": "warn",
      "prefer-template": "warn",

      // Bug Prevention
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-throw-literal": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-unmodified-loop-condition": "error",
      "no-constant-condition": "warn",
      "no-unreachable": "error",

      // Disabled: Too many false positives
      "no-useless-assignment": "off"
    }
  }
);
