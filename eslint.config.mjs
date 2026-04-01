import js from "@eslint/js";
import globals from "globals";
import jest from "eslint-plugin-jest";

export default [
  js.configs.recommended,

  // Ignore EJS
  {
    ignores: ["views/**/*.ejs"],
  },

  // Backend (Node)
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Frontend scripts (browser)
  {
    files: ["public/scripts/**/*.js"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Jest tests
  {
    files: ["__tests__/**/*.js"],
    plugins: { jest },
    languageOptions: {
      globals: globals.jest,
    },
  },
];