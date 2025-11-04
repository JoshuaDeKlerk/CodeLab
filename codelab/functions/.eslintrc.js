/* eslint-env node */
/* eslint-disable no-undef */
module.exports = {
  root: true,
  env: { node: true, es2021: true },
  extends: ["eslint:recommended", "google"],
  parserOptions: { ecmaVersion: 2021, sourceType: "script" },
  ignorePatterns: [".eslintrc.js", "node_modules/", "lib/"],
  overrides: [
    {
      files: ["index.js"],
      env: { node: true },
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
      },
      rules: {
        // Keep your style rules here
        quotes: ["error", "double"],
        "object-curly-spacing": ["error", "always"],
        "max-len": ["warn", { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true }],
      },
    },
  ],
};
