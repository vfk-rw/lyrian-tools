import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Base JS/TS config
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  // Global variables
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  // Ignore build and generated directories
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
  // TypeScript config
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { ...tseslint.plugins },
    extends: [
      ...tseslint.configs.recommended
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
  },
  // React config
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { ...pluginReact.plugins },
    extends: [
      pluginReact.configs.flat.recommended
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Disable rule: React must be in scope for JSX (not needed in React 17+)
      "react/react-in-jsx-scope": "off",
      // Disable prop-types rule for TypeScript projects
      "react/prop-types": "off",
    },
  }
]);