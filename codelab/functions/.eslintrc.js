/* eslint-env node */
module.exports = {
  root: true,
  env: { node: true, es2021: true },
  extends: ["eslint:recommended", "google"],
  parserOptions: { ecmaVersion: 2021, sourceType: "script" },
  ignorePatterns: [".eslintrc.js"],
  overrides: [
    {
      files: ["index.js"],
      env: { node: true },
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",   // <-- add this
      },
    },
  ],
  rules: {
    quotes: ["error", "double"],
    "object-curly-spacing": ["error", "always"],
  },
};
